"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AreaFillDefs,
  areaFillUrl,
  ChartActiveDot,
  ChartFrame,
  chartGrid,
  ChartPlotSurface,
  ChartTooltipContent,
  chartXAxis,
  chartYAxis,
  useChartId,
} from "@/components/spectrumui/charts/chart-kit";
import { FIRST_HOUR, hourLabel } from "@/lib/analysis";

export interface DayPoint {
  x: number;
  actual?: number;
  predicted?: number;
}

export const ACTUAL = "var(--spectrum-chart-1)";
export const PREDICTED = "var(--spectrum-chart-5)";
const TICKS = [6, 9, 12, 15, 18, 21, 24];
const COMPACT_TICKS = [6, 12, 18, 24];

function timeLabel(x: number) {
  const hour = Math.floor(x);
  const minute = Math.round((x - hour) * 60);
  return minute ? `${hourLabel(hour).replace(/(am|pm)/, `:${String(minute).padStart(2, "0")}$1`)}` : hourLabel(hour);
}

export function DayChart({
  data,
  predictedLabel,
  nowHour,
  compact = false,
}: {
  data: DayPoint[];
  predictedLabel: string;
  nowHour: number | null;
  compact?: boolean;
}) {
  const id = useChartId("day");
  return (
    <ChartFrame className={`flex flex-col ${compact ? "h-[150px]" : "h-[300px]"}`}>
      <ChartPlotSurface>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <AreaFillDefs id={id} color={ACTUAL} variant="gradient" />
            </defs>
            <CartesianGrid {...chartGrid} />
            <XAxis
              {...chartXAxis}
              dataKey="x"
              type="number"
              domain={[FIRST_HOUR, 24]}
              ticks={compact ? COMPACT_TICKS : TICKS}
              tickFormatter={(v: number) => hourLabel(v)}
            />
            <YAxis {...chartYAxis} domain={[0, 100]} ticks={compact ? [0, 50, 100] : [0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              cursor={{ stroke: "currentColor", strokeOpacity: 0.25 }}
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  payload={payload as Parameters<typeof ChartTooltipContent>[0]["payload"]}
                  label={timeLabel(Number(label))}
                />
              )}
            />
            {nowHour != null ? (
              <ReferenceLine x={nowHour} stroke="currentColor" strokeOpacity={0.5} strokeDasharray="2 3" />
            ) : null}
            <Line
              dataKey="predicted"
              name={predictedLabel}
              type="monotone"
              stroke={PREDICTED}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={<ChartActiveDot color={PREDICTED} />}
              connectNulls
              isAnimationActive={false}
            />
            <Area
              dataKey="actual"
              name="Actual"
              type="monotone"
              stroke={ACTUAL}
              strokeWidth={2}
              fill={areaFillUrl(id, "gradient", ACTUAL)}
              dot={data.filter((p) => p.actual != null).length <= 12 ? { r: 3, fill: ACTUAL, strokeWidth: 0 } : false}
              activeDot={<ChartActiveDot color={ACTUAL} />}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartPlotSurface>
    </ChartFrame>
  );
}
