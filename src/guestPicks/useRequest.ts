import { useState } from "react";

// Runs one request at a time, tracking busy state and a readable error.
export function useRequest() {
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function run(task: () => Promise<void>) {
    setError(null);
    setIsBusy(true);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  return { error, setError, isBusy, run };
}
