'use client'

import { useMemo, useState } from 'react'
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

interface PerPbrData {
  date: string
  category: string
  per: number
  pbr: number
  extra_info: string
}

interface PerPbrStatsChartProps {
  data: PerPbrData[]
  startDate: string
  endDate: string
  metric: 'per' | 'pbr'
}

export default function PerPbrStatsChart({
  data,
  startDate,
  endDate,
  metric,
}: PerPbrStatsChartProps) {
  // データをフィルタリングしてカテゴリーごとにグループ化
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
      const value = metric === 'per' ? item.per : item.pbr
      grouped
        .get(item.date)!
        .set(item.category, value)
    })

    // チャートデータに変換
    return Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, categories]) => ({
        date,
        ...Object.fromEntries(categories),
      }))
  }, [data, startDate, endDate, metric])

  // カテゴリーリストを取得
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    filteredData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'date') {
          categorySet.add(key)
        }
      })
    })
    return Array.from(categorySet).sort()
  }, [filteredData])

  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(categories)
  )

  const handleLegendClick = (e: any) => {
    const category = e.dataKey
    setVisibleCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
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

  const metricLabel = metric === 'per' ? 'PER' : 'PBR'
  const metricName = metric === 'per' ? '株価収益率' : '株価純資産倍率'

  if (filteredData.length === 0) {
    return (
      <div className="chart-container">
        <h2 className="text-2xl font-bold text-jpx-primary mb-4">
          規模別・業種別 {metricName} ({metricLabel})
        </h2>
        <p className="text-gray-600">選択された期間にデータがありません</p>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h2 className="text-2xl font-bold text-jpx-primary mb-4">
        規模別・業種別 {metricName} ({metricLabel})
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        凡例をクリックしてカテゴリーの表示/非表示を切り替えられます
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
              value: metricLabel,
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip formatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)} />
          <Legend onClick={handleLegendClick} />
          {categories.map((category, index) =>
            visibleCategories.has(category) ? (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
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
