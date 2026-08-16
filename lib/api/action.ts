import { unstable_rethrow } from "next/navigation";

import { actionFailure, type ActionResult } from "./errors";
import { lastApiMessage, withApiMessages } from "./message-store";

/**
 * The shared body of every Server Action in the dashboard.
 *
 * It does three things each action would otherwise repeat:
 *   - opens the message scope, so the API's own wording reaches the toast
 *   - turns a thrown ApiRequestError into a rendered `{ ok: false, errors }`
 *   - lets Next's own control-flow errors through, so the `redirect()` a 401
 *     triggers is not swallowed and reported as a failed action
 *
 * `fallbackMessage` is only used when the API sends nothing usable.
 */
export function apiAction<T = undefined>(
  fallbackMessage: string,
  run: () => Promise<T>,
): Promise<ActionResult<T>> {
  return withApiMessages(async () => {
    try {
      const data = await run();
      return { ok: true as const, data, message: lastApiMessage(fallbackMessage) };
    } catch (error) {
      unstable_rethrow(error);
      return actionFailure(error);
    }
  });
}
