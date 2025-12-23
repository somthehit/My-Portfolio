import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "admin_session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(secret);
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const rows = await db.select().from(user).where(eq(user.email, email)).limit(1);
  const u = rows[0] ?? null;
  if (!u) return false;

  if (u.role !== "super-admin") return false;

  const stored = u.password;

  const looksHashed =
    stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");

  if (looksHashed) {
    return bcrypt.compare(password, stored);
  }

  const ok = stored === password;
  if (!ok) return false;

  const nextHash = await bcrypt.hash(password, 10);
  await db.update(user).set({ password: nextHash }).where(eq(user.id, u.id));

  return true;
}

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ sub: email, role: "super-admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await jwtVerify(token, getSecret());
    const email = typeof payload.payload.sub === "string" ? payload.payload.sub : null;

    if (!email) return null;
    if (payload.payload.role !== "super-admin") return null;

    const rows = await db.select({ role: user.role }).from(user).where(eq(user.email, email)).limit(1);
    const u = rows[0] ?? null;
    if (!u) return null;
    if (u.role !== "super-admin") return null;

    return { email };
  } catch {
    return null;
  }
}
