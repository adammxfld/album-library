import type { TierGroup } from "../hooks/useAlbumFilters";
import "./TierFilter.scss";

type TierProps = {
  tierGroup: TierGroup;
  setTierGroup: (tier: TierGroup) => void;
}

// `hidden` keeps an option (and its filtering) available without showing its button.
const tiers: { tier: TierGroup; label: string; hidden?: boolean }[] = [
  { tier: 1, label: "My Favorite 50" },
  { tier: 2, label: "Runners-up" },
  { tier: 3, label: "Notables", hidden: true }, // shown within Runners-up for now
  { tier: 0, label: "All", hidden: true },
  { tier: "guest-picks", label: "Guest Picks" },
]


function TierFilter({tierGroup, setTierGroup}: TierProps) {
  return (
    <div className="tier-filter">
      {tiers.filter((i) => !i.hidden).map((i) => (
        <button
          key={i.tier}
          className={`btn-filter tier-${i.tier}${i.tier === tierGroup ? " selected" : ""}`}
          aria-pressed={i.tier === tierGroup}
          onClick={() => setTierGroup(i.tier)}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export default TierFilter;
