"use client";

import { CalendarDays, Dumbbell, Grid3x3, Radio, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { localDate, shiftDate } from "@/lib/analysis";
import { FACILITIES } from "@/lib/facilities";

const PAGES = [
  { href: "/", label: "Live", icon: Radio },
  { href: "/day", label: "Day", icon: CalendarDays },
  { href: "/heatmap", label: "Heatmap", icon: Grid3x3 },
];

const DAYS = [
  { offset: -1, label: "Yesterday" },
  { offset: 0, label: "Today" },
  { offset: 1, label: "Tomorrow" },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-8 items-center gap-2 rounded-md border bg-card pr-1.5 pl-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden pr-6 sm:inline">Search</span>
        <kbd className="hidden rounded-[4px] bg-muted px-1.5 py-0.5 font-sans text-[11px] tracking-widest sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a page, facility or day">
        <Command>
          <CommandInput placeholder="Search pages, facilities, days…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Pages">
              {PAGES.map(({ href, label, icon: Icon }) => (
                <CommandItem key={href} onSelect={() => go(href)}>
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Facilities">
              {FACILITIES.map((f) => (
                <CommandItem key={f.id} keywords={[f.name, f.building]} onSelect={() => go(`/day?f=${f.id}`)}>
                  <Dumbbell />
                  {f.shortName}
                  <CommandShortcut>{f.building}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Days">
              {DAYS.map(({ offset, label }) => (
                <CommandItem
                  key={label}
                  onSelect={() => go(`/day?date=${shiftDate(localDate(new Date()), offset)}`)}
                >
                  <CalendarDays />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
