#!/usr/bin/env python3
"""
JPX 業種別時価総額 実データ取得スクリプト
"""

import os
import json
import logging
import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OUTPUT_DIR = 'public/data'
BASE_URL = "https://www.jpx.co.jp"

def download_file(url, save_path):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; KabuScraper/1.0)'}
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(resp.content)
        logger.info(f"✅ Downloaded: {save_path}")
        return True
    except Exception as e:
        logger.error(f"❌ Download failed: {e}")
        return False

def find_latest_excel_links(page_url):
    """より寛容にExcelリンクを探す"""
    try:
        resp = requests.get(page_url, timeout=30)
        soup = BeautifulSoup(resp.text, 'html.parser')
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href'].lower()
            if href.endswith(('.xls', '.xlsx')):
                full_url = href if href.startswith('http') else BASE_URL + (href if href.startswith('/') else '/' + href)
                links.append(full_url)
        unique_links = sorted(set(links), reverse=True)
        logger.info(f"Found {len(unique_links)} Excel links")
        return unique_links
    except Exception as e:
        logger.error(f"Page parse error: {e}")
        return []

def process_market_cap_by_industry():
    page_url = "https://www.jpx.co.jp/markets/statistics-equities/misc/07.html"
    logger.info("🔍 Fetching 業種別時価総額...")

    excel_links = find_latest_excel_links(page_url)
    if not excel_links:
        logger.warning("No Excel found → using dummy")
        return generate_dummy_data()

    excel_url = excel_links[0]
    temp_file = "temp_industry.xlsx"

    if not download_file(excel_url, temp_file):
        return generate_dummy_data()

    try:
        # 複数パターン試行（JPXのExcelはヘッダー位置がバラバラ）
        for header in [0, 1, 2, 3, 4]:
            try:
                df = pd.read_excel(temp_file, header=header)
                logger.info(f"Header={header} で読み込み成功 | Columns: {list(df.columns)[:10]}")
                break
            except:
                continue
        else:
            df = pd.read_excel(temp_file)  # 最終手段

        df = df.dropna(how='all').reset_index(drop=True)
        data = []

        # 実際の構造に合わせて調整（実行してログを見てから微調整）
        for _, row in df.iterrows():
            if len(row) < 3:
                continue
            date_val = str(row.iloc[0]).strip()
            if date_val in ['nan', 'NaT', '', '日付', '年月'] or len(date_val) < 4:
                continue

            # YYYY-MM形式に整形
            if len(date_val) >= 7 and '-' in date_val:
                date_str = date_val[:7]
            else:
                date_str = str(date_val)[:7].replace('年', '-').replace('月', '')

            for i in range(1, len(row)):
                industry = str(df.columns[i] if hasattr(df, 'columns') else f'col{i}').strip()
                if industry in ['nan', 'Unnamed', '合計', 'Total', '']:
                    continue
                try:
                    value = float(row.iloc[i])
                    if value > 0:
                        data.append({
                            'date': date_str,
                            'industry': industry.replace('業', '').strip(),
                            'market_cap': int(value)   # 単位は通常「百万円」
                        })
                except:
                    continue

        logger.info(f"✅ Processed {len(data)} records")
        return data[-800:]  # 直近分に絞る（多すぎるとグラフ重くなる）

    except Exception as e:
        logger.error(f"Excel processing error: {e}")
        return generate_dummy_data()
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

def generate_dummy_data():
    # 既存のダミー関数（簡易版）
    industries = ['銀行', '電気・ガス', '海運', '証券', '輸送用機器', '医薬品', '自動車', '食料品', '情報・通信']
    data = []
    for m in range(12):
        date = f"2025-{m+1:02d}"
        for ind in industries:
            data.append({
                'date': date,
                'industry': ind,
                'market_cap': 800000 + len(data) * 15000
            })
    return data

def save_data(filename: str, data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"💾 Saved {path} ({len(data)} records)")

def main():
    logger.info("=== JPX Scraper Start ===")
    industry_data = process_market_cap_by_industry()
    save_data('market_cap_by_industry.json', industry_data)
    logger.info("=== Done ===")

if __name__ == "__main__":
    main()
