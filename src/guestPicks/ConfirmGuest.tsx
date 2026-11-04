import "./ConfirmGuest.scss";
import type { Guest } from "./api.ts";

function ConfirmGuest({ guest, onConfirm, onBack }: { guest: Guest; onConfirm: () => void; onBack: () => void }) {
  return (
    <div className="guest-confirm">
      <p>
        Continue as <strong>{guest.displayName}</strong>?
      </p>
      <div className="btn-set">
        <button type="button" className="btn-primary" onClick={onConfirm}>Yes</button>
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

export default ConfirmGuest;
