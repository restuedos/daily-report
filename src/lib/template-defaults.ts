/**
 * Daily report layout locked to docs/59. Daily Report 18 Agustus 2026.docx
 * 9-column grid, logo/party rowspans, fixed empty manpower/equipment rows.
 */
export const DAILY_REPORT_PLACEHOLDERS = [
  "projectNo",
  "projectName",
  "reportNo",
  "weekNo",
  "reportDate",
  "companyName",
  "clientName",
  "companyLogoUrl",
  "clientLogoUrl",
  "arrivalTime",
  "leaveTime",
  "workDescription",
  "activitiesDone",
  "notes",
  "workEvaluation",
  "activitiesNextShift",
  "manpower",
  "totalManpower",
  "equipment",
  "photos",
  "signerName",
  "signatureUrl",
  "signedDate",
];

export const DELIVERY_NOTE_PLACEHOLDERS = [
  "noteNumber",
  "noteDate",
  "senderName",
  "receiverName",
  "driverName",
  "vehicleInfo",
  "items",
  "notes",
  "signerName",
  "signatureUrl",
];

/** Sample sheet uses 7 manpower body rows and 11 equipment body rows. */
export const MANPOWER_ROW_COUNT = 7;
export const EQUIPMENT_ROW_COUNT = 11;

export const DAILY_REPORT_HTML = `
<div class="sheet">
  <table class="main">
    <colgroup>
      <col class="c0" /><col class="c1" /><col class="c2" /><col class="c3" /><col class="c4" />
      <col class="c5" /><col class="c6" /><col class="c7" /><col class="c8" />
    </colgroup>

    <!-- Header logos + project (logos rowspan 2) -->
    <tr class="r-logo">
      <td class="logo" colspan="2" rowspan="2">
        {{#if clientLogoUrl}}<img src="{{clientLogoUrl}}" alt="" />{{else}}&nbsp;{{/if}}
      </td>
      <td class="project-no" colspan="6">PROJECT NO: {{projectNo}}</td>
      <td class="logo" colspan="1" rowspan="2">
        {{#if companyLogoUrl}}<img src="{{companyLogoUrl}}" alt="" />{{else}}&nbsp;{{/if}}
      </td>
    </tr>
    <tr class="r-project">
      <td class="project-name" colspan="6">
        <div>PROJECT:</div>
        <div class="project-title">{{projectName}}</div>
      </td>
    </tr>

    <!-- Parties + meta (parties rowspan 2) -->
    <tr class="r-meta">
      <td class="party" colspan="2" rowspan="2">{{clientName}}</td>
      <td class="meta" colspan="3">Date: {{reportDate}}</td>
      <td class="meta" colspan="3">DAILY REPORT No: {{reportNo}}</td>
      <td class="party" colspan="1" rowspan="2">{{companyName}}</td>
    </tr>
    <tr class="r-week">
      <td class="meta" colspan="3">&nbsp;</td>
      <td class="meta center" colspan="3">WEEK No: {{weekNo}}</td>
    </tr>

    <!-- Manpower -->
    <tr class="head">
      <td class="center">No.</td>
      <td class="center" colspan="2">NAME</td>
      <td class="center" colspan="2">QUALIFICATION</td>
      <td class="center" colspan="2">Working hours</td>
      <td class="center">Remarks</td>
      <td class="center">Extra job</td>
    </tr>
    {{#each manpower}}
    <tr class="data">
      <td class="center">{{#if name}}{{inc @index}}.{{else}}&nbsp;{{/if}}</td>
      <td colspan="2">{{name}}</td>
      <td colspan="2">{{qualification}}</td>
      <td class="center" colspan="2">{{workingHours}}</td>
      <td>{{remarks}}</td>
      <td>{{extraJob}}</td>
    </tr>
    {{/each}}
    <tr class="total-row">
      <td class="total center" colspan="7">Total Manpower: {{totalManpower}}</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>

    <!-- Equipment -->
    <tr class="head">
      <td class="center">No.</td>
      <td colspan="4">MAIN EQUIPMENT</td>
      <td class="center" colspan="2">Quantity</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
    {{#each equipment}}
    <tr class="data">
      <td class="center">{{#if name}}{{inc @index}}.{{else}}&nbsp;{{/if}}</td>
      <td colspan="4">{{name}}</td>
      <td class="center" colspan="2">{{quantity}}</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
    {{/each}}

    <tr><td class="section" colspan="9">Work Description:</td></tr>
    <tr><td class="body" colspan="9">{{workDescription}}</td></tr>
    <tr><td class="time-line" colspan="9">{{arrivalTime}}: Arrival to the site</td></tr>
    <tr><td class="section" colspan="9">Activities done this day:</td></tr>
    <tr class="r-activities">
      <td class="activity" colspan="4">
        <div class="pre">{{activitiesDone}}</div>
        <div class="note-line">Note: {{notes}}</div>
        <div class="note-line">Work Evaluation: {{workEvaluation}}</div>
      </td>
      <td class="docs" colspan="5">
        <div class="docs-label">Documentation:</div>
        <div class="photos">
          {{#each photos}}
          <img src="{{url}}" alt="" />
          {{/each}}
        </div>
      </td>
    </tr>
    <tr><td class="section" colspan="9">Activities planned for next Shift:</td></tr>
    <tr class="r-next"><td class="body" colspan="9">{{activitiesNextShift}}</td></tr>
    <tr><td class="time-line" colspan="9">{{leaveTime}}: Leave site</td></tr>

    <tr class="r-sign-head">
      <td class="party" colspan="6">{{companyName}}</td>
      <td class="party" colspan="3">{{clientName}}</td>
    </tr>
    <tr class="r-sign-pad">
      <td class="sign-box" colspan="6">
        {{#if signatureUrl}}<img class="sig" src="{{signatureUrl}}" alt="" />{{else}}&nbsp;{{/if}}
      </td>
      <td class="sign-box" colspan="3">&nbsp;</td>
    </tr>
    <tr class="r-sign-meta">
      <td class="sign-meta" colspan="6">
        Signature: {{signerName}}{{#if signedDate}} : {{signedDate}}{{/if}}
      </td>
      <td class="sign-meta client-meta" colspan="3">
        <span class="sig-field">Signature: <span class="uline"></span></span>
        <span class="sig-field">Date: <span class="uline"></span></span>
      </td>
    </tr>
  </table>
</div>
`.trim();

