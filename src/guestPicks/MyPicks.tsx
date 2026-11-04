import "./MyPicks.scss";
import { useEffect, useState } from "react";
import { addPick, deletePick, getMyPicks } from "./api.ts";
import type { Guest, MyPick } from "./api.ts";
import { useRequest } from "./useRequest.ts";

const MAX_PICKS = 25;

function MyPicks({ login, guest, onChangeLogin }: { login: string; guest: Guest; onChangeLogin: () => void }) {
  const [picks, setPicks] = useState<MyPick[] | null>(null);
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const { error, setError, isBusy, run } = useRequest();

  useEffect(() => {
    let cancelled = false;
    getMyPicks(login)
      .then((result) => {
        if (!cancelled) setPicks(result);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [login, setError]);

  const count = picks?.length ?? 0;
  const isFull = count >= MAX_PICKS;
  const canAdd = picks !== null && !isFull && !isBusy && artist.trim() !== "" && title.trim() !== "";

  function handleAdd() {
    run(async () => {
      const pick = await addPick(login, artist, title);
      setPicks((current) => [...(current ?? []), pick]);
      setArtist("");
      setTitle("");
    });
  }

  function handleDelete(pickId: string) {
    run(async () => {
      await deletePick(login, pickId);
      setPicks((current) => current?.filter((pick) => pick.id !== pickId) ?? null);
    });
  }

  return (
    <section className="guest-picks">
      <header className="guest-header">
        <p className="guest-name" style={{ backgroundColor: guest.color }}>
          <span>{guest.displayName}</span>
        </p>
        <div>
          <span>Not you?</span>
          <button type="button" className="btn-secondary guest-change-login" onClick={onChangeLogin}>Change login</button>
        </div>
      </header>

      <form
        className="guest-pick-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (canAdd) handleAdd();
        }}>
        <label>
          Artist
          <input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={200} />
        </label>
        <label>
          Album
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </label>
        <button type="submit" className="btn-primary" disabled={!canAdd}>Add</button>
        <p className="guest-count">{count} / {MAX_PICKS}</p>
      </form>

      {error && <p className="guest-error" role="alert">{error}</p>}

      {picks === null ? (
        <p>Loading…</p>
      ) : picks.length === 0 ? (
        <p>No picks yet.</p>
      ) : (
        <ol className="guest-picks-list">
          {picks.map((pick) => (
            <li key={pick.id}>
              {pick.artist}: {pick.title}
              <button
                type="button"
                className="guest-pick-delete"
                aria-label={`Delete ${pick.artist} – ${pick.title}`}
                disabled={isBusy}
                onClick={() => handleDelete(pick.id)}>
                ×
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default MyPicks;
