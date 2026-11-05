import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./InfoOverlay.scss";

// Project info. Rendered on <body> so the squashed headline doesn't distort it.
// A tap anywhere (or Escape) fades it out, then closes it.
function InfoOverlay({ onClose }: { onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsClosing(true);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return createPortal(
    <div
      className={`info-overlay${isClosing ? " info-overlay--closing" : ""}`}
      onClick={() => setIsClosing(true)}
      onAnimationEnd={(e) => {
        // Only the backdrop's own fade-out, not the panel's (which bubbles up here).
        if (isClosing && e.target === e.currentTarget) onClose();
      }}>
      <div className="info-overlay-panel" role="dialog" aria-modal="true" aria-label="About LongPlayers">
        <p>Certain albums are extra rewarding if you start at the beginning. Slow down your brain. Ignore your family. Your job. Your hygiene. And take the whole ride. No skipping. Proper LPs.</p>
      </div>
    </div>,
    document.body,
  );
}

export default InfoOverlay;
