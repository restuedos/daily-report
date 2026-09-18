"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NumberedListField } from "@/components/NumberedListField";

export type ManpowerRow = {
  name: string;
  qualification: string;
  workingHours: string;
  remarks?: string;
  extraJob?: string;
};

export type EquipmentRow = {
  name: string;
  quantity: string;
};

export type ReportFormState = {
  projectNo: string;
  projectName: string;
  reportNo: string;
  weekNo: string;
  reportDate: string;
  companyName: string;
  companyLogoKey: string;
  clientId: string;
  clientName: string;
  clientLogoKey: string;
  arrivalTime: string;
  leaveTime: string;
  workDescription: string;
  activitiesDone: string;
  notes: string;
  workEvaluation: string;
  activitiesNextShift: string;
  signerName: string;
  signatureObjectKey: string;
  signedDate: string;
  status: "DRAFT" | "FINAL";
  manpower: ManpowerRow[];
  equipment: EquipmentRow[];
  photoKeys: string[];
};

const empty: ReportFormState = {
  projectNo: "",
  projectName: "",
  reportNo: "",
  weekNo: "",
  reportDate: new Date().toISOString().slice(0, 10),
  companyName: "",
  companyLogoKey: "",
  clientId: "",
  clientName: "",
  clientLogoKey: "",
  arrivalTime: "",
  leaveTime: "",
  workDescription: "",
  activitiesDone: "",
  notes: "",
  workEvaluation: "",
  activitiesNextShift: "",
  signerName: "",
  signatureObjectKey: "",
  signedDate: new Date().toISOString().slice(0, 10),
  status: "DRAFT",
  manpower: [{ name: "", qualification: "", workingHours: "", remarks: "", extraJob: "" }],
  equipment: [{ name: "", quantity: "" }],
  photoKeys: [],
};

function fileUrl(key: string) {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function uploadFile(file: File, folder: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Sesi berakhir. Login ulang lewat URL tunnel.");
    throw new Error("Upload gagal");
  }
  const data = await res.json();
  return data.key as string;
}

async function deleteUploadedFile(key: string) {
  await fetch("/api/uploads", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ key }),
  });
}

function buildSavePayload(form: ReportFormState) {
  return {
    ...form,
    companyLogoKey: form.companyLogoKey || null,
    clientLogoKey: form.clientLogoKey || null,
    clientId: form.clientId || null,
    signatureObjectKey: form.signatureObjectKey || null,
    // Drop blank placeholder rows so Zod does not reject drafts / tunnel saves
    manpower: form.manpower.filter((m) => m.name.trim()),
    equipment: form.equipment.filter((e) => e.name.trim()),
  };
}

function formatSaveError(status: number, data: unknown): string {
  if (status === 401) {
    return "Sesi berakhir. Login ulang lewat URL tunnel, lalu simpan lagi.";
  }
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
    if (err && typeof err === "object" && "fieldErrors" in err) {
      const fields = (err as { fieldErrors: Record<string, string[]> }).fieldErrors;
      const first = Object.entries(fields).find(([, msgs]) => msgs?.length);
      if (first) return `${first[0]}: ${first[1][0]}`;
    }
  }
  return "Gagal menyimpan. Periksa field wajib.";
}