/** Letter page + sample-like margins (twips≈: top540 right360 bottom280 left360). */
export const DAILY_REPORT_CSS = `
@page {
  size: letter portrait;
  margin: 9.5mm 6.35mm 4.9mm 6.35mm;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  line-height: 1.25;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page-pad {
  width: 100%;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 9.5mm 6.35mm 4.9mm 6.35mm;
  background: #fff;
}

.sheet { width: 100%; }

table.main {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #000;
}

table.main td {
  border: 1px solid #000;
  padding: 2px 4px;
  vertical-align: middle;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Sample grid proportions (sum 11203) */
col.c0 { width: 10.07%; }
col.c1 { width: 12.73%; }
col.c2 { width: 7.36%; }
col.c3 { width: 9.09%; }
col.c4 { width: 10.20%; }
col.c5 { width: 1.54%; }
col.c6 { width: 13.55%; }
col.c7 { width: 15.22%; }
col.c8 { width: 20.24%; }

.logo {
  text-align: center;
  padding: 4px !important;
}
.logo img {
  display: block;
  margin: 0 auto;
  max-width: 72px;
  max-height: 48px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.project-no {
  text-align: center;
  font-weight: 700;
  font-size: 10pt;
  padding: 4px 6px !important;
}

.project-name {
  text-align: center;
  font-weight: 700;
  font-size: 10pt;
  padding: 4px 6px !important;
  line-height: 1.3;
}
.project-title { margin-top: 2px; font-size: 11pt; }

.party {
  text-align: center;
  font-weight: 700;
  font-size: 9pt;
  text-transform: uppercase;
  padding: 4px !important;
}

.meta {
  text-align: center;
  font-weight: 700;
  font-size: 9pt;
}

.center { text-align: center; }

.head td {
  font-weight: 700;
  font-size: 9pt;
  text-align: center;
  height: 18px;
}

.data td { height: 17px; font-size: 9pt; }

.total {
  font-weight: 700;
  text-align: center;
}

.section {
  font-weight: 700;
  height: 17px;
}

.body {
  white-space: pre-wrap;
  vertical-align: top !important;
  min-height: 14px;
}

.time-line { font-weight: 700; height: 17px; }

.r-activities td { height: 210px; vertical-align: top !important; }

.activity {
  vertical-align: top !important;
  padding: 4px 6px !important;
}
.pre { white-space: pre-wrap; min-height: 4.5em; }
.note-line { margin-top: 10px; font-weight: 700; }

.docs {
  vertical-align: top !important;
  padding: 4px 6px !important;
}
.docs-label { font-weight: 700; margin-bottom: 4px; }

.photos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-content: flex-start;
}
.photos img {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border: 1px solid #444;
}

.r-next td { height: 48px; vertical-align: top !important; }

.r-sign-head td { height: 28px; }

.r-sign-pad td.sign-box {
  height: 64px;
  vertical-align: middle !important;
  text-align: center;
  padding: 6px !important;
}

.sig {
  display: inline-block;
  max-height: 48px;
  max-width: 140px;
  margin: 0 auto;
  object-fit: contain;
}

.r-sign-meta td.sign-meta {
  height: 28px;
  vertical-align: middle !important;
  text-align: left;
  padding: 4px 6px !important;
  font-size: 9pt;
}

.client-meta {
  white-space: normal;
}

.sig-field {
  display: inline-block;
  margin-right: 10px;
  white-space: nowrap;
}

.uline {
  display: inline-block;
  width: 5.5em;
  border-bottom: 1px solid #000;
  vertical-align: baseline;
  height: 0.85em;
  margin-left: 2px;
}

@media print {
  .page-pad { padding: 0; max-width: none; }
  table.main { page-break-inside: avoid; }
}
`.trim();

