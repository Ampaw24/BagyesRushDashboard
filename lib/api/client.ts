import { redirect } from "next/navigation";

import { getSessionToken } from "../auth/session";
import { apiUrl } from "./config";
import {
  ApiRequestError,
  ApiUnreachableError,
  isMissingEndpoint,
  type FieldErrors,
} from "./errors";
import { rememberApiMessage } from "./message-store";
import { toQueryString, type QueryValue } from "./query";
import type { ApiEnvelope, Paginated } from "./types";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  /** JSON body. Mutually exclusive with `formData`. */
  body?: unknown;
  /** Multipart body, for the image-upload endpoints. */
  formData?: FormData;
  /**
   * Skip the session cookie — used only by `POST /v1/login`, which is the one
   * call made before a token exists.
   */
  anonymous?: boolean;
};

/**
 * Every call to the Laravel API goes through here.
 *
 * Responsibilities, in order:
 *   - attach the bearer token from the httpOnly session cookie
 *   - unwrap the `{ success, message, data }` envelope defined in ApiController
 *   - translate HTTP status codes into typed errors the UI can act on
 *
 * Server-side only. It reads cookies, so importing it from a Client Component
 * is a build error — mutations must go through a Server Action instead.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, formData, anonymous = false } = options;

  const headers: Record<string, string> = { Accept: "application/json" };

  if (!anonymous) {
    const token = await getSessionToken();
    // No cookie at all means the session is already gone; skip the round trip.
    if (!token) redirect("/logout?reason=expired");
    headers.Authorization = `Bearer ${token}`;
  }

  // Content-Type is set only for JSON. For FormData the runtime must generate
  // it, because the multipart boundary is part of the header value.
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${apiUrl(path)}${toQueryString(query ?? {})}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      // Next's default is "auto no cache", which would let a route prerender an
      // admin list at build time. Admin data is always request-time.
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiUnreachableError(cause);
  }

  // 204 and the document-download endpoints have no JSON body to parse.
  const payload = await readJson(response);

  if (!response.ok || payload?.success === false) {
    throw await toApiError(response, payload);
  }

  if (payload === null) {
    throw new ApiRequestError(response.status, "The API returned an unreadable response.");
  }

  // Keep the API's own wording available to the action layer, which reports it
  // to the admin. Without this the envelope's `message` would be discarded here.
  if ("message" in payload && typeof payload.message === "string") {
    rememberApiMessage(payload.message);
  }

  return (payload as { data: T }).data;
}

/** Convenience wrapper for the `{ items, pagination }` list endpoints. */
export async function apiFetchPage<T>(path: string, options: RequestOptions = {}): Promise<Paginated<T>> {
  return apiFetch<Paginated<T>>(path, options);
}

async function readJson(response: Response): Promise<(ApiEnvelope<unknown> & { success?: boolean }) | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as ApiEnvelope<unknown>;
  } catch {
    return null;
  }
}

async function toApiError(response: Response, payload: ApiEnvelope<unknown> | null): Promise<ApiRequestError> {
  const message =
    payload && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : fallbackMessage(response.status);

  const errors: FieldErrors =
    payload && "errors" in payload && payload.errors ? payload.errors : {};

  // The token was revoked or the account was suspended mid-session. Bounce
  // through /logout, which is a Route Handler and so is allowed to clear the
  // cookie — a Server Component cannot.
  if (response.status === 401) redirect("/logout?reason=expired");

  return new ApiRequestError(response.status, message, errors);
}

function fallbackMessage(status: number): string {
  if (status === 403) return "Your role does not allow this action.";
  if (status === 429) return "Too many requests. Please slow down and try again shortly.";
  if (status >= 500) return "The API is temporarily unavailable. Please try again.";
  return "The request could not be completed.";
}

/**
 * Like `apiFetch`, but returns null when the endpoint does not exist.
 *
 * For screens that call an endpoint a older backend may not have yet: they can
 * render a "needs a newer API" state instead of an error page. Every other
 * failure still throws, so a real outage is not disguised as a missing feature.
 *
 * Use only for collection endpoints, where a 404 cannot mean "no such record".
 */
export async function apiFetchOptional<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (isMissingEndpoint(error)) return null;
    throw error;
  }
}
