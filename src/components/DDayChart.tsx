'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DDayChartProps {
  rawData: { date: string; count: number }[];
}

export default function DDayChart({ rawData }: DDayChartProps) {
  // Fill in missing dates with 0 for a smooth timeline
  const filledData = [];
  if (rawData.length > 0) {
    const startDateStr = rawData[0].date;
    const endDateStr = rawData[rawData.length - 1].date;
    
    // Convert to UTC dates for loop
    const startObj = new Date(startDateStr);
    const endObj = new Date(endDateStr);
    
    // Map existing dates
    const dataMap = new Map(rawData.map((d) => [d.date, d.count]));
    
    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0];
        filledData.push({
            date: dStr,
            count: dataMap.get(dStr) || 0,
            shortDate: `${d.getMonth() + 1}.${d.getDate()}`
        });
    }
  }

  // Find max value to color the peak bar differently
  const maxCount = Math.max(...filledData.map((d) => d.count), 1);

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filledData}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis 
            dataKey="shortDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }} 
            dy={10} 
            minTickGap={20}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`${value}건`, '예정 물건']}
            labelFormatter={(label) => `${label} 입찰 예정`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {filledData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.count === maxCount ? '#3b82f6' : '#93c5fd'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
