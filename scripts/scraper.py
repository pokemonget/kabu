#!/usr/bin/env python3
"""
JPX Scraper - 最終完成版（日付抽出強化）
"""

import os
import json
import logging
import requests
import pdfplumber
import re
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OUTPUT_DIR = 'public/data'
BASE_URL = "https://www.jpx.co.jp"

def download_file(url, save_path):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(resp.content)
        logger.info(f"✅ Downloaded: {save_path}")
        return True
    except Exception as e:
        logger.error(f"❌ Download failed: {e}")
        return False

def find_all_pdf_links(page_url):
    try:
        resp = requests.get(page_url, timeout=30)
        soup = BeautifulSoup(resp.text, 'html.parser')
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            if '.pdf' in href.lower():
                full_url = href if href.startswith('http') else BASE_URL + (href if href.startswith('/') else '/' + href)
                links.append(full_url)
        return sorted(set(links), reverse=True)
    except:
        return []

def get_date_from_url(url):
    """URLから年月を確実に抽出（強化版）"""
    # ファイル名部分を優先的に検索
    filename = url.split('/')[-1]
    match = re.search(r'(\d{4})(\d{2})', filename)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    
    # URL全体からも検索
    match = re.search(r'(\d{4})(\d{2})', url)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    
    return "2025-09"  # フォールバック

def extract_industry_market_cap(pdf_path, date_str):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = pdf.pages[0].extract_text() or ""
        
        industry_list = ["水産・農林業","鉱業","建設業","食料品","繊維製品","パルプ・紙","化学","医薬品",
                        "石油・石炭製品","ゴム製品","ガラス・土石製品","鉄鋼","非鉄金属","金属製品","機械",
                        "電気機器","輸送用機器","精密機器","その他製品","電気・ガス業","陸運業","海運業",
                        "空運業","倉庫・運輸関連業","情報・通信業","卸売業","小売業","銀行業",
                        "証券、商品先物取引業","保険業","その他金融業","不動産業","サービス業"]
        
        numbers = re.findall(r'\b[\d,]{6,}\b', full_text)
        clean_numbers = [int(n.replace(',', '')) for n in numbers]
        if clean_numbers and clean_numbers[0] > 500000000:
            clean_numbers = clean_numbers[1:]
        
        data = []
        for i, ind in enumerate(industry_list):
            if i < len(clean_numbers):
                data.append({
                    "date": date_str,
                    "industry": ind.replace("業", "").strip(),
                    "market_cap": clean_numbers[i] * 1_000_000
                })
        return data
    except:
        return []

def extract_market_cap_ranking(pdf_path, date_str):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = pdf.pages[0].extract_text() or ""
        
        data = []
        matches = re.findall(r'(\d{1,3})\s+(\d{4})\s+(.+?)\s+([\d,]+)', full_text)
        for m in matches[:120]:
            try:
                rank = int(m[0])
                code = m[1]
                name = m[2].strip()
                cap_million = int(m[3].replace(',', ''))
                data.append({
                    "date": date_str,
                    "rank": rank,
                    "code": code,
                    "name": name,
                    "market_cap": cap_million * 1_000_000
                })
            except:
                continue
        logger.info(f"  → 時価総額順位 {len(data)}銘柄 ({date_str})")
        return data
    except:
        return []

def main():
    logger.info("=== JPX 全データ取得 最終完成版 ===")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. 業種別時価総額
    logger.info("1. 業種別時価総額を取得中...")
    links = find_all_pdf_links("https://www.jpx.co.jp/markets/statistics-equities/misc/07.html")
    all_industry = []
    for url in links[:24]:
        date_str = get_date_from_url(url)
        temp = f"temp_ind_{date_str}.pdf"
        if download_file(url, temp):
            all_industry.extend(extract_industry_market_cap(temp, date_str))
            if os.path.exists(temp): os.remove(temp)
    
    with open(f"{OUTPUT_DIR}/market_cap_by_industry.json", 'w', encoding='utf-8') as f:
        json.dump(all_industry, f, ensure_ascii=False, indent=2)
    logger.info(f"✅ 業種別: {len(all_industry)}件 保存完了")

    # 2. 時価総額順位表
    logger.info("2. 時価総額順位表を取得中...")
    rank_links = find_all_pdf_links("https://www.jpx.co.jp/markets/statistics-equities/misc/08.html")
    all_ranking = []
    for url in rank_links[:12]:
        date_str = get_date_from_url(url)
        temp = f"temp_rank_{date_str}.pdf"
        if download_file(url, temp):
            all_ranking.extend(extract_market_cap_ranking(temp, date_str))
            if os.path.exists(temp): os.remove(temp)
    
    with open(f"{OUTPUT_DIR}/market_cap_ranking.json", 'w', encoding='utf-8') as f:
        json.dump(all_ranking, f, ensure_ascii=False, indent=2)
    logger.info(f"✅ 時価総額順位: {len(all_ranking)}件 保存完了")

    logger.info("🎉 全処理完了！")
    logger.info("http://localhost:3000 でグラフを確認してください。")

if __name__ == "__main__":
    main()
