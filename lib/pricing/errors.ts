/** A refusal the customer can act on (a size outside the grid, a range with no prices, pricing not
 * configured) — answered as a 400 with its message. Any other error from pricing is a fault: a 500,
 * its message kept in the logs. */
export class PriceInputError extends Error {}

/** Throw on a failed read; "no row" (PGRST116, from `.single()`) is an answer, not a failure. */
export function readOrThrow<R extends { data: unknown; error: { code?: string; message: string } | null }>(what: string, r: R): R["data"] {
  if (r.error && r.error.code !== "PGRST116") throw new Error(`${what} read failed: ${r.error.message}`);
  return r.data;
}
