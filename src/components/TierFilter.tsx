import "./TierFilter.scss";

type TierProps = {
  tierGroup: number;
  setTierGroup: (tier: number) => void;
}

const tiers = [
  { tier: 1, label: "Top 50 Favorites" },
  { tier: 2, label: "50 >" },
  { tier: 3, label: "Final Favs" },
  { tier: 0, label: "All" }
]


function TierFilter({tierGroup, setTierGroup}: TierProps) {
  return (
    <div id="tier-filter">
      {tiers.map((i) => (
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
