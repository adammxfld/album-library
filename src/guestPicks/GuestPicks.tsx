import { useEffect, useRef } from "react";
import type { GuestLegendItem } from "./useGuestPicks.ts";
import "./GuestPicks.scss";

// Link from the Guest Picks list to the guest submission page. Each time `cue`
// goes up, the list scrolls to the top and the link pulses.
function GuestPicks({ cue = 0, legend = [] }: { cue?: number; legend?: GuestLegendItem[] }) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (cue === 0) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    linkRef.current?.closest(".album-list")?.scrollTo({ top: 0, behavior }); // larger screens scroll the list
    window.scrollTo({ top: 0, behavior }); // phones scroll the page
  }, [cue]);

  return (
    <>
      <h2>Guest Picks</h2>
      <a
        key={cue} // remounting restarts the highlight on every repeat click
        ref={linkRef}
        className={`guest-picks-link${cue > 0 ? " cued" : ""}`}
        href="guest-submission.html">
        <span>add yours</span>
      </a>
      {legend.length > 0 && (
        <ul className="guest-legend">
          {legend.map((guest) => (
            <li key={guest.guestId} style={{ "--theme-color": guest.color } as React.CSSProperties}>
              {guest.displayName}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default GuestPicks;
