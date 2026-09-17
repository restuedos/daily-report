export const dynamic = "force-dynamic";

import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center px-4 py-10">
      <RegisterForm />
    </div>
  );
}
