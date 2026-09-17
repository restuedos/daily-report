"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  type: "DAILY_REPORT" | "DELIVERY_NOTE";
  html: string;
  css: string;
  isActive: boolean;
  version: number;
  placeholders?: string[] | unknown;
};

function asPlaceholderList(value: unknown, fallback: string[]) {
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  return fallback;
}

function wrapPreviewDocument(bodyHtml: string, css: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
html, body { margin: 0; padding: 12px; min-height: 100%; cursor: text; }
body { outline: none; }
.ph {
  display: inline-block;
  background: #e6f4f1;
  color: #0f6b5c;
  border: 1px dashed #0f6b5c;
  border-radius: 4px;
  padding: 0 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  white-space: nowrap;
}
${css}
</style>
</head>
<body contenteditable="true" spellcheck="false">${bodyHtml}</body>
</html>`;
}

/** Convert raw {{tokens}} in HTML into visual chips for editing. */
function decoratePlaceholders(html: string) {
  return html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, expr: string) => {
    const safe = String(expr)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return `<span class="ph" data-ph="${safe}" contenteditable="false">{{${safe}}}</span>`;
  });
}

/** Convert visual chips back to {{tokens}}; keep other HTML intact. */
function undecoratePlaceholders(html: string) {
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  doc.querySelectorAll("[data-ph]").forEach((el) => {
    const token = el.getAttribute("data-ph") || "";
    el.replaceWith(doc.createTextNode(`{{${token}}}`));
  });
  return doc.getElementById("root")?.innerHTML ?? html;
}

export function TemplateEditor({ id }: { id: string }) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const syncingRef = useRef(false);
  const selectionRef = useRef<Range | null>(null);

  const [template, setTemplate] = useState<Template | null>(null);
  const [defaults, setDefaults] = useState<string[]>([]);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setTemplate(d.template);
        setHtml(d.template.html);
        setCss(d.template.css);
        setName(d.template.name);
        const fallback = d.defaults || d.placeholders || [];
        setDefaults(fallback);
        setPlaceholders(asPlaceholderList(d.template.placeholders, fallback));
        setPreviewTick((n) => n + 1);
      });
  }, [id]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return placeholders;
    return placeholders.filter((p) => p.toLowerCase().includes(q));
  }, [filter, placeholders]);

  const pullHtmlFromPreview = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    const raw = undecoratePlaceholders(doc.body.innerHTML);
    setHtml(raw);
  }, []);

  const rememberSelection = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    const sel = doc?.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const insertPlaceholderInPreview = useCallback(
    (key: string) => {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      const win = iframe?.contentWindow;
      if (!doc?.body || !win) {
        setMessage("Preview belum siap");
        return;
      }

      doc.body.focus();
      const sel = doc.getSelection();
      let range = selectionRef.current;

      if (sel && sel.rangeCount > 0 && doc.body.contains(sel.anchorNode)) {
        range = sel.getRangeAt(0);
      } else if (range && doc.body.contains(range.commonAncestorContainer)) {
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        range = doc.createRange();
        range.selectNodeContents(doc.body);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }

      if (!range || !sel) return;

      const chip = doc.createElement("span");
      chip.className = "ph";
      chip.setAttribute("data-ph", key);
      chip.setAttribute("contenteditable", "false");
      chip.textContent = `{{${key}}}`;

      range.deleteContents();
      range.insertNode(chip);

      const after = doc.createRange();
      after.setStartAfter(chip);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
      selectionRef.current = after.cloneRange();

      pullHtmlFromPreview();
      setMessage(`Placeholder {{${key}}} disisipkan di preview`);
    },
    [pullHtmlFromPreview],
  );

  function addAndInsertPlaceholder() {
    const expr = newPlaceholder.trim().replace(/^\{\{|\}\}$/g, "").trim();
    if (!expr) {
      setMessage("Nama placeholder tidak valid");
      return;
    }
    const simpleKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr) ? expr : null;
    if (simpleKey && !placeholders.includes(simpleKey)) {
      setPlaceholders((prev) => [...prev, simpleKey].sort((a, b) => a.localeCompare(b)));
    }
    insertPlaceholderInPreview(expr);
    setNewPlaceholder("");
  }

  function removePlaceholder(key: string) {
    if (defaults.includes(key)) {
      setMessage("Placeholder bawaan tidak bisa dihapus dari daftar");
      return;
    }
    setPlaceholders((prev) => prev.filter((p) => p !== key));
  }

  async function save(activate = false) {
    pullHtmlFromPreview();
    // ensure latest html from iframe right before save
    const doc = iframeRef.current?.contentDocument;
    const latestHtml = doc?.body ? undecoratePlaceholders(doc.body.innerHTML) : html;

    const res = await fetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        html: latestHtml,
        css,
        placeholders,
        isActive: activate || template?.isActive,
      }),
    });
    if (!res.ok) {
      setMessage("Gagal menyimpan");
      return;
    }
    const data = await res.json();
    setTemplate(data.template);
    setHtml(data.template.html);
    setPlaceholders(asPlaceholderList(data.template.placeholders, placeholders));
    setMessage(activate ? "Disimpan & diaktifkan" : "Tersimpan");
    setPreviewTick((n) => n + 1);
    router.refresh();
  }

  function reloadPreviewFromSource() {
    setPreviewTick((n) => n + 1);
    setMessage("Preview di-refresh dari sumber HTML");
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !template) return;

    syncingRef.current = true;
    const docHtml = wrapPreviewDocument(decoratePlaceholders(html), css);
    iframe.srcdoc = docHtml;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;

      const onSel = () => rememberSelection();
      const onInput = () => {
        if (syncingRef.current) return;
        pullHtmlFromPreview();
      };

      doc.addEventListener("mouseup", onSel);
      doc.addEventListener("keyup", onSel);
      doc.addEventListener("input", onInput);
      doc.body.addEventListener("blur", onSel);

      // allow first paint then accept edits
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
    // intentionally only re-mount when tick/css changes; html edits live in iframe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewTick, css, template]);

  if (!template) return <p>Memuat template...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/templates" className="text-sm text-[var(--accent)]">
            ← Templates
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">{template.type}</h1>
          <p className="text-sm text-[var(--muted)]">
            v{template.version} {template.isActive ? "· aktif" : ""}
            {message ? ` · ${message}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" type="button" onClick={reloadPreviewFromSource}>
            Refresh preview
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setShowSource((v) => !v)}>
            {showSource ? "Sembunyikan sumber" : "Sumber HTML"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => save(false)}>
            Simpan
          </button>
          <button className="btn btn-primary" type="button" onClick={() => save(true)}>
            Simpan & Aktifkan
          </button>
        </div>
      </div>

      <div className="field">
        <label className="label">Nama template</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <div className="card overflow-hidden">
            <div className="border-b border-[var(--line)] px-4 py-2 text-sm">
              <strong>Preview (bisa diedit)</strong>
              <span className="text-[var(--muted)]">
                {" "}
                — klik di preview, lalu pilih placeholder di kanan untuk menyisipkan
              </span>
            </div>
            <iframe
              ref={iframeRef}
              title="template-preview-editor"
              className="h-[75vh] w-full bg-white"
            />
          </div>

          {showSource && (
            <div className="space-y-3">
              <div className="field">
                <label className="label">Sumber HTML (lanjutan)</label>
                <textarea
                  className="textarea font-mono text-xs"
                  rows={12}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  onBlur={reloadPreviewFromSource}
                />
              </div>
              <div className="field">
                <label className="label">CSS</label>
                <textarea
                  className="textarea font-mono text-xs"
                  rows={8}
                  value={css}
                  onChange={(e) => setCss(e.target.value)}
                  onBlur={reloadPreviewFromSource}
                />
              </div>
            </div>
          )}
        </div>

        <aside className="card h-fit space-y-3 p-4">
          <div>
            <h2 className="font-semibold">Sisipkan placeholder</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Klik di preview dulu (letakkan kursor), lalu klik item di bawah.
            </p>
          </div>

          <input
            className="input"
            placeholder="Cari..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          <div className="flex gap-2">
            <input
              className="input"
              placeholder="contoh: poNumber atau #each items"
              value={newPlaceholder}
              onChange={(e) => setNewPlaceholder(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAndInsertPlaceholder();
                }
              }}
            />
            <button className="btn btn-primary" type="button" onClick={addAndInsertPlaceholder}>
              Sisip
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { label: "#if", value: "#if field" },
              { label: "/if", value: "/if" },
              { label: "#each", value: "#each items" },
              { label: "/each", value: "/each" },
              { label: "inc", value: "inc @index" },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem" }}
                onClick={() => insertPlaceholderInPreview(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="max-h-[32rem] space-y-1 overflow-y-auto pr-1">
            {filtered.map((p) => {
              const isDefault = defaults.includes(p);
              return (
                <div key={p} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1 justify-start"
                    style={{ padding: "0.45rem 0.65rem", fontSize: "0.8rem" }}
                    onClick={() => insertPlaceholderInPreview(p)}
                  >
                    <code>{`{{${p}}}`}</code>
                  </button>
                  {!isDefault && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: "0.35rem 0.55rem", fontSize: "0.75rem" }}
                      onClick={() => removePlaceholder(p)}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
