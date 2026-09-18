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
      <td colspan="2" class="pad-l">{{name}}</td>
      <td colspan="2" class="pad-l">{{qualification}}</td>
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
      <td colspan="4" class="pad-l">{{name}}</td>
      <td class="center" colspan="2">{{quantity}}</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
    {{/each}}

    <tr>
      <td class="section work-desc-row" colspan="9">
        <span class="section-label">Work Description:</span>
        <span class="work-desc-inline">{{workDescription}}</span>
      </td>
    </tr>
    <tr><td class="time-line" colspan="9">{{arrivalTime}}: Arrival to the site</td></tr>
    <tr><td class="section" colspan="9">Activities done this day:</td></tr>
    <tr class="r-activities">
      <td class="activity" colspan="4">
        <ol class="activity-ol">
          {{#each activitiesDoneItems}}
          <li>{{this}}</li>
          {{/each}}
        </ol>
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
    <tr class="r-next">
      <td class="next-shift" colspan="9">
        <ol class="activity-ol next-ol">
          {{#each activitiesNextShiftItems}}
          <li>{{this}}</li>
          {{/each}}
        </ol>
      </td>
    </tr>
    <tr><td class="time-line" colspan="9">{{leaveTime}}: Leave site</td></tr>

    <tr class="r-sign-head">
      <td class="party" colspan="6">{{companyName}}</td>
      <td class="party" colspan="3">{{clientName}}</td>
    </tr>
    <tr class="r-sign-block">
      <td class="sign-area" colspan="6">
        <div class="sign-pad">
          {{#if signatureUrl}}<img class="sig" src="{{signatureUrl}}" alt="" />{{/if}}
        </div>
        <div class="sign-meta">
          Signature: {{signerName}}{{#if signedDate}} : {{signedDate}}{{/if}}
        </div>
      </td>
      <td class="sign-area" colspan="3">
        <div class="sign-pad">&nbsp;</div>
        <div class="sign-meta client-meta">
          <span class="sig-field">Signature: <span class="uline"></span></span>
          <span class="sig-field">Date: <span class="uline"></span></span>
        </div>
      </td>
    </tr>
  </table>
</div>
`.trim();

/** Letter page — tight margins so the sheet sits closer to the paper edge. */
export const DAILY_REPORT_CSS = `
@page {
  size: letter portrait;
  margin: 5mm 4mm 4mm 4mm;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9pt;
  line-height: 1.2;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page-pad {
  width: 100%;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 5mm 4mm 4mm 4mm;
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
  vertical-align: middle !important;
}

.r-sign-head td.party {
  vertical-align: middle !important;
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
  height: 14px;
  padding: 1px 3px !important;
}

.data td {
  height: 11px;
  font-size: 8.5pt;
  padding: 0 3px !important;
  line-height: 1.15;
}

.data td.pad-l {
  padding-left: 8px !important;
  text-align: left;
}

.total {
  font-weight: 700;
  text-align: center;
}

.total-row td {
  height: 13px;
  padding: 1px 3px !important;
}

.section {
  font-weight: 700;
  height: 14px;
  padding: 1px 4px !important;
}

.work-desc-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.section-label { font-weight: 700; }
.work-desc-inline {
  font-weight: 700;
  margin-left: 0.4em;
  white-space: normal;
}

.body {
  white-space: pre-wrap;
  vertical-align: top !important;
  min-height: 12px;
  padding: 2px 4px 2px 10px !important;
}
.body.indent { padding-left: 12px !important; }

.time-line { font-weight: 700; height: 13px; padding: 1px 4px !important; }

.r-activities td {
  height: auto;
  min-height: 0;
  max-height: 118px;
  vertical-align: top !important;
  overflow: hidden;
}

.activity {
  vertical-align: top !important;
  padding: 3px 5px !important;
}
/* Native ordered list → correct hanging wrap under the text */
.activity-ol {
  margin: 0;
  padding-left: 1.25em;
  min-height: 0;
  list-style-type: decimal;
  list-style-position: outside;
}
.activity-ol li {
  margin: 0 0 1px;
  padding-left: 0.15em;
  white-space: normal;
}
.activity-ol.next-ol {
  padding-left: calc(0.2in + 1em);
  min-height: 0;
}
.note-line {
  margin-top: 4px;
  font-weight: 700;
  padding-left: 10px;
}

.docs {
  vertical-align: top !important;
  padding: 3px 5px !important;
}
.docs-label { font-weight: 700; margin-bottom: 2px; }

.photos {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-content: flex-start;
}
.photos img {
  /* Exactly 3 per row; smaller squares to keep the sheet on one page */
  width: calc((100% - 6px) / 3);
  aspect-ratio: 1 / 1;
  height: auto;
  max-height: 52px;
  object-fit: cover;
  border: 1px solid #444;
  box-sizing: border-box;
}

.r-next td {
  min-height: 28px;
  height: auto;
  vertical-align: middle !important;
}
.r-next td.next-shift {
  padding: 3px 5px !important;
  vertical-align: middle !important;
}

.r-sign-head td { height: 22px; vertical-align: middle !important; }

/* Signature image floats above the name/date line without pushing it to page 2 */
.r-sign-block td.sign-area {
  position: relative;
  height: 70px;
  padding: 0 !important;
  vertical-align: bottom !important;
  overflow: hidden;
}
.sign-pad {
  position: relative;
  height: 46px;
  border-bottom: none;
}
.sig {
  position: absolute;
  left: 50%;
  bottom: 2px;
  transform: translateX(-50%);
  display: block;
  max-height: 42px;
  max-width: 130px;
  margin: 0;
  object-fit: contain;
  z-index: 1;
  pointer-events: none;
}
.sign-meta {
  position: relative;
  z-index: 2;
  height: 24px;
  line-height: 24px;
  vertical-align: middle;
  text-align: center;
  padding: 0 6px !important;
  font-size: 9pt;
  background: transparent;
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
  .r-sign-block { page-break-inside: avoid; }
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
