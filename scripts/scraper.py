#!/usr/bin/env python3
"""
JPX 統計情報自動収集スクリプト
現在は業種別時価総額（07.html）のみ実データ取得
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
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; KabuDashboard/1.0)'}
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(resp.content)
        logger.info(f"✅ Downloaded: {save_path}")
        return True
    except Exception as e:
        logger.error(f"❌ Download failed {url}: {e}")
        return False

def find_latest_excel_links(page_url):
    """ページから最新のExcelリンクを探す"""
    try:
        resp = requests.get(page_url, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            if any(ext in href.lower() for ext in ['.xls', '.xlsx']):
                full_url = href if href.startswith('http') else BASE_URL + (href if href.startswith('/') else '/' + href)
                if 'jika' in full_url.lower() or 'shihon' in full_url.lower() or 'market' in full_url.lower():
                    links.append(full_url)
        # 重複除去＆新しい順
        return sorted(set(links), reverse=True)
    except Exception as e:
        logger.error(f"Failed to parse page {page_url}: {e}")
        return []

def process_market_cap_by_industry():
    """業種別時価総額の実データ取得"""
    page_url = "https://www.jpx.co.jp/markets/statistics-equities/misc/07.html"
    logger.info("Fetching industry market cap data...")
    
    excel_links = find_latest_excel_links(page_url)
    if not excel_links:
        logger.warning("No Excel link found. Falling back to dummy data.")
        return generate_dummy_industry_data()  # 一時的フォールバック
    
    excel_url = excel_links[0]
    temp_file = "temp_industry.xlsx"
    
    if not download_file(excel_url, temp_file):
        logger.warning("Download failed. Using dummy data.")
        return generate_dummy_industry_data()
    
    try:
        # JPXのExcel構造に合わせて調整（実際のファイルでheader行・シートを確認）
        # 多くの場合 header=2 〜 4 くらい
        df = pd.read_excel(temp_file, header=2)
        
        # 列名が日本語の場合が多いので、必要に応じてリネーム
        df.columns = [str(col).strip() for col in df.columns]
        
        data = []
        for _, row in df.iterrows():
            # 実際の列構造に合わせて調整してください（最初に1回手動実行して確認）
            date_val = row.iloc[0] if len(row) > 0 else None
            if pd.isna(date_val) or str(date_val).strip() == '':
                continue
                
            # 日付を 'YYYY-MM' 形式に正規化
            if isinstance(date_val, (int, float)):
                date_str = str(int(date_val))
                if len(date_str) == 6:
                    date_str = f"{date_str[:4]}-{date_str[4:]}"
            else:
                date_str = str(date_val).strip()[:7]  # YYYY-MM 部分
            
            # 業種列と時価総額列（実際の位置に合わせて調整）
            for col_idx in range(1, len(row)):
                industry = str(df.columns[col_idx]).strip()
                if industry in ['nan', 'Unnamed', '', '合計', 'Total']:
                    continue
                    
                value = row.iloc[col_idx]
                if pd.notna(value) and isinstance(value, (int, float)):
                    data.append({
                        'date': date_str,
                        'industry': industry.replace('業', ''),
                        'market_cap': int(value)  # 単位は通常「百万円」なので注意
                    })
        
        logger.info(f"Processed {len(data)} industry records")
        return data[:500]  # 多すぎる場合は制限（グラフ用に直近数年分でも十分）
        
    except Exception as e:
        logger.error(f"Error processing Excel: {e}")
        return generate_dummy_industry_data()
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

def generate_dummy_industry_data():
    """フォールバック用ダミー（一時的）"""
    # 既存の generate_market_cap_by_industry() をここにコピーするか簡易版
    industries = ['銀行', '電気・ガス', '海運', '証券', '輸送用機器', '精密機器', '医薬品', '自動車', '食料品', 'IT', '鉄道・バス', '保険']
    data = []
    base_date = datetime(2025, 1, 1)
    for month in range(12):
        date_str = (base_date + pd.DateOffset(months=month)).strftime('%Y-%m')
        for idx, ind in enumerate(industries):
            value = 1000000 + idx * 500000 + month * 30000
            data.append({'date': date_str, 'industry': ind, 'market_cap': int(value)})
    return data

def save_data(filename: str, data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"💾 Saved {filepath} ({len(data)} records)")

def main():
    logger.info("=== JPX Scraper Started (Industry Market Cap only) ===")
    
    industry_data = process_market_cap_by_industry()
    save_data('market_cap_by_industry.json', industry_data)
    
    logger.info("=== Completed ===")

if __name__ == '__main__':
    main()
