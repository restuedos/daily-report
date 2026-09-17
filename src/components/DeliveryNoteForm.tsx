"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { name: string; qty: string; unit: string; note: string };

type FormState = {
  noteNumber: string;
  noteDate: string;
  senderName: string;
  receiverName: string;
  driverName: string;
  vehicleInfo: string;
  notes: string;
  signerName: string;
  signatureKey: string;
  items: Item[];
};

const empty: FormState = {
  noteNumber: "",
  noteDate: new Date().toISOString().slice(0, 10),
  senderName: "",
  receiverName: "",
  driverName: "",
  vehicleInfo: "",
  notes: "",
  signerName: "",
  signatureKey: "",
  items: [{ name: "", qty: "1", unit: "", note: "" }],
};

export function DeliveryNoteForm({
  noteId,
  initial,
}: {
  noteId?: string;
  initial?: Partial<FormState>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...empty, ...initial });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!noteId) return;
    const t = setTimeout(() => {
      void save(true);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, noteId]);

  async function save(silent = false) {
    const res = await fetch(noteId ? `/api/delivery-notes/${noteId}` : "/api/delivery-notes", {
      method: noteId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      if (!silent) setMessage("Gagal menyimpan");
      return;
    }
    if (!noteId && data.note?.id) router.replace(`/delivery-notes/${data.note.id}`);
    if (!silent) setMessage("Tersimpan");
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            {noteId ? "Edit Surat Jalan" : "Surat Jalan Baru"}
          </h1>
          <p className="text-sm text-[var(--muted)]">{message}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" type="button" onClick={() => save(false)}>
            Simpan
          </button>
          {noteId && (
            <>
              <a className="btn btn-ghost" href={`/api/delivery-notes/${noteId}/export?format=pdf`}>
                PDF
              </a>
              <a className="btn btn-ghost" href={`/api/delivery-notes/${noteId}/export?format=docx`}>
                DOCX
              </a>
            </>
          )}
        </div>
      </div>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="field">
          <label className="label">Nomor *</label>
          <input className="input" value={form.noteNumber} onChange={(e) => update("noteNumber", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Tanggal *</label>
          <input className="input" type="date" value={form.noteDate} onChange={(e) => update("noteDate", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Pengirim *</label>
          <input className="input" value={form.senderName} onChange={(e) => update("senderName", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Penerima *</label>
          <input className="input" value={form.receiverName} onChange={(e) => update("receiverName", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Pengemudi</label>
          <input className="input" value={form.driverName} onChange={(e) => update("driverName", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Kendaraan</label>
          <input className="input" value={form.vehicleInfo} onChange={(e) => update("vehicleInfo", e.target.value)} />
        </div>
        <div className="field md:col-span-2">
          <label className="label">Catatan</label>
          <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Barang</h2>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => update("items", [...form.items, { name: "", qty: "1", unit: "", note: "" }])}
          >
            + Item
          </button>
        </div>
        {form.items.map((item, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-4">
            <input className="input" placeholder="Nama" value={item.name} onChange={(e) => {
              const next = [...form.items];
              next[idx] = { ...item, name: e.target.value };
              update("items", next);
            }} />
            <input className="input" placeholder="Qty" value={item.qty} onChange={(e) => {
              const next = [...form.items];
              next[idx] = { ...item, qty: e.target.value };
              update("items", next);
            }} />
            <input className="input" placeholder="Satuan" value={item.unit} onChange={(e) => {
              const next = [...form.items];
              next[idx] = { ...item, unit: e.target.value };
              update("items", next);
            }} />
            <input className="input" placeholder="Keterangan" value={item.note} onChange={(e) => {
              const next = [...form.items];
              next[idx] = { ...item, note: e.target.value };
              update("items", next);
            }} />
          </div>
        ))}
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="field">
          <label className="label">Penanda tangan</label>
          <input className="input" value={form.signerName} onChange={(e) => update("signerName", e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Tanda tangan (gambar)</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              fd.append("folder", "signatures");
              const res = await fetch("/api/uploads", { method: "POST", body: fd });
              const data = await res.json();
              if (res.ok) update("signatureKey", data.key);
            }}
          />
        </div>
      </section>
    </div>
  );
}
