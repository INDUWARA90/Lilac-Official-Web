/**
 * Minimal CSV builder. Quotes a field when it contains a comma, quote, or
 * newline, and doubles inner quotes (RFC 4180). Good enough for the two admin
 * exports; no dependency needed.
 */
function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Spreadsheet formula injection: entry names/addresses/messages are typed by
  // anonymous visitors, and Excel/Sheets run a cell starting with = + - @ as a
  // formula when an admin opens the export. Prefix those with a single quote so
  // they stay text — but leave plain phone numbers / negative numbers alone.
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s()-]+$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsOnly(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(",")];
  for (const row of rows) lines.push(row.map(cell).join(","));
  return lines.join("\r\n");
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  // Leading BOM so Excel opens UTF-8 (e.g. Sinhala names) correctly.
  return "﻿" + rowsOnly(headers, rows) + "\r\n";
}

/**
 * Several header/rows blocks in one file, separated by a blank line — e.g.
 * a small "site-wide totals" table followed by a per-ad breakdown table.
 * Same BOM handling as `toCsv`, just once for the whole file.
 */
export function toCsvSections(sections: { headers: string[]; rows: unknown[][] }[]): string {
  return "﻿" + sections.map((s) => rowsOnly(s.headers, s.rows)).join("\r\n\r\n") + "\r\n";
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
