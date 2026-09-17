"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Gagal mendaftar");
      setLoading(false);
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Daftar</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Buat akun untuk menyimpan report Anda.</p>
      </div>
      <div className="field">
        <label className="label">Nama</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button className="btn btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Memproses..." : "Buat akun"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Sudah punya akun? <Link href="/login">Login</Link>
      </p>
    </form>
  );
}