export const DELIVERY_NOTE_HTML = `
<div class="sheet">
  <h1>SURAT JALAN</h1>
  <table class="meta" width="100%" cellspacing="0" cellpadding="6" border="1">
    <tr><td>No</td><td>{{noteNumber}}</td><td>Tanggal</td><td>{{noteDate}}</td></tr>
    <tr><td>Pengirim</td><td colspan="3">{{senderName}}</td></tr>
    <tr><td>Penerima</td><td colspan="3">{{receiverName}}</td></tr>
    <tr><td>Pengemudi</td><td>{{driverName}}</td><td>Kendaraan</td><td>{{vehicleInfo}}</td></tr>
  </table>
  <table class="items" width="100%" cellspacing="0" cellpadding="6" border="1">
    <thead>
      <tr><th>No</th><th>Nama Barang</th><th>Qty</th><th>Satuan</th><th>Keterangan</th></tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{inc @index}}</td>
        <td>{{name}}</td>
        <td>{{qty}}</td>
        <td>{{unit}}</td>
        <td>{{note}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{#if notes}}<p><strong>Catatan:</strong> {{notes}}</p>{{/if}}
  <div class="sign-block">
    {{#if signatureUrl}}<img src="{{signatureUrl}}" width="120" height="60" alt="ttd" />{{/if}}
    <div>{{signerName}}</div>
  </div>
</div>
`.trim();

export const DELIVERY_NOTE_CSS = `
body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; }
h1 { text-align: center; margin: 0 0 16px; font-size: 20px; letter-spacing: 1px; }
table.meta, table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
table.meta td, table.items th, table.items td { border: 1px solid #333; padding: 6px 8px; }
table.items th { background: #f2f2f2; }
.sign-block { margin-top: 40px; text-align: right; }
.sign-block img { max-height: 70px; display: block; margin-left: auto; }
`.trim();
