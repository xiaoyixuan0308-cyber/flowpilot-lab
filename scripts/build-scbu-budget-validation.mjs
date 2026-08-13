import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("../deliverables/validation-data-20260731");
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const input = workbook.worksheets.add("BU周金额目标");
const audit = workbook.worksheets.add("校验汇总");
const invalid = workbook.worksheets.add("错误样例_请勿整表导入");

const rows = [
  [new Date("2026-07-06T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-NORTH", 180000, 920000, 1000000, "USD"],
  [new Date("2026-07-06T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-SOUTH", 155000, 780000, 850000, "USD"],
  [new Date("2026-07-06T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-WEST", 120000, 650000, 720000, "USD"],
  [new Date("2026-07-13T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-NORTH", 390000, 920000, 1000000, "USD"],
  [new Date("2026-07-13T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-SOUTH", 330000, 780000, 850000, "USD"],
  [new Date("2026-07-13T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-WEST", 265000, 650000, 720000, "USD"],
  [new Date("2026-07-20T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-NORTH", 620000, 920000, 1000000, "USD"],
  [new Date("2026-07-20T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-SOUTH", 520000, 780000, 850000, "USD"],
  [new Date("2026-07-20T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-WEST", 430000, 650000, 720000, "USD"],
  [new Date("2026-07-27T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-NORTH", 875000, 920000, 1000000, "USD"],
  [new Date("2026-07-27T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-SOUTH", 745000, 780000, 850000, "USD"],
  [new Date("2026-07-27T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-WEST", 610000, 650000, 720000, "USD"],
];

input.getRange("A1:G13").values = [
  ["period_week", "period_month", "sc_bu", "actual_amount", "month_target_amount", "month_limit_amount", "currency_code"],
  ...rows,
];
input.tables.add("A1:G13", true, "ScbuBudgetImport");
input.freezePanes.freezeRows(1);
input.showGridLines = false;
input.getRange("A1:G1").format = {
  fill: "#155E75",
  font: { bold: true, color: "#FFFFFF" },
  rowHeight: 28,
};
input.getRange("A2:B13").format.numberFormat = "yyyy-mm-dd";
input.getRange("D2:F13").format.numberFormat = "#,##0.00";
input.getRange("A:G").format.columnWidth = 18;
input.getRange("C:C").format.columnWidth = 22;

audit.getRange("A1:H1").merge();
audit.getRange("A1").values = [["SCBU预算验证汇总"]];
audit.getRange("A1:H1").format = {
  fill: "#155E75",
  font: { bold: true, color: "#FFFFFF", size: 16 },
  horizontalAlignment: "center",
  rowHeight: 34,
};
audit.getRange("A3:H3").values = [[
  "周开始日", "SCBU", "周累计金额", "月预算", "月度限制", "周<=月", "月<=限制", "综合结果",
]];
audit.getRange("A4:E15").formulas = rows.map((_, index) => {
  const sourceRow = index + 2;
  return [
    `='BU周金额目标'!A${sourceRow}`,
    `='BU周金额目标'!C${sourceRow}`,
    `='BU周金额目标'!D${sourceRow}`,
    `='BU周金额目标'!E${sourceRow}`,
    `='BU周金额目标'!F${sourceRow}`,
  ];
});
audit.getRange("F4:F15").formulas = rows.map((_, index) => [`=IF(C${index + 4}<=D${index + 4},"PASS","FAIL")`]);
audit.getRange("G4:G15").formulas = rows.map((_, index) => [`=IF(D${index + 4}<=E${index + 4},"PASS","FAIL")`]);
audit.getRange("H4:H15").formulas = rows.map((_, index) => [`=IF(AND(F${index + 4}="PASS",G${index + 4}="PASS"),"PASS","FAIL")`]);
audit.getRange("A3:H3").format = {
  fill: "#DCEAF1",
  font: { bold: true, color: "#17324D" },
};
audit.getRange("A4:A15").format.numberFormat = "yyyy-mm-dd";
audit.getRange("C4:E15").format.numberFormat = "#,##0.00";
audit.getRange("A:H").format.columnWidth = 17;
audit.getRange("B:B").format.columnWidth = 22;
audit.freezePanes.freezeRows(3);
audit.showGridLines = false;

invalid.getRange("A1:H1").values = [[
  "period_week", "period_month", "sc_bu", "actual_amount", "month_target_amount", "month_limit_amount", "currency_code", "预期结果",
]];
invalid.getRange("A2:H3").values = [
  [new Date("2026-07-06T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-WEEK-OVER", 950000, 900000, 1000000, "USD", "拒绝：周累计金额超过月预算"],
  [new Date("2026-07-06T00:00:00Z"), new Date("2026-07-01T00:00:00Z"), "SCBU-MONTH-OVER", 700000, 1100000, 1000000, "USD", "拒绝：月预算超过月度限制"],
];
invalid.getRange("A1:H1").format = {
  fill: "#9F1239",
  font: { bold: true, color: "#FFFFFF" },
};
invalid.getRange("A2:B3").format.numberFormat = "yyyy-mm-dd";
invalid.getRange("D2:F3").format.numberFormat = "#,##0.00";
invalid.getRange("A:G").format.columnWidth = 18;
invalid.getRange("C:C").format.columnWidth = 24;
invalid.getRange("H:H").format.columnWidth = 34;
invalid.showGridLines = false;

const check = await workbook.inspect({
  kind: "table",
  range: "校验汇总!A1:H15",
  include: "values,formulas",
  tableMaxRows: 16,
  tableMaxCols: 8,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

for (const sheetName of ["BU周金额目标", "校验汇总", "错误样例_请勿整表导入"]) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(outputDir, `${sheetName}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, "SCBU预算验证数据_20260731.xlsx"));
