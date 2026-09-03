import "./TierFilter.scss";

type TierProps = {
  setTier: (tier: number) => void;
}

const tiers = [
  { tier: 1, label: "The Top" },
  { tier: 2, label: "Close Favorites" },
  { tier: 3, label: "Too Good to Ignore" },
  { tier: 0, label: "All" }
]


function TierFilter({setTier}: TierProps) {
  return (
    <div>
      {tiers.map((i) => (
        <button key={i.tier} onClick={() => setTier(i.tier)}>{i.label}</button>
      ))}
    </div>
  );
}

export default TierFilter;
