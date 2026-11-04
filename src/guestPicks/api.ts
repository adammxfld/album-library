import { createClient } from "@supabase/supabase-js";

// The publishable key is public by design; the database's access rules and
// functions (supabase/schema.sql) decide what it can do.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export interface Guest {
  displayName: string;
  color: string;
}

// A guest's own pick, as shown on the submission page.
export interface MyPick {
  id: string;
  artist: string;
  title: string;
  createdAt: string;
}

// A pick in the shared Guest Picks list.
export interface GuestPick extends MyPick {
  displayName: string;
  color: string;
  guestId: string;
  guestCreatedAt: string;
}

type GuestRow = { display_name: string; color: string };
type PickRow = { id: string; artist: string; title: string; created_at: string };
type PublicPickRow = PickRow & GuestRow & { guest_id: string; guest_created_at: string };

const toGuest = (row: GuestRow): Guest => ({ displayName: row.display_name, color: row.color });

const toMyPick = (row: PickRow): MyPick => ({
  id: row.id,
  artist: row.artist,
  title: row.title,
  createdAt: row.created_at,
});

// Database functions raise readable messages (e.g. "Limit of 25 picks
// reached"), so pass those through; anything else gets a generic message.
function fail(error: { message: string; code?: string }): never {
  console.error("Guest Picks request failed", error);
  throw new Error(error.code === "P0001" ? error.message : "Something went wrong. Try again.");
}

// For functions that always return exactly one row.
function firstRow<T>(data: unknown): T {
  const row = (data as T[])[0];
  if (!row) fail({ message: "Expected a row, got none" });
  return row;
}

// Returns the guest for this login name, or null if it doesn't exist yet.
export async function signInGuest(login: string): Promise<Guest | null> {
  const { data, error } = await supabase.rpc("sign_in_guest", { p_login: login });
  if (error) fail(error);
  const row = (data as GuestRow[])[0];
  return row ? toGuest(row) : null;
}

export async function createGuest(login: string, displayName: string): Promise<Guest> {
  const { data, error } = await supabase.rpc("create_guest", {
    p_login: login,
    p_display_name: displayName,
  });
  if (error) fail(error);
  return toGuest(firstRow<GuestRow>(data));
}

export async function getMyPicks(login: string): Promise<MyPick[]> {
  const { data, error } = await supabase.rpc("my_guest_picks", { p_login: login });
  if (error) fail(error);
  return (data as PickRow[]).map(toMyPick);
}

export async function addPick(login: string, artist: string, title: string): Promise<MyPick> {
  const { data, error } = await supabase.rpc("add_guest_pick", {
    p_login: login,
    p_artist: artist,
    p_title: title,
  });
  if (error) fail(error);
  return toMyPick(firstRow<PickRow>(data));
}

export async function deletePick(login: string, pickId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_guest_pick", { p_login: login, p_pick_id: pickId });
  if (error) fail(error);
}

// Every pick, with its guest's display name and color.
export async function getAllPicks(): Promise<GuestPick[]> {
  const { data, error } = await supabase
    .from("guest_picks_public")
    .select("id, artist, title, display_name, color, created_at, guest_id, guest_created_at");
  if (error) fail(error);
  return (data as PublicPickRow[]).map((row) => ({
    ...toMyPick(row),
    ...toGuest(row),
    guestId: row.guest_id,
    guestCreatedAt: row.guest_created_at,
  }));
}

// Calls onChange whenever any pick is added or deleted. Returns an unsubscribe
// function for effect cleanup.
export function subscribeToPicks(onChange: () => void): () => void {
  const channel = supabase
    .channel(`guest-picks-${crypto.randomUUID()}`) // unique, so re-subscribing never collides
    .on("postgres_changes", { event: "*", schema: "public", table: "guest_picks" }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// The login name is remembered so returning guests skip sign-in. Storage can
// be unavailable (private mode, blocked site data), so failures are ignored.
const LOGIN_KEY = "guest_picks_login";

export function getSavedLogin(): string | null {
  try {
    return localStorage.getItem(LOGIN_KEY);
  } catch {
    return null;
  }
}

export function saveLogin(login: string): void {
  try {
    localStorage.setItem(LOGIN_KEY, login);
  } catch {
    // Ignore — they'll just enter it again next visit.
  }
}

export function clearLogin(): void {
  try {
    localStorage.removeItem(LOGIN_KEY);
  } catch {
    // Ignore.
  }
}
