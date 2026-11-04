import "./GuestSubmission.scss";
import { useEffect, useState } from "react";
import { clearLogin, createGuest, getSavedLogin, saveLogin, signInGuest } from "./api.ts";
import type { Guest } from "./api.ts";
import { useRequest } from "./useRequest.ts";
import SignInForm from "./SignInForm.tsx";
import ConfirmGuest from "./ConfirmGuest.tsx";
import NewGuestForm from "./NewGuestForm.tsx";
import MyPicks from "./MyPicks.tsx";

type Screen =
  | { name: "loading" }
  | { name: "signin" }
  | { name: "confirm"; login: string; guest: Guest }
  | { name: "new"; login: string }
  | { name: "picks"; login: string; guest: Guest };

function GuestSubmission() {
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  const { error, isBusy, run } = useRequest();

  // Returning guests go straight to "Continue as …?".
  useEffect(() => {
    const saved = getSavedLogin();
    if (!saved) {
      setScreen({ name: "signin" });
      return;
    }
    signInGuest(saved)
      .then((guest) => setScreen(guest ? { name: "confirm", login: saved, guest } : { name: "signin" }))
      .catch(() => setScreen({ name: "signin" }));
  }, []);

  function handleSignIn(login: string) {
    run(async () => {
      const guest = await signInGuest(login);
      setScreen(guest ? { name: "confirm", login, guest } : { name: "new", login });
    });
  }

  function handleConfirm(login: string, guest: Guest) {
    saveLogin(login);
    setScreen({ name: "picks", login, guest });
  }

  function handleCreate(login: string, displayName: string) {
    run(async () => {
      const guest = await createGuest(login, displayName);
      saveLogin(login);
      setScreen({ name: "picks", login, guest });
    });
  }

  function startOver() {
    clearLogin();
    setScreen({ name: "signin" });
  }

  return (
    <main className="container guest-submission">
      <header className="guest-page-header">
        <h1>Guest Picks</h1>
        <a href="./" className="guest-back-link"><span>to albums</span></a>
      </header>

      {screen.name === "loading" && <p>Loading…</p>}

      {screen.name === "signin" && <SignInForm isBusy={isBusy} onSubmit={handleSignIn} />}

      {screen.name === "confirm" && (
        <ConfirmGuest
          guest={screen.guest}
          onConfirm={() => handleConfirm(screen.login, screen.guest)}
          onBack={startOver}
        />
      )}

      {screen.name === "new" && (
        <NewGuestForm
          isBusy={isBusy}
          onSubmit={(displayName) => handleCreate(screen.login, displayName)}
          onBack={startOver}
        />
      )}

      {screen.name === "picks" && (
        <MyPicks login={screen.login} guest={screen.guest} onChangeLogin={startOver} />
      )}

      {error && <p className="guest-error" role="alert">{error}</p>}
    </main>
  );
}

export default GuestSubmission;
