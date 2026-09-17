"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi" };
  }

  // Best-effort history; user id resolved after successful auth redirect is hard,
  // so store by email lookup on success path before redirect throw.
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau password salah" };
    }

    // Successful sign-in throws a redirect; record history then rethrow.
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const h = await headers();
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            ip:
              h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              h.get("x-real-ip") ||
              null,
            userAgent: h.get("user-agent") || null,
            device: h.get("user-agent")?.slice(0, 120) || null,
          },
        });
      }
    } catch {
      // ignore history failures
    }

    throw error;
  }
}
