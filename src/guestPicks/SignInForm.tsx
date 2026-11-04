import "./SignInForm.scss";
import { useState } from "react";

const MIN_LOGIN_LENGTH = 8;

function SignInForm({ isBusy, onSubmit }: { isBusy: boolean; onSubmit: (login: string) => void }) {
  const [login, setLogin] = useState("");
  const trimmed = login.trim();
  const isValid = trimmed.length >= MIN_LOGIN_LENGTH;

  return (
    <form
      className="guest-signin"
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onSubmit(trimmed);
      }}>
      <label>
        Login name
        <small id="login-hint">(Private, at least {MIN_LOGIN_LENGTH} characters. Use it to come back to your picks.)</small>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          maxLength={64}
          required
          aria-describedby="login-hint"
        />
      </label>
      <button type="submit" className="btn-primary" disabled={!isValid || isBusy}>Continue</button>
    </form>
  );
}

export default SignInForm;
