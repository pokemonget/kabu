#!/usr/bin/env python3
"""
JPX 統計情報自動収集スクリプト
- 業種別時価総額
- 時価総額順位表
- 規模別・業種別PER/PBR
"""

import os
import json
import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import pandas as pd

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OUTPUT_DIR = 'public/data'
BASE_URL = "https://www.jpx.co.jp"

def download_file(url, save_path):
    """ファイルをダウンロード"""
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(resp.content)
        logger.info(f"Downloaded: {save_path}")
        return True
    except Exception as e:
        logger.error(f"Download failed {url}: {e}")
        return False

def find_latest_excel_links(page_url, keyword="xls"):
    """ページから最新Excelリンクを探す"""
    try:
        resp = requests.get(page_url, timeout=30)
        soup = BeautifulSoup(resp.text, 'html.parser')
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            if keyword in href.lower() and (href.endswith('.xls') or href.endswith('.xlsx')):
                full_url = href if href.startswith('http') else BASE_URL + href
                links.append(full_url)
        # 最新と思われるものを優先（年月が新しいもの）
        return sorted(set(links), reverse=True)[:3]  # 直近数個
    except Exception as e:
        logger.error(f"Failed to parse {page_url}: {e}")
        return []

def process_market_cap_by_industry():
    """業種別時価総額"""
    page_url = "https://www.jpx.co.jp/markets/statistics-equities/misc/07.html"
    links = find_latest_excel_links(page_url)
    if not links:
        logger.warning("No Excel found for industry market cap")
        return []
    
    # 最初のリンクを使う（最新）
    excel_url = links[0]
    temp_file = "temp_industry.xlsx"
    if not download_file(excel_url, temp_file):
        return []
    
    try:
        # Excelのシート構造に合わせて調整（ヘッダー行を確認）
        df = pd.read_excel(temp_file, header=2)  # 必要に応じてheader行番号変更
        # 必要な列を抽出・正規化（実際のExcel列名に合わせて調整）
        data = []
        # 例: 日付列、業種列、時価総額列を処理
        for _, row in df.iterrows():
            # 実際の列名に合わせてカスタマイズ
            if pd.notna(row.iloc[0]):  # 日付など
                data.append({
                    'date': str(row.iloc[0]).strip(),
                    'industry': str(row.iloc[1]).strip() if len(row) > 1 else '',
                    'market_cap': int(row.iloc[2]) if len(row) > 2 and pd.notna(row.iloc[2]) else 0
                })
        return data
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

# 同様に他の関数を実装（market_cap_ranking, per_pbr_stats）
# ページURLとExcel解析ロジックを調整

def save_data(filename: str, data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved {filepath} ({len(data)} records)")

def main():
    logger.info("Starting JPX real data scraping...")
    
    # 1. 業種別時価総額
    industry_data = process_market_cap_by_industry()
    if industry_data:
        save_data('market_cap_by_industry.json', industry_data)
    
    # 2. 時価総額順位（08.html用に同様関数作成）
    # 3. PER/PBR（04.html用）
    
    logger.info("Scraping completed.")

if __name__ == '__main__':
    main()
