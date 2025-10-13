"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExcelJS = require("exceljs");
function testExport() {
  const headers = ["Header1", "Header2", "Header3"];
  const data = [
    ["Data1", "Data2", "Data3"],
    ["Data4", "Data5", "Data6"],
  ];
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("TestSheet");
  worksheet.addRows([headers, ...data]);
  // Apply bold font and center alignment to header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center" };
  workbook.xlsx.writeFile("test-xlsx-style.xlsx");
}
testExport();
