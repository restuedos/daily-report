export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { DeliveryNoteForm } from "@/components/DeliveryNoteForm";

export default function NewDeliveryNotePage() {
  return (
    <AppShell>
      <DeliveryNoteForm />
    </AppShell>
  );
}
