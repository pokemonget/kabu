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

interface MarketCapData {
  date: string
  industry: string
  market_cap: number
}

interface ChartData {
  date: string
  [key: string]: string | number
}

interface MarketCapByIndustryChartProps {
  data: MarketCapData[]
  startDate: string
  endDate: string
}

export default function MarketCapByIndustryChart({
  data,
  startDate,
  endDate,
}: MarketCapByIndustryChartProps) {
  // データをフィルタリングして業種ごとにグループ化
  const filteredData = useMemo(() => {
    const filtered = data.filter(
      (item) => item.date >= startDate && item.date <= endDate
    )

    // 日付ごとにグループ化
    const grouped = new Map<string, Map<string, number>>()
    filtered.forEach((item) => {
      if (!grouped.has(item.date)) {
        grouped.set(item.date, new Map())
      }
      grouped.get(item.date)!.set(item.industry, item.market_cap)
    })

    // チャートデータに変換
    return Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, industries]) => ({
        date,
        ...Object.fromEntries(industries),
      }))
  }, [data, startDate, endDate])

  // 業種リストを取得
  const industries = useMemo(() => {
    const industrySet = new Set<string>()
    filteredData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'date') {
          industrySet.add(key)
        }
      })
    })
    return Array.from(industrySet).sort()
  }, [filteredData])

  const [visibleIndustries, setVisibleIndustries] = useState<Set<string>>(
    new Set(industries)
  )

  const handleLegendClick = (e: any) => {
    const industry = e.dataKey
    setVisibleIndustries((prev) => {
      const next = new Set(prev)
      if (next.has(industry)) {
        next.delete(industry)
      } else {
        next.add(industry)
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
    '#A8D8EA',
    '#AA96DA',
  ]

  if (filteredData.length === 0) {
    return (
      <div className="chart-container">
        <h2 className="text-2xl font-bold text-jpx-primary mb-4">業種別時価総額</h2>
        <p className="text-gray-600">選択された期間にデータがありません</p>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h2 className="text-2xl font-bold text-jpx-primary mb-4">業種別時価総額</h2>
      <p className="text-sm text-gray-600 mb-4">
        凡例をクリックして業種の表示/非表示を切り替えられます
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
          {industries.map((industry, index) =>
            visibleIndustries.has(industry) ? (
              <Line
                key={industry}
                type="monotone"
                dataKey={industry}
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
