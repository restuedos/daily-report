"use client";

import { useEffect, useState } from "react";

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

/** Numbered-list editor; persists plain text as `1. …\\n2. …` for PDF/DOCX. */
export function NumberedListField({ label, value, onChange, required }: Props) {
  const [items, setItems] = useState<string[]>(() => stripNumbers(value));

  useEffect(() => {
    setItems(stripNumbers(value));
  }, [value]);

  const commit = (next: string[]) => {
    const normalized = next.length ? next : [""];
    setItems(normalized);
    onChange(toNumbered(normalized));
  };

  return (
    <div className="field md:col-span-2">
      <label className="label">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="space-y-2 rounded-md border border-[var(--line)] bg-white p-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2 w-6 shrink-0 text-right text-sm text-[var(--muted)]">
              {index + 1}.
            </span>
            <input
              className="input flex-1"
              value={item}
              placeholder="Isi kegiatan…"
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                commit(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const next = [...items];
                  next.splice(index + 1, 0, "");
                  commit(next);
                }
              }}
            />
            <button
              type="button"
              className="mt-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              onClick={() => {
                if (items.length <= 1) commit([""]);
                else commit(items.filter((_, i) => i !== index));
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
          onClick={() => commit([...items, ""])}
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
