'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface MarketCapData {
  date: string
  industry: string
  market_cap: number
}

interface Props {
  data: MarketCapData[]
  startDate: string
  endDate: string
}

export default function MarketCapByIndustryChart({ data, startDate, endDate }: Props) {
  // 時系列データとして整形 + 凡例の順序を固定（時価総額降順）
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const dates = [...new Set(data.map(d => d.date))].sort()

    // 日付範囲でフィルタ
    const filteredDates = dates.filter(date => 
      date >= startDate && date <= endDate
    )

    // 日付ごとにグループ化
    const grouped = filteredDates.map(date => {
      const items = data.filter(d => d.date === date)
      const obj: any = { date }
      
      // 時価総額降順でソートして上位業種を優先表示
      const sorted = [...items].sort((a, b) => b.market_cap - a.market_cap)
      
      sorted.forEach(item => {
        obj[item.industry] = item.market_cap
      })
      return obj
    })

    return grouped
  }, [data, startDate, endDate])

  // 凡例の順序を固定（時価総額が大きい順）
  const legendPayload = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const latest = [...data]
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 12) // 上位12業種まで表示（多すぎると見にくい）

    return latest.map(item => ({
      value: item.industry,
      type: 'line' as const,
      color: '#2563eb', // 必要なら色を業種ごとに変えても可
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm max-w-xs">
          <p className="font-bold mb-2">{label}</p>
          {payload
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any, i: number) => (
              <p key={i} className="flex justify-between gap-4">
                <span>{entry.name}</span>
                <span className="font-mono text-blue-600">
                  {entry.value?.toLocaleString() || 0} 百万円
                </span>
              </p>
            ))}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return <div className="text-center py-12 text-gray-500">データがありません</div>
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">業種別時価総額の推移</h2>
        <p className="text-sm text-gray-500 mt-1">
          {startDate} ～ {endDate}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={600}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis dataKey="date" />
          
          <YAxis 
            tickFormatter={(value) => `${(value / 1_000_000).toFixed(1)}兆`}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* 凡例を上部に配置 + 順序を固定 */}
          <Legend
            verticalAlign="top"
            align="center"
            payload={legendPayload}
            wrapperStyle={{
              paddingBottom: 20,
              fontSize: '13px',
              maxHeight: '180px',
              overflow: 'auto',
            }}
          />

          {/* 各業種のライン（上位のものだけ描画） */}
          {legendPayload.map((entry, index) => (
            <Line
              key={entry.value}
              type="monotone"
              dataKey={entry.value}
              name={entry.value}
              stroke={`hsl(${(index * 30) % 360}, 70%, 50%)`}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
