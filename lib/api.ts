/**
 * Shared API helpers: auth guards, response builders, error formatting.
 * Import in every route handler to avoid boilerplate.
 */
import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodError } from "zod";

// ─── Auth guards ──────────────────────────────────────────────────────────────

type AuthOk   = { session: Session; error: null };
type AuthFail = { session: null;    error: NextResponse };
type AuthResult = AuthOk | AuthFail;

export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: fail("Unauthorized", 401) };
  }
  return { session, error: null };
}

export async function requireAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: fail("Unauthorized", 401) };
  }
  if (session.user.role !== "admin") {
    return { session: null, error: fail("Forbidden", 403) };
  }
  return { session, error: null };
}

// ─── Response builders ────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

export function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// ─── Zod error formatter ──────────────────────────────────────────────────────

export function zodFail(err: ZodError): NextResponse {
  const message = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
  return fail(message, 422);
}
