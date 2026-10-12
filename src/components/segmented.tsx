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
    <div className="flex flex-wrap gap-0.5 rounded-full border border-black/8 bg-white/60 p-0.5 text-[13px] dark:border-white/10 dark:bg-white/[0.03]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative rounded-full px-3 py-1.5 font-medium transition-colors ${
              active ? "text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active ? (
              <motion.span
                layoutId={id}
                className="absolute inset-0 rounded-full bg-foreground"
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
