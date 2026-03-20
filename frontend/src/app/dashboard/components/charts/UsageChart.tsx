"use client";

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface UsageChartProps {
  data: { date: string; count: number }[];
}

export function UsageChart({ data }: UsageChartProps) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "dd/MM/yy"), // formata a data
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="date"
          tick={{ fill: "#cbd5e1", fontSize: 12 }}
          axisLine={{ stroke: "#475569" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            borderRadius: 6,
            border: "none",
            color: "#fff",
          }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#ff5c00"
          strokeWidth={3}
          dot={{ r: 4, fill: "#ff5c00" }}
          activeDot={{ r: 6 }}
          isAnimationActive={true}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
