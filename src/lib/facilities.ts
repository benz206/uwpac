export type FacilityId =
  | "cif"
  | "pac-free-weights"
  | "pac-functional"
  | "pac-cardio"
  | "pac-machines"
  | "warrior-zone";

export type Building = "PAC" | "CIF";

export interface Facility {
  id: FacilityId;
  upstreamId: string;
  name: string;
  shortName: string;
  building: Building;
}

export const FACILITIES: Facility[] = [
  {
    id: "pac-free-weights",
    upstreamId: "7c59cbfb-ea06-46e0-8ec7-06739ccaec45",
    name: "PAC - 1st Floor - Free Weights",
    shortName: "Free Weights",
    building: "PAC",
  },
  {
    id: "pac-machines",
    upstreamId: "b08d4801-c28c-4eba-8602-8e904ae0568c",
    name: "PAC - 2nd Floor - Weight Machines",
    shortName: "Weight Machines",
    building: "PAC",
  },
  {
    id: "pac-cardio",
    upstreamId: "db0e08e1-faa7-4bc5-b639-088d7642a53e",
    name: "PAC - 2nd Floor - Cardio",
    shortName: "Cardio",
    building: "PAC",
  },
  {
    id: "pac-functional",
    upstreamId: "b03ac6cb-b6ec-4fd4-bd21-e9872a3a43f3",
    name: "PAC - 1st Floor - Functional",
    shortName: "Functional",
    building: "PAC",
  },
  {
    id: "warrior-zone",
    upstreamId: "f30dc951-26b0-4909-b814-ce54d38c2fbb",
    name: "Warrior Zone",
    shortName: "Warrior Zone",
    building: "PAC",
  },
  {
    id: "cif",
    upstreamId: "b2d98ff8-e37a-42da-bf72-06b259ff1a2c",
    name: "CIF Fitness Centre",
    shortName: "CIF",
    building: "CIF",
  },
];

export const FACILITY_BY_ID = Object.fromEntries(
  FACILITIES.map((f) => [f.id, f]),
) as Record<FacilityId, Facility>;

export const FACILITY_BY_UPSTREAM_ID = Object.fromEntries(
  FACILITIES.map((f) => [f.upstreamId, f]),
) as Record<string, Facility>;

export const FACILITY_IDS = FACILITIES.map((f) => f.id);

export function isFacilityId(value: string): value is FacilityId {
  return value in FACILITY_BY_ID;
}

export const TIMEZONE = "America/Toronto";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type Hours = { open: number; close: number };

const PAC_WEEKDAY: Hours = { open: 6, close: 24.5 };
const PAC_WEEKEND: Hours = { open: 9, close: 24.5 };
const CIF_WEEKDAY: Hours = { open: 14.5, close: 24.5 };

export const WEEKLY_HOURS: Record<Building, Hours[]> = {
  PAC: [
    PAC_WEEKEND,
    PAC_WEEKDAY,
    PAC_WEEKDAY,
    PAC_WEEKDAY,
    PAC_WEEKDAY,
    PAC_WEEKDAY,
    PAC_WEEKEND,
  ],
  CIF: [
    { open: 9, close: 24.5 },
    CIF_WEEKDAY,
    CIF_WEEKDAY,
    CIF_WEEKDAY,
    CIF_WEEKDAY,
    { open: 13, close: 24.5 },
    { open: 9, close: 22.5 },
  ],
};

export function isSlotOpen(facility: FacilityId, day: number, hour: number) {
  const { open, close } = WEEKLY_HOURS[FACILITY_BY_ID[facility].building][day];
  return open <= hour && hour + 1 <= close;
}
