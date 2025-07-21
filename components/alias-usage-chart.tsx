
"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { subDays, format, isWithinInterval } from 'date-fns';
import { useMemo } from 'react';
import { Alias } from "@/types";

type AliasUsageChartProps = {
  aliases: Alias[];
};

export default function AliasUsageChart({ aliases }: AliasUsageChartProps) {
  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    
    return last7Days.map(day => {
      const count = aliases.filter(alias => 
        isWithinInterval(new Date(alias.createdAt), {
          start: new Date(day.setHours(0, 0, 0, 0)),
          end: new Date(day.setHours(23, 59, 59, 999)),
        })
      ).length;
      
      return {
        name: format(day, 'eee'), // Mon, Tue, etc.
        created: count,
      };
    });
  }, [aliases]);

  const maxCount = useMemo(() => {
    const count = Math.max(...data.map(d => d.created));
    return count < 5 ? 5 : count; // Ensure y-axis is at least 5
  }, [data]);

  return (
    <div className="h-[250px] sm:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            allowDecimals={false}
            domain={[0, maxCount]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
            labelStyle={{
                color: 'hsl(var(--foreground))'
            }}
          />
          <Legend iconType="square" />
          <Line 
            type="monotone" 
            dataKey="created" 
            name="Aliases Created" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2} 
            dot={{ r: 4, fill: "hsl(var(--primary))" }} 
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