export function ReportForm({
  reportId,
  initial,
}: {
  reportId?: string;
  initial?: Partial<ReportFormState>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ReportFormState>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string; logoObjectKey: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => undefined);
  }, []);

  const payload = useMemo(() => buildSavePayload(form), [form]);

  const save = useCallback(
    async (silent = false) => {
      setSaving(true);
      if (!silent) setMessage("");
      try {
        const res = await fetch(reportId ? `/api/reports/${reportId}` : "/api/reports", {
          method: reportId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(formatSaveError(res.status, data));
        if (!reportId && data.report?.id) {
          router.replace(`/reports/${data.report.id}`);
        }
        if (!silent) setMessage("Tersimpan");
      } catch (err) {
        if (!silent) {
          setMessage(err instanceof Error ? err.message : "Gagal menyimpan");
        }
      } finally {
        setSaving(false);
      }
    },
    [payload, reportId, router],
  );

  useEffect(() => {
    if (!reportId) return;
    const t = setTimeout(() => {
      void save(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [payload, reportId, save]);

  function update<K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function removePhoto(key: string) {
    setForm((f) => ({ ...f, photoKeys: f.photoKeys.filter((k) => k !== key) }));
    try {
      await deleteUploadedFile(key);
    } catch {
      // UI already removed; storage cleanup is best-effort
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            {reportId ? "Edit Daily Report" : "Daily Report Baru"}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {saving ? "Menyimpan..." : message || "Autosave aktif setelah report tersimpan."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" type="button" onClick={() => save(false)}>
            Simpan
          </button>
          {reportId && (
            <>
              <a className="btn btn-ghost" href={`/api/reports/${reportId}/export?format=pdf`}>
                PDF
              </a>
              <a className="btn btn-ghost" href={`/api/reports/${reportId}/export?format=docx`}>
                DOCX
              </a>
              <a className="btn btn-ghost" target="_blank" href={`/api/reports/${reportId}/export?format=html`}>
                Preview
              </a>
            </>
          )}
        </div>
      </div>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="field">
          <label className="label">Project No *</label>
          <input className="input" value={form.projectNo} onChange={(e) => update("projectNo", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Daily Report No *</label>
          <input className="input" value={form.reportNo} onChange={(e) => update("reportNo", e.target.value)} />
        </div>
        <div className="field md:col-span-2">
          <label className="label">Project Name *</label>
          <input className="input" value={form.projectName} onChange={(e) => update("projectName", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Tanggal *</label>
          <input className="input" type="date" value={form.reportDate} onChange={(e) => update("reportDate", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Week No</label>
          <input className="input" value={form.weekNo} onChange={(e) => update("weekNo", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Nama Perusahaan *</label>
          <input className="input" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Logo Perusahaan</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const key = await uploadFile(file, "logos");
              update("companyLogoKey", key);
            }}
          />
          {form.companyLogoKey && <span className="text-xs text-[var(--muted)]">{form.companyLogoKey}</span>}
        </div>
        <div className="field">
          <label className="label">Client tersimpan</label>
          <select
            className="select"
            value={form.clientId}
            onChange={(e) => {
              const c = clients.find((x) => x.id === e.target.value);
              update("clientId", e.target.value);
              if (c) {
                update("clientName", c.name);
                update("clientLogoKey", c.logoObjectKey || "");
              }
            }}
          >
            <option value="">— pilih —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Nama Client *</label>
          <input className="input" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} />
        </div>
        <div className="field md:col-span-2">
          <label className="label">Logo Client</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const key = await uploadFile(file, "logos");
              update("clientLogoKey", key);
            }}
          />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Manpower</h2>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              update("manpower", [
                ...form.manpower,
                { name: "", qualification: "", workingHours: "", remarks: "", extraJob: "" },
              ])
            }
          >
            + Baris
          </button>
        </div>
        {form.manpower.map((row, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-5">
            <input className="input" placeholder="Nama" value={row.name} onChange={(e) => {
              const next = [...form.manpower];
              next[idx] = { ...row, name: e.target.value };
              update("manpower", next);
            }} />
            <input className="input" placeholder="Qualification" value={row.qualification} onChange={(e) => {
              const next = [...form.manpower];
              next[idx] = { ...row, qualification: e.target.value };
              update("manpower", next);
            }} />
            <input className="input" placeholder="Hours" value={row.workingHours} onChange={(e) => {
              const next = [...form.manpower];
              next[idx] = { ...row, workingHours: e.target.value };
              update("manpower", next);
            }} />
            <input className="input" placeholder="Remarks" value={row.remarks || ""} onChange={(e) => {
              const next = [...form.manpower];
              next[idx] = { ...row, remarks: e.target.value };
              update("manpower", next);
            }} />
            <input className="input" placeholder="Extra job" value={row.extraJob || ""} onChange={(e) => {
              const next = [...form.manpower];
              next[idx] = { ...row, extraJob: e.target.value };
              update("manpower", next);
            }} />
          </div>
        ))}
        <p className="text-sm text-[var(--muted)]">Total Manpower: {form.manpower.filter((m) => m.name).length}</p>
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Main Equipment</h2>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => update("equipment", [...form.equipment, { name: "", quantity: "" }])}
          >
            + Baris
          </button>
        </div>
        {form.equipment.map((row, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-2">
            <input className="input" placeholder="Equipment" value={row.name} onChange={(e) => {
              const next = [...form.equipment];
              next[idx] = { ...row, name: e.target.value };
              update("equipment", next);
            }} />
            <input className="input" placeholder="Qty" value={row.quantity} onChange={(e) => {
              const next = [...form.equipment];
              next[idx] = { ...row, quantity: e.target.value };
              update("equipment", next);
            }} />
          </div>
        ))}
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="field">
          <label className="label">Arrival</label>
          <input className="input" value={form.arrivalTime} onChange={(e) => update("arrivalTime", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Leave site</label>
          <input className="input" value={form.leaveTime} onChange={(e) => update("leaveTime", e.target.value)} />
        </div>
        <div className="field md:col-span-2">
          <label className="label">Work Description</label>
          <textarea className="textarea" rows={2} value={form.workDescription} onChange={(e) => update("workDescription", e.target.value)} />
        </div>
        <NumberedListField
          label="Activities done this day"
          required
          value={form.activitiesDone}
          onChange={(v) => update("activitiesDone", v)}
        />
        <div className="field">
          <label className="label">Note</label>
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Work Evaluation</label>
          <textarea className="textarea" rows={2} value={form.workEvaluation} onChange={(e) => update("workEvaluation", e.target.value)} />
        </div>
        <NumberedListField
          label="Activities planned for next Shift"
          value={form.activitiesNextShift}
          onChange={(v) => update("activitiesNextShift", v)}
        />
        <div className="field md:col-span-2">
          <label className="label">Documentation (multi foto)</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const input = e.target;
              const files = Array.from(input.files || []);
              if (!files.length) return;
              try {
                const keys: string[] = [];
                for (const file of files) keys.push(await uploadFile(file, "docs"));
                setForm((f) => ({ ...f, photoKeys: [...f.photoKeys, ...keys] }));
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Upload gagal");
              } finally {
                input.value = "";
              }
            }}
          />
          {form.photoKeys.length > 0 ? (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {form.photoKeys.map((key) => (
                <li key={key} className="relative overflow-hidden rounded border border-black/10 bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fileUrl(key)} alt="" className="aspect-square w-full object-cover" />
                  <button
                    className="absolute right-1 top-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white hover:bg-black"
                    type="button"
                    onClick={() => void removePhoto(key)}
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted)]">Belum ada foto</p>
          )}
        </div>
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="field">
          <label className="label">Penanda tangan (perusahaan) *</label>
          <input className="input" value={form.signerName} onChange={(e) => update("signerName", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Tanggal tanda tangan *</label>
          <input className="input" type="date" value={form.signedDate} onChange={(e) => update("signedDate", e.target.value)} />
        </div>
        <div className="field md:col-span-2">
          <label className="label">Softfile tanda tangan *</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const key = await uploadFile(file, "signatures");
              update("signatureObjectKey", key);
            }}
          />
        </div>
      </section>
    </div>
  );
}
