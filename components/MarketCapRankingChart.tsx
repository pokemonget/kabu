'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface RankingData {
  date: string
  rank: number
  company: string
  market_cap: number
}

interface MarketCapRankingChartProps {
  data: RankingData[]
  startDate: string
  endDate: string
}

export default function MarketCapRankingChart({
  data,
  startDate,
  endDate,
}: MarketCapRankingChartProps) {
  // Top 10企業のみを取得
  const topCompanies = useMemo(() => {
    const companies = new Map<string, number>()
    data.forEach((item) => {
      if (!companies.has(item.company)) {
        companies.set(item.company, 0)
      }
    })
    return Array.from(companies.keys())
      .sort(
        (a, b) =>
          data.find((d) => d.company === b)?.market_cap || 0 -
          (data.find((d) => d.company === a)?.market_cap || 0)
      )
      .slice(0, 10)
  }, [data])

  // データをフィルタリングして企業ごとにグループ化
  const filteredData = useMemo(() => {
    const filtered = data.filter(
      (item) =>
        item.date >= startDate &&
        item.date <= endDate &&
        topCompanies.includes(item.company)
    )

    // 日付ごとにグループ化
    const grouped = new Map<string, Map<string, number>>()
    filtered.forEach((item) => {
      if (!grouped.has(item.date)) {
        grouped.set(item.date, new Map())
      }
      grouped.get(item.date)!.set(item.company, item.market_cap)
    })

    // チャートデータに変換
    return Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, companies]) => ({
        date,
        ...Object.fromEntries(companies),
      }))
  }, [data, startDate, endDate, topCompanies])

  const [visibleCompanies, setVisibleCompanies] = useState<Set<string>>(
    new Set(topCompanies)
  )

  const handleLegendClick = (e: any) => {
    const company = e.dataKey
    setVisibleCompanies((prev) => {
      const next = new Set(prev)
      if (next.has(company)) {
        next.delete(company)
      } else {
        next.add(company)
      }
      return next
    })
  }

  const COLORS = [
    '#003366',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#F8B88B',
    '#85C1E2',
  ]

  if (filteredData.length === 0) {
    return (
      <div className="chart-container">
        <h2 className="text-2xl font-bold text-jpx-primary mb-4">時価総額ランキング (Top 10)</h2>
        <p className="text-gray-600">選択された期間にデータがありません</p>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h2 className="text-2xl font-bold text-jpx-primary mb-4">時価総額ランキング (Top 10)</h2>
      <p className="text-sm text-gray-600 mb-4">
        凡例をクリックして企業の表示/非表示を切り替えられます
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{
              value: '時価総額 (円)',
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                return `¥${(value / 1000000).toFixed(2)}M`
              }
              return value
            }}
          />
          <Legend onClick={handleLegendClick} />
          {topCompanies.map((company, index) =>
            visibleCompanies.has(company) ? (
              <Line
                key={company}
                type="monotone"
                dataKey={company}
                stroke={COLORS[index % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
