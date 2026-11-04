import { useState } from "react";

function NewGuestForm({
  isBusy,
  onSubmit,
  onBack,
}: {
  isBusy: boolean;
  onSubmit: (displayName: string) => void;
  onBack: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const trimmed = displayName.trim();

  return (
    <form
      className="guest-new"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) onSubmit(trimmed);
      }}>
      <label>
        Display name (the name others will see)
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          required
          aria-describedby="display-name-hint"
        />
        <small id="display-name-hint">Up to 40 characters. This can't be changed later.</small>
      </label>
      <div className="btn-set">
        <button type="submit" className="btn-primary" disabled={!trimmed || isBusy}>Create</button>
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
      </div>
    </form>
  );
}

export default NewGuestForm;
