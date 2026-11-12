// Fills in album art and Apple's spelling for guest picks added before the
// lookup existed, using the same matching as the guest page (lookupAlbum.ts).
//
//   npx tsx scripts/backfillGuestPicks.ts           # preview, changes nothing
//   npx tsx scripts/backfillGuestPicks.ts --apply   # save the changes
//
// Needs SUPABASE_SECRET_KEY in .env (Supabase dashboard → Project Settings →
// API Keys). Never give it a VITE_ prefix: that would ship it to the browser.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { lookupAlbum } from "../src/guestPicks/lookupAlbum.ts";

// Apple allows roughly 20 calls a minute, and one lookup can use up to four.
const DELAY_MS = 12000;

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env");

  const apply = process.argv.includes("--apply");
  const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

  // Picks that already have art were added with the lookup, so they're done.
  const { data: picks, error } = await supabase
    .from("guest_picks")
    .select("id, artist, title")
    .is("image_small", null)
    .order("created_at");
  if (error) throw error;

  console.log(`${picks.length} picks without art${apply ? "" : " (preview: add --apply to save)"}\n`);

  let updated = 0;
  for (const [i, pick] of picks.entries()) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    const before = `${pick.artist} / ${pick.title}`;
    const match = await lookupAlbum(pick.artist, pick.title);
    if (!match) {
      console.log(`  no match  ${before}`);
      continue;
    }
    const after = `${match.artist} / ${match.title}`;
    console.log(`  ${match.imageSmall ? "art     " : "no art  "}  ${before}${after !== before ? `  →  ${after}` : ""}`);
    if (!apply) continue;

    const { error: updateError } = await supabase
      .from("guest_picks")
      .update({ artist: match.artist, title: match.title, image_small: match.imageSmall })
      .eq("id", pick.id);
    if (updateError) console.error(`    failed: ${updateError.message}`);
    else updated++;
  }

  if (apply) console.log(`\nUpdated ${updated} of ${picks.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
