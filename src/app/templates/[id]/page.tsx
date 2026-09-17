export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { TemplateEditor } from "@/components/TemplateEditor";

type Props = { params: Promise<{ id: string }> };

export default async function TemplateEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell>
      <TemplateEditor id={id} />
    </AppShell>
  );
}
