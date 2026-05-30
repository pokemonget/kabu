'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
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
  // 最新月のデータのみ使用 + 時価総額降順ソート
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const latestDate = [...new Set(data.map((d) => d.date))].sort().reverse()[0]

    return data
      .filter((item) => item.date === latestDate)
      .sort((a, b) => b.market_cap - a.market_cap) // 時価総額が大きい順
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-bold text-gray-800">{item.industry}</p>
          <p className="text-blue-600 mt-1">
            時価総額: <span className="font-mono">{item.market_cap.toLocaleString()}</span> 百万円
          </p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">業種別時価総額</h2>
          <p className="text-sm text-gray-500 mt-1">最新集計: {chartData[0]?.date}</p>
        </div>
        <div className="text-sm text-gray-500">単位：百万円</div>
      </div>

      <ResponsiveContainer width="100%" height={650}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 50, bottom: 20, left: 160 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            type="number"
            tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(1)}兆`}
          />

          <YAxis
            type="category"
            dataKey="industry"
            width={150}
            tick={{ fontSize: 13 }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* 凡例を上部に縦並びで表示 */}
          <Legend
            verticalAlign="top"
            align="center"
            iconType="rect"
            iconSize={14}
            wrapperStyle={{
              top: -5,
              paddingBottom: 25,
              fontSize: '13.5px',
              lineHeight: '1.75',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          />

          <Bar
            dataKey="market_cap"
            fill="#2563eb"
            radius={[0, 6, 6, 0]}
            name="時価総額"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
