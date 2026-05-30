'use client'

import { useEffect, useState } from 'react'
import DateRangePicker from '@/components/DateRangePicker'
import MarketCapByIndustryChart from '@/components/MarketCapByIndustryChart'
import MarketCapRankingChart from '@/components/MarketCapRankingChart'
import PerPbrStatsChart from '@/components/PerPbrStatsChart'

interface MarketCapData {
  date: string
  industry: string
  market_cap: number
}

interface RankingData {
  date: string
  rank: number
  code?: string          // 追加
  name: string           // ← nameに変更
  market_cap: number
}

interface PerPbrData {
  date: string
  category: string
  per: number
  pbr: number
  extra_info?: string
}

export default function Home() {
  const [marketCapByIndustry, setMarketCapByIndustry] = useState<MarketCapData[]>([])
  const [marketCapRanking, setMarketCapRanking] = useState<RankingData[]>([])
  const [perPbrStats, setPerPbrStats] = useState<PerPbrData[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // データをフェッチ
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [industryRes, rankingRes, perPbrRes] = await Promise.all([
          fetch('/data/market_cap_by_industry.json'),
          fetch('/data/market_cap_ranking.json'),
          fetch('/data/per_pbr_stats.json'),
        ])

        if (!industryRes.ok || !rankingRes.ok || !perPbrRes.ok) {
          throw new Error('Failed to fetch data files')
        }

        const industry = await industryRes.json()
        let ranking = await rankingRes.json()
        const perPbr = await perPbrRes.json()

        // === ここを追加：scraperのデータ形式に合わせて変換 ===
        ranking = ranking.map((item: any) => ({
          date: item.date,
          rank: item.rank,
          code: item.code,
          name: item.name || item.company,   // name or company 両対応
          market_cap: item.market_cap
        }))

        setMarketCapByIndustry(industry)
        setMarketCapRanking(ranking)
        setPerPbrStats(perPbr)

        // 利用可能な日付を取得
        const allDates = new Set<string>()
        industry.forEach((item: MarketCapData) => allDates.add(item.date))
        ranking.forEach((item: RankingData) => allDates.add(item.date))
        perPbr.forEach((item: PerPbrData) => allDates.add(item.date))

        const sortedDates = Array.from(allDates).sort()
        setAvailableDates(sortedDates)

        if (sortedDates.length > 0) {
          setStartDate(sortedDates[0])
          setEndDate(sortedDates[sortedDates.length - 1])
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An unknown error occurred'
        )
        console.error('Data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ... 以下は変更なし（そのまま） ...