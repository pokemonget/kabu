#!/usr/bin/env python3
"""
JPX (Japan Exchange Group) 統計情報自動収集スクリプト
3つのデータソースから月次Excelファイルをダウンロードし、JSONに変換・蓄積
"""

import os
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple
import logging

import requests
from bs4 import BeautifulSoup
import pandas as pd
from io import BytesIO

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ターゲットURL
URLS = {
    'market_cap_by_industry': 'https://www.jpx.co.jp/markets/statistics-equities/misc/07.html',
    'market_cap_ranking': 'https://www.jpx.co.jp/markets/statistics-equities/misc/08.html',
    'per_pbr_stats': 'https://www.jpx.co.jp/markets/statistics-equities/misc/04.html',
}

OUTPUT_DIR = 'public/data'
MONTH_MAPPING = {
    '1月': '01', '2月': '02', '3月': '03', '4月': '04',
    '5月': '05', '6月': '06', '7月': '07', '8月': '08',
    '9月': '09', '10月': '10', '11月': '11', '12月': '12'
}


class JPXScraper:
    """JPX統計情報スクレイパー"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_page(self, url: str) -> BeautifulSoup:
        """ページをフェッチしてBeautifulSoupオブジェクトを返す"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None
    
    def extract_excel_links(self, soup: BeautifulSoup) -> Dict[str, str]:
        """ページからExcelファイルのリンクを抽出（月別）"""
        links = {}
        if not soup:
            return links
        
        # ページ内のすべてのリンクを検索
        for link in soup.find_all('a'):
            href = link.get('href', '')
            text = link.get_text(strip=True)
            
            # 月名をチェック
            for month_jp, month_num in MONTH_MAPPING.items():
                if month_jp in text and ('.xlsx' in href or '.xls' in href):
                    # 相対URLの場合は絶対URLに変換
                    if href.startswith('/'):
                        href = 'https://www.jpx.co.jp' + href
                    elif not href.startswith('http'):
                        href = 'https://www.jpx.co.jp/markets/statistics-equities/misc/' + href
                    links[month_num] = href
        
        return links
    
    def download_excel(self, url: str) -> pd.DataFrame:
        """ExcelファイルをダウンロードしてDataFrameに変換"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Excelファイルを読み込む（最初のシートを使用）
            xls = pd.ExcelFile(BytesIO(response.content))
            df = pd.read_excel(BytesIO(response.content), sheet_name=0)
            return df
        except Exception as e:
            logger.error(f"Failed to download/parse Excel from {url}: {e}")
            return None
    
    def extract_date_from_excel(self, df: pd.DataFrame) -> str:
        """ExcelのDataFrameから日付情報を抽出"""
        # 通常、第一行や特定のセルに日付が含まれる
        # 例：「2024年1月」のような形式
        date_pattern = r'(\d{4})[年\s]+(\d{1,2})[月\s]+'
        
        for col in df.columns:
            for val in df[col].astype(str):
                match = re.search(date_pattern, str(val))
                if match:
                    year = match.group(1)
                    month = match.group(2).zfill(2)
                    return f"{year}-{month}"
        
        # 日付が見つからない場合は当月を返す
        today = datetime.now()
        return f"{today.year}-{today.month:02d}"
    
    def load_existing_data(self, filename: str) -> List[Dict[str, Any]]:
        """既存のJSONデータを読み込む"""
        filepath = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load existing data from {filename}: {e}")
        return []
    
    def save_data(self, filename: str, data: List[Dict[str, Any]]):
        """データをJSONファイルに保存"""
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved data to {filepath}")
        except Exception as e:
            logger.error(f"Failed to save data to {filename}: {e}")
    
    def process_market_cap_by_industry(self, df: pd.DataFrame, date: str) -> Dict[str, Any]:
        """業種別時価総額データを処理"""
        try:
            # DataFrameのクリーニング
            df = df.dropna(how='all')
            
            # 通常、業種名と時価総額が含まれるカラムを特定
            # 実際の列名はExcelの構造に依存
            industries = []
            
            for idx, row in df.iterrows():
                row_data = row.dropna()
                if len(row_data) >= 2:
                    # 最初のカラムが業種名、2番目以降が数値データ
                    industry_name = str(row_data.iloc[0]).strip()
                    
                    # 数値を抽出
                    try:
                        value = float(str(row_data.iloc[1]).replace(',', ''))
                        if industry_name and not industry_name.startswith('合計'):
                            industries.append({
                                'date': date,
                                'industry': industry_name,
                                'market_cap': value
                            })
                    except (ValueError, TypeError):
                        continue
            
            return industries
        except Exception as e:
            logger.error(f"Error processing market cap by industry: {e}")
            return []
    
    def process_market_cap_ranking(self, df: pd.DataFrame, date: str) -> List[Dict[str, Any]]:
        """時価総額順位データを処理"""
        try:
            df = df.dropna(how='all')
            
            rankings = []
            for idx, row in df.iterrows():
                row_data = row.dropna()
                if len(row_data) >= 3:
                    try:
                        rank = int(str(row_data.iloc[0]).strip())
                        company = str(row_data.iloc[1]).strip()
                        market_cap = float(str(row_data.iloc[2]).replace(',', ''))
                        
                        if rank > 0 and company:
                            rankings.append({
                                'date': date,
                                'rank': rank,
                                'company': company,
                                'market_cap': market_cap
                            })
                    except (ValueError, TypeError, IndexError):
                        continue
            
            return rankings
        except Exception as e:
            logger.error(f"Error processing market cap ranking: {e}")
            return []
    
    def process_per_pbr_stats(self, df: pd.DataFrame, date: str) -> List[Dict[str, Any]]:
        """PER・PBR統計データを処理"""
        try:
            df = df.dropna(how='all')
            
            stats = []
            for idx, row in df.iterrows():
                row_data = row.dropna()
                if len(row_data) >= 4:
                    try:
                        category = str(row_data.iloc[0]).strip()  # 規模別・業種別
                        per = float(str(row_data.iloc[1]).replace(',', ''))
                        pbr = float(str(row_data.iloc[2]).replace(',', ''))
                        
                        # 4番目のカラムがあれば追加情報として扱う
                        extra_info = str(row_data.iloc[3]).strip() if len(row_data) > 3 else ''
                        
                        if category:
                            stats.append({
                                'date': date,
                                'category': category,
                                'per': per,
                                'pbr': pbr,
                                'extra_info': extra_info
                            })
                    except (ValueError, TypeError, IndexError):
                        continue
            
            return stats
        except Exception as e:
            logger.error(f"Error processing PER/PBR stats: {e}")
            return []
    
    def upsert_data(self, existing: List[Dict], new_data: List[Dict], key_fields: List[str]) -> List[Dict]:
        """既存データと新規データをマージ（Upsert）"""
        # 既存データを辞書に変換
        data_dict = {}
        for item in existing:
            key = tuple(item.get(field) for field in key_fields)
            data_dict[key] = item
        
        # 新規データで更新
        for item in new_data:
            key = tuple(item.get(field) for field in key_fields)
            data_dict[key] = item
        
        # 辞書から配列に変換し、日付でソート
        result = list(data_dict.values())
        result.sort(key=lambda x: x.get('date', ''))
        return result
    
    def scrape_all(self):
        """全データを収集・処理"""
        logger.info("Starting JPX data scraping...")
        
        # 1. 業種別時価総額
        logger.info("Processing market cap by industry...")
        soup = self.fetch_page(URLS['market_cap_by_industry'])
        excel_links = self.extract_excel_links(soup)
        
        market_cap_by_industry_data = self.load_existing_data('market_cap_by_industry.json')
        for month, url in excel_links.items():
            logger.info(f"Downloading {month} data from {url}")
            df = self.download_excel(url)
            if df is not None:
                date = self.extract_date_from_excel(df)
                new_data = self.process_market_cap_by_industry(df, date)
                market_cap_by_industry_data = self.upsert_data(
                    market_cap_by_industry_data,
                    new_data,
                    ['date', 'industry']
                )
        self.save_data('market_cap_by_industry.json', market_cap_by_industry_data)
        
        # 2. 時価総額順位表
        logger.info("Processing market cap ranking...")
        soup = self.fetch_page(URLS['market_cap_ranking'])
        excel_links = self.extract_excel_links(soup)
        
        market_cap_ranking_data = self.load_existing_data('market_cap_ranking.json')
        for month, url in excel_links.items():
            logger.info(f"Downloading {month} ranking data from {url}")
            df = self.download_excel(url)
            if df is not None:
                date = self.extract_date_from_excel(df)
                new_data = self.process_market_cap_ranking(df, date)
                market_cap_ranking_data = self.upsert_data(
                    market_cap_ranking_data,
                    new_data,
                    ['date', 'rank', 'company']
                )
        self.save_data('market_cap_ranking.json', market_cap_ranking_data)
        
        # 3. PER・PBR統計
        logger.info("Processing PER/PBR stats...")
        soup = self.fetch_page(URLS['per_pbr_stats'])
        excel_links = self.extract_excel_links(soup)
        
        per_pbr_stats_data = self.load_existing_data('per_pbr_stats.json')
        for month, url in excel_links.items():
            logger.info(f"Downloading {month} PER/PBR data from {url}")
            df = self.download_excel(url)
            if df is not None:
                date = self.extract_date_from_excel(df)
                new_data = self.process_per_pbr_stats(df, date)
                per_pbr_stats_data = self.upsert_data(
                    per_pbr_stats_data,
                    new_data,
                    ['date', 'category']
                )
        self.save_data('per_pbr_stats.json', per_pbr_stats_data)
        
        logger.info("Scraping completed successfully")


def main():
    """メイン処理"""
    scraper = JPXScraper()
    scraper.scrape_all()


if __name__ == '__main__':
    main()
