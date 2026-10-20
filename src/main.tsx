import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { handleRedirectCallback } from "./spotify/auth.ts";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

// Finish a Spotify login redirect (if any) before rendering, so the app
// starts with tokens already in place.
handleRedirectCallback()
  .catch(console.error)
  .finally(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
