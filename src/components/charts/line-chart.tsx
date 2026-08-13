"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getChartHex } from "@/lib/chart-colors";

export interface LineChartSeries {
  key: string;
  name: string;
  color?: string;
  strokeWidth?: number;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: LineChartSeries[];
  height?: number;
  showLegend?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function LineChart({
  data,
  xKey,
  series,
  height = 280,
  showLegend = true,
  xAxisLabel,
  yAxisLabel,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          label={
            xAxisLabel
              ? { value: xAxisLabel, position: "insideBottom", offset: -5 }
              : undefined
          }
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            fontSize: 13,
          }}
        />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              paddingTop: 10,
              fontSize: 13,
              lineHeight: "24px",
            }}
          />
        )}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color ?? getChartHex(i)}
            strokeWidth={s.strokeWidth ?? 2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
