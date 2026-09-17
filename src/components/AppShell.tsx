import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(247,250,248,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
            Daily Report
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link className="nav-link" href="/dashboard">
              Dashboard
            </Link>
            <Link className="nav-link" href="/reports">
              Reports
            </Link>
            <Link className="nav-link" href="/delivery-notes">
              Surat Jalan
            </Link>
            {role === "ADMIN" && (
              <>
                <Link className="nav-link" href="/templates">
                  Templates
                </Link>
                <Link className="nav-link" href="/admin/login-history">
                  Login History
                </Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[var(--muted)] sm:inline">{session?.user?.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="btn btn-ghost" type="submit">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
