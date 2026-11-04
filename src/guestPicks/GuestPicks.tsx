import "./GuestPicks.scss";

// Link from the Guest Picks list to the guest submission page.
function GuestPicks() {
  return (
    <>
      <h2>Guest Picks</h2>
      <a className="guest-picks-link" href="guest-submission.html"><span>add yours</span></a>
    </>
  );
}

export default GuestPicks;
