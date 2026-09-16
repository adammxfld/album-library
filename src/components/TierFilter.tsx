import "./TierFilter.scss";

type TierProps = {
  tierGroup: number;
  setTierGroup: (tier: number) => void;
}

const tiers = [
  { tier: 1, label: "The Top" },
  { tier: 2, label: "Close Favorites" },
  { tier: 3, label: "Don't Miss" },
  { tier: 0, label: "All" }
]


function TierFilter({tierGroup, setTierGroup}: TierProps) {
  return (
    <div id="tier-filter">
      {tiers.map((i) => (
        <button
          key={i.tier}
          className={i.tier === tierGroup ? "selected" : undefined}
          aria-pressed={i.tier === tierGroup}
          onClick={() => setTierGroup(i.tier)}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export default TierFilter;
