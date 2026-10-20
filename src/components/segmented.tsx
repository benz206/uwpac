"use client";

import { motion } from "motion/react";

export function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-0.5 rounded-md bg-muted p-0.5 text-[13px]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative rounded-[5px] px-3 py-1 font-medium transition-colors ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active ? (
              <motion.span
                layoutId={id}
                className="absolute inset-0 rounded-[5px] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-border"
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              />
            ) : null}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
