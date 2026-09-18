"use client";

import { useEffect, useId, useRef, useState } from "react";

function stripNumbers(value: string): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [""];
  const byNl = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lines =
    byNl.length > 1
      ? byNl
      : raw
          .split(/(?=\d+\.\s+)/)
          .map((s) => s.trim())
          .filter(Boolean);
  const items = (lines.length ? lines : [raw]).map((l) =>
    l.replace(/^\d+\.\s*/, "").trim(),
  );
  return items.length ? items : [""];
}

function toNumbered(items: string[]): string {
  return items
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");
}

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

type Row = { id: string; text: string };

let rowSeq = 0;
function newRowId(prefix: string) {
  rowSeq += 1;
  return `${prefix}-${rowSeq}-${Date.now()}`;
}

function toRows(value: string, prefix: string): Row[] {
  return stripNumbers(value).map((text) => ({
    id: newRowId(prefix),
    text,
  }));
}

/** Numbered-list editor; persists plain text as `1. …\\n2. …` for PDF/DOCX. */
export function NumberedListField({ label, value, onChange, required }: Props) {
  const uid = useId();
  const [rows, setRows] = useState<Row[]>(() => toRows(value, uid));
  const focusIndexRef = useRef<number | null>(null);

  // Sync from parent only when serialized content actually differs (keep draft empty rows).
  useEffect(() => {
    const incoming = toNumbered(stripNumbers(value));
    const current = toNumbered(rows.map((r) => r.text));
    if (incoming !== current) {
      setRows(toRows(value, uid));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compare serialized text only
  }, [value]);

  useEffect(() => {
    const idx = focusIndexRef.current;
    if (idx == null) return;
    focusIndexRef.current = null;
    const el = document.getElementById(`${uid}-row-${idx}`) as HTMLInputElement | null;
    el?.focus();
  }, [rows, uid]);

  const commit = (next: Row[]) => {
    const normalized = next.length ? next : [{ id: newRowId(uid), text: "" }];
    setRows(normalized);
    onChange(toNumbered(normalized.map((r) => r.text)));
  };

  const addAfter = (index: number) => {
    const next = [...rows];
    next.splice(index + 1, 0, { id: newRowId(uid), text: "" });
    focusIndexRef.current = index + 1;
    commit(next);
  };

  return (
    <div className="field md:col-span-2">
      <label className="label">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="space-y-2 rounded-md border border-[var(--line)] bg-white p-3">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-start gap-2">
            <span className="mt-2 w-6 shrink-0 text-right text-sm text-[var(--muted)]">
              {index + 1}.
            </span>
            <input
              id={`${uid}-row-${index}`}
              className="input flex-1"
              value={row.text}
              placeholder="Isi kegiatan…"
              autoComplete="off"
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, text: e.target.value };
                commit(next);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                // Prevent accidental form submit / page navigation; still add a row.
                e.preventDefault();
                addAfter(index);
              }}
            />
            <button
              type="button"
              className="mt-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              onClick={() => {
                if (rows.length <= 1) commit([{ id: newRowId(uid), text: "" }]);
                else commit(rows.filter((_, i) => i !== index));
              }}
              aria-label="Hapus baris"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-[var(--accent)] hover:underline"
          onClick={() => {
            focusIndexRef.current = rows.length;
            commit([...rows, { id: newRowId(uid), text: "" }]);
          }}
        >
          + Tambah poin
        </button>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Enter = baris baru. Tersimpan sebagai daftar bernomor (1. 2. 3. …).
      </p>
    </div>
  );
}
