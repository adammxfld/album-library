import { useEffect, useState } from "react";
import type { AlbumListEntry } from "../components/AlbumList.tsx";
import type { SortOrder } from "../hooks/useAlbumFilters.ts";
import { getAllPicks, subscribeToPicks } from "./api.ts";
import type { GuestPick } from "./api.ts";

// null = grouped by guest in the order they joined, titles A–Z within each.
export type GuestSortOrder = SortOrder | null;

export interface GuestPickEntry extends AlbumListEntry {
  id: string;
}

export interface GuestLegendItem {
  guestId: string;
  displayName: string;
  color: string;
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

// Stable pseudo-random rank per pick for a given seed, so picks that arrive
// live slot in without reshuffling the whole list.
function randomRank(id: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 2654435761);
  }
  return (hash ^ (hash >>> 16)) >>> 0;
}

const byTitle = (a: GuestPick, b: GuestPick) => a.title.localeCompare(b.title);

function sortPicks(picks: GuestPick[], order: GuestSortOrder, seed: number): GuestPick[] {
  const sorted = [...picks];
  if (order === "alphabetical") return sorted.sort(byTitle);
  if (order === "random") return sorted.sort((a, b) => randomRank(a.id, seed) - randomRank(b.id, seed));
  return sorted.sort(
    (a, b) =>
      Date.parse(a.guestCreatedAt) - Date.parse(b.guestCreatedAt) ||
      a.guestId.localeCompare(b.guestId) || // same join time: keep each guest together
      byTitle(a, b),
  );
}

// Loads all guest picks and keeps them live while `enabled` (Guest Picks selected).
export function useGuestPicks(enabled: boolean) {
  const [picks, setPicks] = useState<GuestPick[] | null>(null); // null until first load
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<GuestSortOrder>(null);
  const [seed, setSeed] = useState(newSeed);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    function load() {
      getAllPicks()
        .then((result) => {
          if (cancelled) return;
          setPicks(result);
          setError(null);
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        });
    }

    load();
    const unsubscribe = subscribeToPicks(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled]);

  // Clicking the highlighted icon again returns to grouped order.
  function toggleSortOrder(order: SortOrder) {
    if (order === sortOrder) {
      setSortOrder(null);
      return;
    }
    if (order === "random") setSeed(newSeed());
    setSortOrder(order);
  }

  function resetSortOrder() {
    setSortOrder(null);
  }

  const isLoading = enabled && picks === null && error === null;

  const sorted = sortPicks(picks ?? [], sortOrder, seed);
  const isGrouped = sortOrder === null;
  // Grouped by guest: the name heads each guest's run of picks.
  const entries: GuestPickEntry[] = sorted.map((pick, i) => ({
    id: pick.id,
    artist: pick.artist,
    title: pick.title,
    themeColor: pick.color,
    imageSmall: pick.imageSmall,
    groupLabel: isGrouped && pick.guestId !== sorted[i - 1]?.guestId ? pick.displayName : undefined,
  }));

  // Alphabetical or random: every guest listed once above the picks, in the order they joined.
  const legend: GuestLegendItem[] = isGrouped
    ? []
    : sortPicks(picks ?? [], null, seed)
        .filter((pick, i, all) => pick.guestId !== all[i - 1]?.guestId)
        .map(({ guestId, displayName, color }) => ({ guestId, displayName, color }));

  return { entries, legend, isLoading, error, sortOrder, toggleSortOrder, resetSortOrder };
}
