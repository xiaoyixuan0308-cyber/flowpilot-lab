"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getChartHex } from "@/lib/chart-colors";

export interface DonutChartSegment {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartSegment[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  centerLabel?: string;
}

export function DonutChart({
  data,
  height = 280,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  centerLabel,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          strokeWidth={1}
          stroke="var(--background)"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? getChartHex(index)}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            fontSize: 13,
          }}
        />
        {showLegend && <Legend />}
        {centerLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-sm font-semibold"
          >
            {centerLabel}
          </text>
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
