#!/usr/bin/env python3
"""
JPX (Japan Exchange Group) 統計情報自動収集スクリプト
テスト用ダミーデータとしてサンプルデータを生成
"""

import os
import json
from datetime import datetime, timedelta
import logging

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

OUTPUT_DIR = 'public/data'


def generate_market_cap_by_industry():
    """業種別時価総額のダミーデータを生成"""
    industries = [
        '銀行業', '電気・ガス業', '海運業', '証券業',
        '輸送用機器', '精密機器', '医薬品', '自動車',
        '食料品', 'IT', '鉄道・バス業', '保険業'
    ]
    
    data = []
    base_date = datetime(2025, 1, 1)
    
    # 過去12ヶ月のデータを生成
    for month in range(12):
        current_date = base_date + timedelta(days=30*month)
        date_str = current_date.strftime('%Y-%m')
        
        for idx, industry in enumerate(industries):
            # ランダムな値を生成（ただし種を固定してテスト可能に）
            base_value = 1000000 + (idx * 500000)
            variation = (month * 10000) + (idx * 5000)
            market_cap = base_value + variation
            
            data.append({
                'date': date_str,
                'industry': industry,
                'market_cap': market_cap
            })
    
    return data


def generate_market_cap_ranking():
    """時価総額順位表のダミーデータを生成"""
    companies = [
        'トヨタ自動車', 'ソニーグループ', '日本銀行', 'NTT', 'KDDI',
        'ソフトバンク', 'オリエンタルランド', 'ファーストリテイリング', '信越化学工業', 'ブリヂストン'
    ]
    
    data = []
    base_date = datetime(2025, 1, 1)
    
    for month in range(12):
        current_date = base_date + timedelta(days=30*month)
        date_str = current_date.strftime('%Y-%m')
        
        for rank, company in enumerate(companies, 1):
            base_value = 100000000000 / rank  # ランク逆数で時価総額を生成
            variation = (month * 1000000000) + (rank * 500000000)
            market_cap = base_value + variation
            
            data.append({
                'date': date_str,
                'rank': rank,
                'company': company,
                'market_cap': int(market_cap)
            })
    
    return data


def generate_per_pbr_stats():
    """PER・PBR統計のダミーデータを生成"""
    categories = [
        '大型株', '中型株', '小型株',
        '銀行業', '精密機器業', '医薬品業'
    ]
    
    data = []
    base_date = datetime(2025, 1, 1)
    
    for month in range(12):
        current_date = base_date + timedelta(days=30*month)
        date_str = current_date.strftime('%Y-%m')
        
        for idx, category in enumerate(categories):
            per = 15.0 + (idx * 0.5) + (month * 0.1)
            pbr = 1.2 + (idx * 0.1) + (month * 0.05)
            
            data.append({
                'date': date_str,
                'category': category,
                'per': round(per, 2),
                'pbr': round(pbr, 2),
                'extra_info': ''
            })
    
    return data


def save_data(filename: str, data):
    """データをJSONファイルに保存"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved data to {filepath} ({len(data)} records)")
    except Exception as e:
        logger.error(f"Failed to save data to {filename}: {e}")


def main():
    """メイン処理"""
    logger.info("Starting JPX data generation...")
    
    logger.info("Generating market cap by industry data...")
    market_cap_data = generate_market_cap_by_industry()
    save_data('market_cap_by_industry.json', market_cap_data)
    
    logger.info("Generating market cap ranking data...")
    ranking_data = generate_market_cap_ranking()
    save_data('market_cap_ranking.json', ranking_data)
    
    logger.info("Generating PER/PBR stats data...")
    per_pbr_data = generate_per_pbr_stats()
    save_data('per_pbr_stats.json', per_pbr_data)
    
    logger.info("Data generation completed successfully")


if __name__ == '__main__':
    main()
