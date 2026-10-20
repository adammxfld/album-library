// Spotify Authorization Code with PKCE, run entirely in the browser (no client secret).

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
];

const VERIFIER_KEY = "spotify_pkce_verifier";
const STATE_KEY = "spotify_auth_state";
const TOKENS_KEY = "spotify_tokens";

// Refresh this long before the access token actually expires.
const EXPIRY_MARGIN_MS = 60_000;

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  // Epoch ms at which the access token stops working.
  expiresAt: number;
};

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomString(byteLength: number): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export function getStoredTokens(): SpotifyTokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as SpotifyTokens) : null;
  } catch {
    return null;
  }
}

// Lets React re-render when the session starts or ends (see useSpotifyPlayer).
const listeners = new Set<() => void>();

export function subscribeToAuth(listener: () => void): () => void {
  listeners.add(listener);
  // Also picks up connect/disconnect from another tab.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function isConnected(): boolean {
  return getStoredTokens() !== null;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  // Omitted on some refreshes, in which case the current one stays valid.
  refresh_token?: string;
};

function storeTokens(data: TokenResponse, fallbackRefreshToken = ""): SpotifyTokens {
  const tokens: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? fallbackRefreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  listeners.forEach((listener) => listener());
  return tokens;
}

export function logout(): void {
  localStorage.removeItem(TOKENS_KEY);
  listeners.forEach((listener) => listener());
}

// Sends the user to Spotify's consent screen; they come back to REDIRECT_URI with ?code=...
export async function login(): Promise<void> {
  const verifier = randomString(64);
  const state = randomString(16);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES.join(" "),
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge_method: "S256",
    code_challenge: base64Url(new Uint8Array(digest)),
  });

  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

// Call once on page load. If the URL holds an auth redirect, swaps the code for
// tokens and stores them; otherwise does nothing.
export async function handleRedirectCallback(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return;

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);

  // Drop ?code/?state so a reload doesn't retry a spent code.
  window.history.replaceState({}, "", window.location.pathname);

  if (error) throw new Error(`Spotify authorization failed: ${error}`);
  if (!verifier || params.get("state") !== expectedState) {
    throw new Error("Spotify authorization failed: state mismatch");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code!,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${await response.text()}`);
  }

  storeTokens(await response.json());
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
    });
  } catch {
    // Offline or blocked: keep the session so a later call can retry.
    return null;
  }

  if (!response.ok) {
    // 4xx means the refresh token was revoked or expired, so the user has to
    // connect again. Anything else is Spotify's problem; keep the session.
    if (response.status < 500) logout();
    return null;
  }

  return storeTokens(await response.json(), refreshToken).accessToken;
}

// Returns a usable access token, refreshing it first if it is about to expire.
// Resolves to null when Spotify isn't connected or the session can't be renewed.
export async function getAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - EXPIRY_MARGIN_MS) return tokens.accessToken;

  // Share one in-flight refresh: Spotify rotates refresh tokens, so parallel
  // refreshes with the same token would invalidate each other.
  refreshPromise ??= refreshAccessToken(tokens.refreshToken).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}
