'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';

interface DDayItem {
    date: string;
    type: string;
    min_price: number;
}

interface DDayChartProps {
  rawItems: DDayItem[];
}

interface DayBucket {
    date: string;
    '주거용': number;
    '상업용': number;
    '토지': number;
    '차량': number;
    '기타': number;
    total_vol: number;
    count: number;
}

type ChartRow = DayBucket & { vol_uk: number; shortDate: string };

const CATEGORY_KEYS = ['주거용', '상업용', '토지', '차량', '기타'] as const;
type CategoryKey = typeof CATEGORY_KEYS[number];

const CATEGORY_COLORS: Record<CategoryKey, string> = {
    '주거용': '#3b82f6', // blue
    '상업용': '#8b5cf6', // purple
    '토지': '#10b981',   // emerald
    '차량': '#f59e0b',   // amber
    '기타': '#9ca3af'    // gray
};

const FILTERS = ['전체', ...CATEGORY_KEYS];

function isCategoryKey(value: string): value is CategoryKey {
    return (CATEGORY_KEYS as readonly string[]).includes(value);
}

function emptyBucket(date: string): DayBucket {
    return { date, '주거용': 0, '상업용': 0, '토지': 0, '차량': 0, '기타': 0, total_vol: 0, count: 0 };
}

export default function DDayChart({ rawItems }: DDayChartProps) {
  const [activeFilter, setActiveFilter] = useState('전체');

  // Filter items
  const filteredItems = useMemo(() => {
     if (activeFilter === '전체') return rawItems;
     return rawItems.filter(item => item.type === activeFilter);
  }, [rawItems, activeFilter]);

  // Compute daily aggregates
  const chartData = useMemo<ChartRow[]>(() => {
    if (filteredItems.length === 0) return [];

    // sorting all dates to find range
    const allDatesInFilter = [...filteredItems].map(d => d.date).sort();
    const startDateStr = allDatesInFilter[0];
    const endDateStr = allDatesInFilter[allDatesInFilter.length - 1];

    if (!startDateStr || !endDateStr) return [];

    const startObj = new Date(startDateStr);
    const endObj = new Date(endDateStr);

    // Group by date
    const grouped = filteredItems.reduce<Record<string, DayBucket>>((acc, item) => {
        if (!acc[item.date]) {
            acc[item.date] = emptyBucket(item.date);
        }
        const key: CategoryKey = isCategoryKey(item.type) ? item.type : '기타';
        acc[item.date][key] += 1;
        acc[item.date].count += 1;
        acc[item.date].total_vol += item.min_price;
        return acc;
    }, {});

    const filledData: ChartRow[] = [];
    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0];
        const dayData = grouped[dStr] || emptyBucket(dStr);

        // Convert volume to 억원
        const vol_uk = Math.round(dayData.total_vol / 100000000);

        filledData.push({
            ...dayData,
            vol_uk,
            shortDate: `${d.getMonth() + 1}.${d.getDate()}`
        });
    }
    return filledData;
  }, [filteredItems]);

  // Summary Metrics
  const totalItems = filteredItems.length;
  const totalVolume = filteredItems.reduce((sum, item) => sum + item.min_price, 0);
  const totalVolumeUk = Math.round(totalVolume / 100000000).toLocaleString();

  // 가장 많은 공고가 마감되는 날
  let peakDay = '-';
  let peakDayCount = 0;
  chartData.forEach(d => {
     if (d.count > peakDayCount) {
         peakDayCount = d.count;
         peakDay = d.shortDate;
     }
  });

  return (
    <div className="w-full flex flex-col space-y-6">
        {/* Scorecards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-blue-50/50 p-3 md:p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-blue-600 mb-1">입찰 예정 공고</span>
                <span className="text-lg md:text-2xl font-black text-gray-900">{totalItems}건</span>
            </div>
            <div className="bg-purple-50/50 p-3 md:p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-purple-600 mb-1">최저매각가 합계</span>
                <span className="text-lg md:text-2xl font-black text-gray-900">{totalVolumeUk}억</span>
            </div>
            <div className="bg-emerald-50/50 p-3 md:p-4 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-emerald-600 mb-1">마감이 가장 많은 날</span>
                <span className="text-lg md:text-2xl font-black text-gray-900">{peakDay} ({peakDayCount}건)</span>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 pb-2">
            {FILTERS.map(f => (
                <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFilter(f)}
                    aria-pressed={activeFilter === f}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                        activeFilter === f
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>

        {/* Chart */}
        <div className="w-full min-h-72 h-[350px] md:h-96">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                    <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="shortDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        dy={10}
                        minTickGap={20}
                    />
                    <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickFormatter={(v) => `${v}억`}
                        width={40}
                    />
                    <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value, name) => {
                            if (name === '최저매각가 합계(억)') return [`${value}억원`, name];
                            return [`${value}건`, name];
                        }}
                        labelFormatter={(label) => `${label} 입찰 마감`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />

                    {/* Stacked Bars */}
                    {(activeFilter === '전체' || activeFilter === '주거용') &&
                        <Bar yAxisId="left" dataKey="주거용" stackId="a" fill={CATEGORY_COLORS['주거용']} maxBarSize={50} />
                    }
                    {(activeFilter === '전체' || activeFilter === '상업용') &&
                        <Bar yAxisId="left" dataKey="상업용" stackId="a" fill={CATEGORY_COLORS['상업용']} maxBarSize={50} />
                    }
                    {(activeFilter === '전체' || activeFilter === '토지') &&
                        <Bar yAxisId="left" dataKey="토지" stackId="a" fill={CATEGORY_COLORS['토지']} maxBarSize={50} />
                    }
                    {(activeFilter === '전체' || activeFilter === '차량') &&
                        <Bar yAxisId="left" dataKey="차량" stackId="a" fill={CATEGORY_COLORS['차량']} maxBarSize={50} />
                    }
                    {(activeFilter === '전체' || activeFilter === '기타') &&
                        <Bar yAxisId="left" dataKey="기타" stackId="a" fill={CATEGORY_COLORS['기타']} radius={[4,4,0,0]} maxBarSize={50} />
                    }

                    {/* Line for volume */}
                    <Line yAxisId="right" type="monotone" dataKey="vol_uk" name="최저매각가 합계(억)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />

                    </ComposedChart>
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full min-h-72 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400">
                    해당 조건의 공고가 없습니다.
                </div>
            )}
        </div>
    </div>
  );
}
