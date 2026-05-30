'use client'

import { useMemo, useState } from 'react'
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

interface RankingData {
  date: string
  rank: number
  code?: string
  name?: string
  company?: string
  market_cap: number
}

interface Props {
  data: RankingData[]
  startDate: string
  endDate: string
}

export default function MarketCapRankingChart({ data, startDate, endDate }: Props) {
  const [topN, setTopN] = useState<number>(10)

  // Top N企業の時系列データを作成
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const dates = [...new Set(data.map(d => d.date))].sort()
    const filteredDates = dates.filter(date => date >= startDate && date <= endDate)

    // 最新月のTop N企業を抽出
    const latestDate = [...new Set(data.map(d => d.date))].sort().reverse()[0]
    const topCompanies = data
      .filter(item => item.date === latestDate && item.rank <= topN)
      .sort((a, b) => a.rank - b.rank)
      .map(item => item.name || item.company)

    // 日付ごとにTop企業の時価総額をマッピング
    return filteredDates.map(date => {
      const row: any = { date }
      const dayData = data.filter(d => d.date === date)

      topCompanies.forEach(company => {
        const found = dayData.find(item => (item.name || item.company) === company)
        row[company] = found ? Number(found.market_cap) : 0
      })
      return row
    })
  }, [data, startDate, endDate, topN])

  // 1円単位 → 兆円変換
  const formatYAxis = (value: number) => {
    const trillion = value / 1_000_000_000_000
    return `${trillion.toFixed(1)}兆`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-sm max-w-md">
          <p className="font-bold text-lg mb-2">{label}</p>
          {payload
            .filter((p: any) => p.value != null && p.value > 0)
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
            .map((entry: any, i: number) => (
              <div key={i} className="flex justify-between gap-6 py-0.5">
                <span className="font-medium">{entry.name}</span>
                <span className="font-mono text-blue-600">
                  {(Number(entry.value) / 1_000_000_000_000).toFixed(2)} 兆円
                </span>
              </div>
            ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">時価総額ランキング推移</h2>
          <p className="text-sm text-gray-500 mt-1">集計期間: {startDate} ～ {endDate}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">表示上位:</span>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={620}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
          <XAxis dataKey="date" />
          <YAxis 
            tickFormatter={formatYAxis}
            width={90}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            align="center"
            wrapperStyle={{
              paddingBottom: 20,
              fontSize: '13px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          />

          {/* Top N企業のラインを描画 */}
          {chartData.length > 0 && Object.keys(chartData[0])
            .filter(key => key !== 'date')
            .map((company, index) => (
              <Line
                key={company}
                type="monotone"
                dataKey={company}
                stroke={`hsl(${(index * 35) % 360}, 75%, 55%)`}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                name={company}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
