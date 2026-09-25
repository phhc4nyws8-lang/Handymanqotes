import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SessionPayload, verifySessionToken } from "./session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
