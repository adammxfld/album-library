import "./LoadingDots.scss";

// Three dots that scale up one after another while something loads.
function LoadingDots({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loading-dots" role="status" aria-label={label}>
      <span />
      <span />
      <span />
    </div>
  );
}

export default LoadingDots;
