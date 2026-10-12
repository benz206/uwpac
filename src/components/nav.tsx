"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Live" },
  { href: "/heatmap", label: "Heatmap" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-0.5 rounded-full border border-black/8 bg-white/60 p-0.5 text-[13px] dark:border-white/10 dark:bg-white/[0.03]">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative rounded-full px-3.5 py-1.5 font-medium transition-colors ${
              active ? "text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active ? (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              />
            ) : null}
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
