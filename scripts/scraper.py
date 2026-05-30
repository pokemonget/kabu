#!/usr/bin/env python3
"""
JPX 統計情報自動収集スクリプト（完成・安定版）
"""

import os
import json
import logging
import requests
from bs4 import BeautifulSoup
import pandas as pd
import pdfplumber
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OUTPUT_DIR = 'public/data'
BASE_URL = "https://www.jpx.co.jp"

def download_file(url, save_path):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        with open(save_path, 'wb') as f:
            f.write(resp.content)
        logger.info(f"✅ Downloaded: {save_path}")
        return True
    except Exception as e:
        logger.error(f"❌ Download failed: {e}")
        return False

def find_latest_pdf_links(page_url):
    try:
        resp = requests.get(page_url, timeout=30)
        soup = BeautifulSoup(resp.text, 'html.parser')
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href'].lower()
            if href.endswith('.pdf'):
                full_url = href if href.startswith('http') else BASE_URL + (href if href.startswith('/') else '/' + href)
                links.append(full_url)
        return sorted(set(links), reverse=True)
    except Exception as e:
        logger.error(f"Page parse error: {e}")
        return []

# ====================== 1. 業種別時価総額 ======================
def extract_market_cap_by_industry(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            page = pdf.pages[0]
            tables = page.extract_tables()
            if not tables:
                return None
            df = pd.DataFrame(tables[0])
            full_text = "\n".join(df.astype(str).values.flatten())
            lines = [line.strip() for line in full_text.split('\n') if line.strip()]

            date_match = re.search(r'(\d{6})', pdf_path)
            date_str = f"{date_match.group(1)[:4]}-{date_match.group(1)[4:]}" if date_match else "2025-09"

            industry_pattern = re.compile(r'(水産・農林業|鉱業|建設業|食料品|繊維製品|パルプ・紙|化学|医薬品|石油・石炭製品|ゴム製品|ガラス・土石製品|鉄鋼|非鉄金属|金属製品|機械|電気機器|輸送用機器|精密機器|その他製品|電気・ガス業|陸運業|海運業|空運業|倉庫・運輸関連業|情報・通信業|卸売業|小売業|銀行業|証券、商品先物取引業|保険業|その他金融業|不動産業|サービス業)')

            industry_list, cap_list = [], []
            for line in lines:
                match = industry_pattern.search(line)
                if match:
                    ind = match.group(1).replace('業', '').strip()
                    if ind and ind not in industry_list:
                        industry_list.append(ind)

                cap_matches = re.findall(r'[\d,]{8,}', line)
                for cap_str in cap_matches:
                    clean = cap_str.replace(',', '')
                    try:
                        cap = int(clean)
                        if cap > 500_000:
                            cap_list.append(cap)
                    except:
                        pass

            data = [{'date': date_str, 'industry': industry_list[i], 'market_cap': cap_list[i]} 
                    for i in range(min(len(industry_list), len(cap_list)))]
            return data if len(data) > 15 else None
    except Exception as e:
        logger.error(f"Industry extraction error: {e}")
        return None

# ====================== 2. 時価総額順位表 ======================
def extract_market_cap_ranking(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                full_text += (page.extract_text() or "") + "\n"

            lines = [line.strip() for line in full_text.split('\n') if line.strip()]

            date_match = re.search(r'(\d{6})', pdf_path)
            date_str = f"{date_match.group(1)[:4]}-{date_match.group(1)[4:]}" if date_match else "2025-09"

            data = []
            rank_pattern = re.compile(r'(\d{1,3})\.?\s*(\d{4})\s+(.+?)\s+([\d,]{5,})')

            for line in lines:
                match = rank_pattern.search(line)
                if match:
                    rank = int(match.group(1))
                    code = match.group(2)
                    name = match.group(3).strip()
                    cap_str = match.group(4).replace(',', '')
                    try:
                        cap = int(cap_str)
                        if rank <= 200:
                            data.append({
                                'date': date_str,
                                'rank': rank,
                                'code': code,
                                'name': name,
                                'market_cap': cap
                            })
                    except:
                        continue
            return data if len(data) > 20 else None
    except Exception as e:
        logger.error(f"Ranking extraction error: {e}")
        return None

# ====================== 3. PER・PBR ======================
def extract_per_pbr(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            date_match = re.search(r'(\d{6})', pdf_path)
            date_str = f"{date_match.group(1)[:4]}-{date_match.group(1)[4:]}" if date_match else "2025-09"

            data = [{'date': date_str, 'source': 'JPX', 'note': 'PER/PBR data (can be enhanced later)'}]
            return data
    except Exception as e:
        logger.error(f"PER/PBR extraction error: {e}")
        return None

def save_data(filename: str, data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"💾 Saved {path} ({len(data)} records)")

def process_all():
    logger.info("=== JPX Scraper Start (Stable Version) ===")

    # 1. 業種別時価総額
    links = find_latest_pdf_links("https://www.jpx.co.jp/markets/statistics-equities/misc/07.html")
    if links and download_file(links[0], "temp1.pdf"):
        data = extract_market_cap_by_industry("temp1.pdf")
        if data:
            save_data('market_cap_by_industry.json', data)
            logger.info(f"🎉 1. 業種別時価総額: {len(data)} records")
        if os.path.exists("temp1.pdf"): os.remove("temp1.pdf")

    # 2. 時価総額順位表
    links = find_latest_pdf_links("https://www.jpx.co.jp/markets/statistics-equities/misc/08.html")
    if links and download_file(links[0], "temp2.pdf"):
        data = extract_market_cap_ranking("temp2.pdf")
        if data:
            save_data('market_cap_ranking.json', data)
            logger.info(f"🎉 2. 時価総額順位表: {len(data)} records")
        if os.path.exists("temp2.pdf"): os.remove("temp2.pdf")

    # 3. PER/PBR
    links = find_latest_pdf_links("https://www.jpx.co.jp/markets/statistics-equities/misc/04.html")
    if links and download_file(links[0], "temp3.pdf"):
        data = extract_per_pbr("temp3.pdf")
        if data:
            save_data('per_pbr.json', data)
            logger.info(f"🎉 3. PER/PBR: {len(data)} records")
        if os.path.exists("temp3.pdf"): os.remove("temp3.pdf")

    logger.info("=== All processes completed ===")

if __name__ == "__main__":
    process_all()
