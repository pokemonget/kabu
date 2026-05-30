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
  code?: string
  company: string     // ← 必須に統一
  market_cap: number
}

interface PerPbrData {
  date: string
  category: string
  per?: number
  pbr?: number
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
        let rankingRaw = await rankingRes.json()
        const perPbr = await perPbrRes.json()

        // データ変換
        const ranking = rankingRaw.map((item: any) => ({
          date: item.date,
          rank: Number(item.rank),
          code: item.code,
          company: item.name || item.company || '不明',   // companyフィールドを確実に作成
          market_cap: Number(item.market_cap)
        }))

        setMarketCapByIndustry(industry)
        setMarketCapRanking(ranking)
        setPerPbrStats(perPbr)

        const allDates = new Set<string>()
        industry.forEach((item: any) => allDates.add(item.date))
        ranking.forEach((item: any) => allDates.add(item.date))
        perPbr.forEach((item: any) => allDates.add(item.date))

        const sortedDates = Array.from(allDates).sort()
        setAvailableDates(sortedDates)

        if (sortedDates.length > 0) {
          setStartDate(sortedDates[0])
          setEndDate(sortedDates[sortedDates.length - 1])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        console.error('Data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-jpx-primary"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || availableDates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">⚠️ エラーが発生しました</h2>
          <p className="text-red-600">{error || 'データが見つかりません。'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600">利用可能な期間</h3>
          <p className="text-2xl font-bold text-jpx-primary">{availableDates.length} ヶ月</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600">開始日</h3>
          <p className="text-2xl font-bold text-jpx-accent">{startDate}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600">最新更新</h3>
          <p className="text-2xl font-bold text-jpx-secondary">{endDate}</p>
        </div>
      </div>

      {availableDates.length > 1 && (
        <DateRangePicker
          onDateRangeChange={handleDateRangeChange}
          availableDates={availableDates}
        />
      )}

      <div className="space-y-6">
        {marketCapByIndustry.length > 0 && (
          <MarketCapByIndustryChart
            data={marketCapByIndustry}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {marketCapRanking.length > 0 && (
          <MarketCapRankingChart
            data={marketCapRanking}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {perPbrStats.length > 0 && (
          <>
            <PerPbrStatsChart data={perPbrStats} startDate={startDate} endDate={endDate} metric="per" />
            <PerPbrStatsChart data={perPbrStats} startDate={startDate} endDate={endDate} metric="pbr" />
          </>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📌 使用方法</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ 期間選択で分析対象の月度を指定できます</li>
          <li>✓ グラフの凡例をクリックして特定の項目を表示/非表示にできます</li>
          <li>✓ データは毎月自動更新されます</li>
        </ul>
      </div>
    </div>
  )
}
