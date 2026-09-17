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

/**
 * 9-column grid matching the sample Word daily report.
 * Spans are critical so vertical borders line up across every section.
 * No rowspan (html-to-docx breaks it). Prefer <br/> over nested <div>.
 */
export const DAILY_REPORT_HTML = `
<div class="sheet">
  <table class="main" width="700" cellspacing="0" cellpadding="5" border="1">
    <!-- Header: 2 + 6 + 1 = 9 -->
    <tr>
      <td class="logo" colspan="2" align="center" valign="middle">
        {{#if clientLogoUrl}}<img class="logo-img" src="{{clientLogoUrl}}" width="56" height="40" alt="" />{{else}}&nbsp;{{/if}}
      </td>
      <td class="project" colspan="6" align="center" valign="middle" style="text-align:center;">
        <p style="text-align:center;margin:0;"><strong>PROJECT NO:</strong> {{projectNo}}</p>
        <p style="text-align:center;margin:4px 0 0;"><strong>PROJECT:</strong> {{projectName}}</p>
      </td>
      <td class="logo" colspan="1" align="center" valign="middle">
        {{#if companyLogoUrl}}<img class="logo-img" src="{{companyLogoUrl}}" width="56" height="40" alt="" />{{else}}&nbsp;{{/if}}
      </td>
    </tr>

    <!-- Meta: 2 + 3 + 3 + 1 = 9 -->
    <tr>
      <td class="party" colspan="2" align="center" valign="middle"><strong>{{clientName}}</strong></td>
      <td class="meta" colspan="3" align="center" valign="middle">
        <strong>Date:</strong> {{reportDate}}<br />
        <strong>WEEK No:</strong> {{weekNo}}
      </td>
      <td class="meta" colspan="3" align="center" valign="middle">
        <strong>DAILY REPORT No:</strong> {{reportNo}}
      </td>
      <td class="party" colspan="1" align="center" valign="middle"><strong>{{companyName}}</strong></td>
    </tr>

    <!-- Manpower head: 1 + 2 + 2 + 2 + 1 + 1 = 9 -->
    <tr class="head">
      <td align="center" valign="middle"><strong>No.</strong></td>
      <td colspan="2" align="center" valign="middle"><strong>NAME</strong></td>
      <td colspan="2" align="center" valign="middle"><strong>QUALIFICATION</strong></td>
      <td colspan="2" align="center" valign="middle"><strong>Working<br />hours</strong></td>
      <td align="center" valign="middle"><strong>Remarks</strong></td>
      <td align="center" valign="middle"><strong>Extra<br />job</strong></td>
    </tr>
    {{#each manpower}}
    <tr class="data">
      <td align="center" valign="middle">{{inc @index}}.</td>
      <td colspan="2" valign="middle">{{name}}</td>
      <td colspan="2" align="center" valign="middle">{{qualification}}</td>
      <td colspan="2" align="center" valign="middle">{{workingHours}}</td>
      <td valign="middle">{{#if remarks}}{{remarks}}{{else}}&nbsp;{{/if}}</td>
      <td valign="middle">{{#if extraJob}}{{extraJob}}{{else}}&nbsp;{{/if}}</td>
    </tr>
    {{/each}}
    <tr>
      <td class="total" colspan="9" valign="middle"><strong>Total Manpower: {{totalManpower}}</strong></td>
    </tr>

    <!-- Equipment: 1 + 4 + 4 = 9 (Quantity aligns with hours+remarks+extra) -->
    <tr class="head">
      <td align="center" valign="middle"><strong>No.</strong></td>
      <td colspan="4" align="center" valign="middle"><strong>MAIN EQUIPMENT</strong></td>
      <td colspan="4" align="center" valign="middle"><strong>Quantity</strong></td>
    </tr>
    {{#each equipment}}
    <tr class="data">
      <td align="center" valign="middle">{{inc @index}}.</td>
      <td colspan="4" valign="middle">{{name}}</td>
      <td colspan="4" align="center" valign="middle">{{quantity}}</td>
    </tr>
    {{/each}}

    <tr>
      <td class="section" colspan="9" valign="middle"><strong>Work Description:</strong></td>
    </tr>
    <tr>
      <td class="body" colspan="9" valign="top">{{#if workDescription}}{{workDescription}}{{else}}&nbsp;{{/if}}</td>
    </tr>
    <tr>
      <td colspan="9" valign="middle">{{arrivalTime}}: Arrival to the site</td>
    </tr>

    <!-- Activities / docs: 4 + 5 = 9 -->
    <tr>
      <td class="section" colspan="4" valign="middle"><strong>Activities done this day:</strong></td>
      <td class="section" colspan="5" valign="middle"><strong>Documentation:</strong></td>
    </tr>
    <tr>
      <td class="body activity" colspan="4" valign="top">
        {{#if activitiesDone}}{{activitiesDone}}{{else}}&nbsp;{{/if}}
        <br /><br />
        <strong>Note:</strong> {{#if notes}}{{notes}}{{else}}-{{/if}}
        <br />
        <strong>Work Evaluation:</strong> {{#if workEvaluation}}{{workEvaluation}}{{else}}-{{/if}}
      </td>
      <td class="body docs" colspan="5" valign="top" align="center">
        {{#each photos}}
        <img src="{{url}}" width="120" height="90" alt="" />
        {{else}}
        &nbsp;
        {{/each}}
      </td>
    </tr>

    <tr>
      <td class="section" colspan="9" valign="middle"><strong>Activities planned for next Shift:</strong></td>
    </tr>
    <tr>
      <td class="body" colspan="9" valign="top">{{#if activitiesNextShift}}{{activitiesNextShift}}{{else}}&nbsp;{{/if}}</td>
    </tr>
    <tr>
      <td colspan="9" valign="middle">{{leaveTime}}: Leave site</td>
    </tr>

    <!-- Signatures: 5 + 4 = 9 (near-equal) -->
    <tr>
      <td class="party" colspan="5" align="center" valign="middle"><strong>{{companyName}}</strong></td>
      <td class="party" colspan="4" align="center" valign="middle"><strong>{{clientName}}</strong></td>
    </tr>
    <tr>
      <td class="sign" colspan="5" align="center" valign="bottom">
        {{#if signatureUrl}}<img src="{{signatureUrl}}" width="150" height="60" alt="" /><br />{{/if}}
        Signature: {{signerName}}{{#if signedDate}} : {{signedDate}}{{/if}}
      </td>
      <td class="sign" colspan="4" align="center" valign="bottom">
        Signature:<br /><br /><br />Date:
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
  background: #fff;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10.5px;
  line-height: 1.3;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page-pad {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  padding: 12mm;
  background: #fff;
}

.sheet { width: 100%; }

table.main {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1.5px solid #111;
}

table.main td {
  border: 1px solid #222;
  padding: 6px 7px;
  vertical-align: middle;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.logo { padding: 6px !important; text-align: center; }
.logo img,
.logo-img {
  display: inline-block;
  max-width: 56px;
  max-height: 40px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.project {
  font-size: 12px;
  font-weight: 700;
  padding: 10px 8px !important;
  line-height: 1.45;
}

.party {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.15px;
  background: #fafafa;
  font-weight: 700;
}

.meta { font-size: 10.5px; line-height: 1.45; }

.head td {
  background: #ececec !important;
  font-weight: 700;
  font-size: 10px;
  text-align: center;
}

.data td { min-height: 22px; }

.total { background: #f7f7f7; font-weight: 700; }

.section {
  background: #f0f0f0 !important;
  font-weight: 700;
}

.body {
  white-space: pre-wrap;
  min-height: 32px;
  vertical-align: top !important;
  text-align: left;
}

.activity, .docs { min-height: 150px; height: 150px; }

.docs img {
  object-fit: cover;
  border: 1px solid #555;
  margin: 3px;
  vertical-align: top;
}

.sign {
  height: 120px;
  vertical-align: bottom !important;
  padding: 10px 8px 10px !important;
}

.sign img {
  display: block;
  margin: 0 auto 8px;
  object-fit: contain;
}

@media print {
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
