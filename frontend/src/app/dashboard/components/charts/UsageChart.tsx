"use client";

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Seg", usage: 120 },
  { day: "Ter", usage: 210 },
  { day: "Qua", usage: 180 },
  { day: "Qui", usage: 250 },
  { day: "Sex", usage: 300 },
];

export function UsageChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="day" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="usage"
          stroke="#ff5c00"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
