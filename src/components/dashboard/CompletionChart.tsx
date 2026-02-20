'use client';
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useCompletionTrend } from '@/hooks/useStats';
import { format, parseISO } from 'date-fns';

export function CompletionChart() {
  const [days, setDays] = useState(30);
  const trend = useCompletionTrend(days);
  
  if (!trend) return <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded-xl animate-pulse" />;
  
  const data = trend.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    rate: d.rate,
    fullDate: d.date,
  }));
  
  const avgRate = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length) : 0;
  const nonZeroDays = data.filter(d => d.rate > 0).length;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Completion Trend</h2>
        <div className="flex gap-1">
          {[30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                days === d
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Active on {nonZeroDays} of the last {days} days · {avgRate}% avg
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Completion']}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#colorRate)"
            dot={false}
            activeDot={{ r: 4, fill: '#10B981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
