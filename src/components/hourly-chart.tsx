"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  ChartFrame,
  ChartTooltipContent,
  chartXAxis,
  createGrowBarShape,
  HoverIndexProvider,
  readActiveTooltipIndex,
  useChartMotion,
  useIntroStartedAt,
} from "@/components/spectrumui/charts/chart-kit";
import { hourLabel, HOURS } from "@/lib/analysis";

export function HourlyChart({ values, currentHour }: { values: (number | null)[]; currentHour: number }) {
  const { reduce } = useChartMotion();
  const introStartedAt = useIntroStartedAt();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const data = HOURS.map((hour, i) => ({ hour: hourLabel(hour), typical: values[i] }));

  const shape = useMemo(
    () =>
      createGrowBarShape({
        introStartedAt,
        dataLength: data.length,
        reduce,
        radius: [3, 3, 0, 0],
      }),
    [introStartedAt, data.length, reduce],
  );

  return (
    <ChartFrame className="h-28">
      <HoverIndexProvider value={activeIndex}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="14%"
            onMouseMove={(state) => {
              const next = readActiveTooltipIndex(state);
              setActiveIndex((current) => (current === next ? current : next));
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <XAxis {...chartXAxis} dataKey="hour" interval={5} tickMargin={6} />
            <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.05 }} content={<ChartTooltipContent />} />
            <Bar dataKey="typical" name="Typical %" isAnimationActive={false} shape={shape}>
              {HOURS.map((hour, i) => (
                <Cell
                  key={hour}
                  fill={
                    hour === currentHour
                      ? "var(--foreground)"
                      : "color-mix(in oklch, currentColor 45%, transparent)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </HoverIndexProvider>
    </ChartFrame>
  );
}
