"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Live" },
  { href: "/day", label: "Day" },
  { href: "/heatmap", label: "Heatmap" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex h-full gap-4 text-[13.5px] sm:gap-5">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative flex h-full items-center font-medium transition-colors ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
            {active ? (
              <motion.span
                layoutId="nav-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground"
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
