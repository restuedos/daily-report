import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center px-4 py-10">
      <Suspense fallback={<div className="card mx-auto w-full max-w-md p-6">Memuat form login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
