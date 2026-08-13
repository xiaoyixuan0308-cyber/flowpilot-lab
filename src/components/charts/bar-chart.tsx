"use client";

import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getChartHex } from "@/lib/chart-colors";

export interface BarChartSeries {
  key: string;
  name: string;
  color?: string;
  stack?: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: BarChartSeries[];
  height?: number;
  layout?: "vertical" | "horizontal";
  showLegend?: boolean;
  minBarWidth?: number;
}

const BAR_GAP = 8;

function BarChartContent({
  data,
  xKey,
  series,
  layout = "horizontal",
  showLegend,
  minBarWidth = 40,
}: BarChartProps) {
  const isVertical = layout === "vertical";

  return (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
      <XAxis
        type={isVertical ? "number" : "category"}
        dataKey={isVertical ? undefined : xKey}
        tick={{ fontSize: 11 }}
        tickLine={false}
        axisLine={{ stroke: "var(--border)" }}
        interval={0}
        angle={data.length > 10 ? -45 : 0}
        textAnchor={data.length > 10 ? "end" : "middle"}
        height={data.length > 10 ? 80 : 30}
      />
      <YAxis
        type={isVertical ? "category" : "number"}
        dataKey={isVertical ? xKey : undefined}
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={{ stroke: "var(--border)" }}
        width={60}
      />
      <Tooltip
        contentStyle={{
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          fontSize: 13,
        }}
      />
      {showLegend && <Legend />}
      {series.map((s, i) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.name}
          fill={s.color ?? getChartHex(i)}
          stackId={s.stack}
          radius={s.stack ? undefined : [4, 4, 0, 0]}
          maxBarSize={minBarWidth}
        />
      ))}
    </>
  );
}

export function BarChart(props: BarChartProps) {
  const { data, series, height = 280, minBarWidth = 40 } = props;

  const totalBars = data.length * series.length;
  const chartWidth = Math.max(totalBars * (minBarWidth + BAR_GAP) + 60, 300);
  const needScroll = chartWidth > 600;

  if (needScroll) {
    return (
      <div className="overflow-x-auto">
        <RechartsBarChart
          data={data}
          layout={props.layout}
          width={chartWidth}
          height={height}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <BarChartContent {...props} />
        </RechartsBarChart>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={props.layout}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <BarChartContent {...props} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
