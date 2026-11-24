/** Gives the main thread back (so a long boot never blocks input). */
export function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } })
    .scheduler;
  return scheduler?.yield
    ? scheduler.yield()
    : new Promise((resolve) => setTimeout(resolve, 0));
}
