"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type LoginState } from "@/lib/login-action";

const initialState: LoginState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const errorParam = searchParams.get("error");
  const error =
    state.error ||
    (errorParam === "CredentialsSignin"
      ? "Email atau password salah"
      : errorParam
        ? `Login gagal: ${errorParam}`
        : "");

  return (
    <form action={formAction} className="card mx-auto w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Masuk</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Kelola daily report dan surat jalan.</p>
      </div>

      <div className="field">
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="username"
          required
        />
      </div>
      <div className="field">
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Masuk..." : "Login"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Belum punya akun? <Link href="/register">Daftar</Link>
      </p>
    </form>
  );
}
