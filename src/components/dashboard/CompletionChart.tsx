'use client';
import React, { useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useCompletionTrend } from '@/hooks/useStats';
import { format, parseISO } from 'date-fns';

export function CompletionChart() {
  const [days, setDays] = useState(30);
  const trend = useCompletionTrend(days);

  if (!trend) return (
    <div className="h-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
  );

  const data = trend.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    rate: d.rate,
  }));

  const avgRate = data.length ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length) : 0;
  const nonZeroDays = data.filter(d => d.rate > 0).length;

  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          Completion trend
        </p>
        <div className="flex gap-0.5">
          {[30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-2 py-1 text-xs rounded transition-colors font-medium"
              style={{
                backgroundColor: days === d ? 'var(--text)' : 'transparent',
                color: days === d ? 'var(--bg)' : 'var(--text-3)',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
        Active {nonZeroDays}/{days} days · {avgRate}% avg
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'inherit' }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'inherit' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Rate']}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              boxShadow: 'none',
              fontFamily: 'inherit',
            }}
          />
          <Area type="monotone" dataKey="rate" stroke="#16A34A" strokeWidth={1.5} fill="url(#fill)" dot={false} activeDot={{ r: 3, fill: '#16A34A' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
