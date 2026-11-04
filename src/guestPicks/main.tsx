import React from "react";
import ReactDOM from "react-dom/client";
import "@picocss/pico/css/pico.min.css"; // first, so the page's own styles override it
import GuestSubmission from "./GuestSubmission.tsx";
import "../index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GuestSubmission />
  </React.StrictMode>,
);
