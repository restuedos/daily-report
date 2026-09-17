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

export const DAILY_REPORT_HTML = `
<div class="sheet">
  <table class="main">
    <colgroup>
      <col class="c-no" />
      <col class="c-name" />
      <col class="c-name" />
      <col class="c-qual" />
      <col class="c-qual" />
      <col class="c-hours" />
      <col class="c-hours" />
      <col class="c-remark" />
      <col class="c-extra" />
    </colgroup>

    <tr>
      <td class="logo" colspan="2" rowspan="2">
        {{#if clientLogoUrl}}<img src="{{clientLogoUrl}}" alt="client" />{{/if}}
      </td>
      <td class="center title project-cell" colspan="6">PROJECT NO: {{projectNo}}</td>
      <td class="logo" rowspan="2">
        {{#if companyLogoUrl}}<img src="{{companyLogoUrl}}" alt="company" />{{/if}}
      </td>
    </tr>
    <tr>
      <td class="center title project-cell" colspan="6">PROJECT: {{projectName}}</td>
    </tr>

    <tr>
      <td class="center bold party" colspan="2" rowspan="2">{{clientName}}</td>
      <td class="center meta" colspan="3">Date: {{reportDate}}</td>
      <td class="center meta" colspan="3">DAILY REPORT No: {{reportNo}}</td>
      <td class="center bold party" rowspan="2">{{companyName}}</td>
    </tr>
    <tr>
      <td class="meta" colspan="3"></td>
      <td class="center meta" colspan="3">WEEK No: {{weekNo}}</td>
    </tr>

    <tr class="head">
      <td>No.</td>
      <td colspan="2">NAME</td>
      <td colspan="2">QUALIFICATION</td>
      <td colspan="2">Working hours</td>
      <td>Remarks</td>
      <td>Extra job</td>
    </tr>
    {{#each manpower}}
    <tr class="data">
      <td class="center">{{inc @index}}.</td>
      <td colspan="2">{{name}}</td>
      <td class="center" colspan="2">{{qualification}}</td>
      <td class="center" colspan="2">{{workingHours}}</td>
      <td>{{remarks}}</td>
      <td>{{extraJob}}</td>
    </tr>
    {{/each}}
    <tr>
      <td class="bold total" colspan="9">Total Manpower: {{totalManpower}}</td>
    </tr>

    <tr class="head">
      <td>No.</td>
      <td colspan="6">MAIN EQUIPMENT</td>
      <td colspan="2">Quantity</td>
    </tr>
    {{#each equipment}}
    <tr class="data">
      <td class="center">{{inc @index}}.</td>
      <td colspan="6">{{name}}</td>
      <td class="center" colspan="2">{{quantity}}</td>
    </tr>
    {{/each}}

    <tr>
      <td class="section" colspan="9">Work Description:</td>
    </tr>
    <tr>
      <td class="pre" colspan="9">{{workDescription}}</td>
    </tr>
    <tr>
      <td colspan="9">{{arrivalTime}}: Arrival to the site</td>
    </tr>

    <tr>
      <td class="section" colspan="9">Activities done this day:</td>
    </tr>
    <tr>
      <td class="top activity" colspan="5">
        <div class="pre">{{activitiesDone}}</div>
        <div class="mt"><strong>Note:</strong> {{#if notes}}{{notes}}{{else}}-{{/if}}</div>
        <div class="mt"><strong>Work Evaluation:</strong> {{#if workEvaluation}}{{workEvaluation}}{{else}}-{{/if}}</div>
      </td>
      <td class="top docs" colspan="4">
        <div class="section docs-title">Documentation:</div>
        <div class="photos">
          {{#each photos}}
          <img src="{{url}}" alt="doc {{index}}" />
          {{/each}}
        </div>
      </td>
    </tr>

    <tr>
      <td class="section" colspan="9">Activities planned for next Shift:</td>
    </tr>
    <tr>
      <td class="pre" colspan="9">{{activitiesNextShift}}</td>
    </tr>
    <tr>
      <td colspan="9">{{leaveTime}}: Leave site</td>
    </tr>

    <tr>
      <td class="center bold party" colspan="5">{{companyName}}</td>
      <td class="center bold party" colspan="4">{{clientName}}</td>
    </tr>
    <tr>
      <td class="sign" colspan="5">
        {{#if signatureUrl}}<img class="sig" src="{{signatureUrl}}" alt="signature" />{{/if}}
        <div class="center">Signature: {{signerName}} : {{signedDate}}</div>
      </td>
      <td class="sign" colspan="4">
        <div>Signature:</div>
        <div class="mt">Date:</div>
      </td>
    </tr>
  </table>
</div>
`.trim();

export const DAILY_REPORT_CSS = `
@page { size: A4 portrait; margin: 0; }

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100%;
  background: #fff;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10.5px;
  line-height: 1.25;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Visible page padding for HTML preview + PDF */
.page-pad {
  box-sizing: border-box;
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  padding: 12mm;
  background: #fff;
}

.sheet {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

table.main {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #000;
  box-sizing: border-box;
}

table.main td {
  border: 1px solid #000;
  padding: 4px 5px;
  vertical-align: middle;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}

col.c-no { width: 6%; }
col.c-name { width: 13%; }
col.c-qual { width: 12%; }
col.c-hours { width: 10%; }
col.c-remark { width: 12%; }
col.c-extra { width: 12%; }

.logo {
  text-align: center;
  padding: 6px !important;
  background: #fff;
}

.logo img {
  display: block;
  margin: 0 auto;
  max-width: 72px;
  max-height: 56px;
  object-fit: contain;
}

.project-cell {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.party {
  font-size: 11px;
  text-transform: uppercase;
}

.meta { font-size: 10.5px; }
.center { text-align: center; }
.bold { font-weight: 700; }
.title { font-weight: 700; }

.head {
  background: #efefef !important;
  font-weight: 700;
  text-align: center;
  font-size: 10px;
}

.data td { height: 22px; }
.total { background: #fafafa; }

.section {
  font-weight: 700;
  background: #f7f7f7;
}

.docs-title {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0 0 4px;
}

.pre {
  white-space: pre-wrap;
  min-height: 18px;
}

.top { vertical-align: top !important; }

.activity,
.docs {
  min-height: 150px;
  height: 150px;
}

.mt { margin-top: 8px; }

.photos {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  align-content: flex-start;
}

.photos img {
  width: 108px;
  height: 80px;
  object-fit: cover;
  border: 1px solid #444;
  background: #fff;
}

.sign {
  height: 120px;
  vertical-align: bottom !important;
  padding-bottom: 8px !important;
}

.sig {
  display: block;
  max-height: 64px;
  max-width: 180px;
  margin: 4px auto 10px;
  object-fit: contain;
}

@media print {
  html, body, .sheet, table.main {
    width: 100% !important;
    max-width: 100% !important;
  }
  table.main { page-break-inside: avoid; }
}
`.trim();

export const DELIVERY_NOTE_HTML = `
<div class="sheet">
  <h1>SURAT JALAN</h1>
  <table class="meta">
    <tr><td>No</td><td>{{noteNumber}}</td><td>Tanggal</td><td>{{noteDate}}</td></tr>
    <tr><td>Pengirim</td><td colspan="3">{{senderName}}</td></tr>
    <tr><td>Penerima</td><td colspan="3">{{receiverName}}</td></tr>
    <tr><td>Pengemudi</td><td>{{driverName}}</td><td>Kendaraan</td><td>{{vehicleInfo}}</td></tr>
  </table>
  <table class="items">
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
    {{#if signatureUrl}}<img src="{{signatureUrl}}" alt="ttd" />{{/if}}
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
