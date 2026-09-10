import "./TierFilter.scss";

type TierProps = {
  setTierGroup: (tier: number) => void;
}

const tiers = [
  { tier: 1, label: "The Top" },
  { tier: 2, label: "Close Favorites" },
  { tier: 3, label: "Too Good to Ignore" },
  { tier: 0, label: "All" }
]


function TierFilter({setTierGroup}: TierProps) {
  return (
    <div id="tier-filter">
      {tiers.map((i) => (
        <button key={i.tier} onClick={() => setTierGroup(i.tier)}>{i.label}</button>
      ))}
    </div>
  );
}

export default TierFilter;
