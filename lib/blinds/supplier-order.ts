import type ExcelJS from "exceljs";

// Lazy-loaded at runtime to bypass Turbopack static analysis.
// exceljs has Node.js deps (streams, fs) that Turbopack cannot bundle.
let _exceljs: typeof import("exceljs") | null = null;
async function getExcelJS() {
  _exceljs ??= await import(/* webpackIgnore: true */ "exceljs");
  return _exceljs;
}

export interface SupplierOrderItem {
  location_label?: string | null;
  width_mm: number;
  drop_mm: number;
  matched_width_cm: number;
  matched_drop_cm: number;
  control_side: "left" | "right";
  mount_type: string;
  colour: string;
  range_name: string;
  type_name: string;
  slat_size_mm?: number | null;
  selected_extras?: { name: string }[];
}

export interface SupplierOrderData {
  order_number: string;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  };
  items: SupplierOrderItem[];
}

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  DARK:   "FF1A1A2E", // Near-black navy — title bar
  MID:    "FF2D4A7A", // Mid-blue — column header band
  LIGHT:  "FFD6E4F7", // Ice-blue — sub-header row
  ALT:    "FFF0F6FF", // Alternating item row
  WHITE:  "FFFFFFFF",
  ACCENT: "FFC4663A", // Blindly orange
  GREY:   "FFF5F5F5", // Info section bg
  BORDER: "FFAACAEE", // Soft-blue border
  TEXT:   "FF111111",
  MUTED:  "FF888888",
} as const;

type ArgbColor = { argb: string };

const rgb = (argb: string): ArgbColor => ({ argb });

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: rgb(argb) };
}

function hdrFont(size = 10, argb = C.WHITE, bold = true): Partial<ExcelJS.Font> {
  return { name: "Arial", size, bold, color: rgb(argb) };
}

function bodyFont(size = 9, argb = C.TEXT, bold = false): Partial<ExcelJS.Font> {
  return { name: "Arial", size, bold, color: rgb(argb) };
}

function thinSide(argb = C.BORDER): Partial<ExcelJS.BorderLine> {
  return { style: "thin", color: rgb(argb) };
}

function hairSide(argb = C.BORDER): Partial<ExcelJS.BorderLine> {
  return { style: "hair", color: rgb(argb) };
}

function mediumSide(argb = "FF000000"): Partial<ExcelJS.BorderLine> {
  return { style: "medium", color: rgb(argb) };
}

const CENTER: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle", wrapText: true };
const LEFT: Partial<ExcelJS.Alignment>   = { horizontal: "left",   vertical: "middle" };

/**
 * Generates a styled Shademaster-compatible order form XLSX.
 * Uses exceljs for proper cell styling — colours, borders, merged cells.
 */
export async function generateSupplierOrderXls(data: SupplierOrderData): Promise<Buffer> {
  const exceljs = await getExcelJS();
  const wb = new exceljs.Workbook();
  wb.creator = "Blindly Online";
  wb.created = new Date();

  const ws = wb.addWorksheet("ORDER FORM", {
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printArea: "A1:M28",
    },
    views: [{ showGridLines: false }],
  });

  // ── Column widths ────────────────────────────────────────────────────────
  ws.columns = [
    { key: "A", width: 2  },  // spacer
    { key: "B", width: 5  },  // NO.
    { key: "C", width: 24 },  // LOCATION
    { key: "D", width: 5  },  // QTY
    { key: "E", width: 9  },  // WIDTH
    { key: "F", width: 9  },  // DROP
    { key: "G", width: 7  },  // CTRL L
    { key: "H", width: 7  },  // CTRL R
    { key: "I", width: 12 },  // MOUNT
    { key: "J", width: 18 },  // BLIND TYPE
    { key: "K", width: 22 },  // RANGE
    { key: "L", width: 18 },  // COLOUR
    { key: "M", width: 10 },  // SLAT
  ];

  const addr = data.delivery_address;

  // ── Helper: fill a range of cells with the same fill ────────────────────
  function fillRange(startCol: number, endCol: number, row: number, argb: string) {
    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(row, c).fill = fill(argb);
    }
  }

  // ── ROW 1: Title bar ─────────────────────────────────────────────────────
  ws.getRow(1).height = 28;
  ws.mergeCells("A1:M1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "SHADEMASTER ORDER FORM";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: rgb(C.WHITE) };
  titleCell.fill = fill(C.DARK);
  titleCell.alignment = CENTER;

  // ── ROW 2: Customer | Order no ───────────────────────────────────────────
  ws.getRow(2).height = 16;
  ws.mergeCells("B2:H2");
  const custCell = ws.getCell("B2");
  custCell.value = `CUSTOMER: ${data.customer_name}`;
  custCell.font = hdrFont(9, C.TEXT);
  custCell.fill = fill(C.GREY);
  custCell.alignment = LEFT;

  ws.mergeCells("I2:M2");
  const orderCell = ws.getCell("I2");
  orderCell.value = `ORDER NO: ${data.order_number}`;
  orderCell.font = { name: "Arial", size: 9, bold: true, color: rgb(C.ACCENT) };
  orderCell.fill = fill(C.GREY);
  orderCell.alignment = LEFT;

  ws.getCell("A2").fill = fill(C.GREY);

  // ── ROW 3: Address | Date ────────────────────────────────────────────────
  ws.getRow(3).height = 14;
  ws.mergeCells("B3:H3");
  const addrCell = ws.getCell("B3");
  addrCell.value = `ADDRESS: ${addr.street}`;
  addrCell.font = bodyFont();
  addrCell.fill = fill(C.GREY);
  addrCell.alignment = LEFT;

  ws.mergeCells("I3:M3");
  const dateCell = ws.getCell("I3");
  dateCell.value = `DATE: ${data.order_date}`;
  dateCell.font = bodyFont();
  dateCell.fill = fill(C.GREY);
  dateCell.alignment = LEFT;

  ws.getCell("A3").fill = fill(C.GREY);

  // ── ROW 4: City | Dealer ─────────────────────────────────────────────────
  ws.getRow(4).height = 14;
  ws.mergeCells("B4:H4");
  const cityCell = ws.getCell("B4");
  cityCell.value = `CITY: ${addr.city}, ${addr.province} ${addr.postal_code}`;
  cityCell.font = bodyFont();
  cityCell.fill = fill(C.GREY);
  cityCell.alignment = LEFT;

  ws.mergeCells("I4:M4");
  const dealerCell = ws.getCell("I4");
  dealerCell.value = "DEALER: Blindly Online";
  dealerCell.font = bodyFont();
  dealerCell.fill = fill(C.GREY);
  dealerCell.alignment = LEFT;

  ws.getCell("A4").fill = fill(C.GREY);

  // ── ROW 5: Contact | Consultant ──────────────────────────────────────────
  ws.getRow(5).height = 14;
  ws.mergeCells("B5:H5");
  const contactCell = ws.getCell("B5");
  contactCell.value = `CONTACT: ${data.customer_name}`;
  contactCell.font = bodyFont();
  contactCell.fill = fill(C.GREY);
  contactCell.alignment = LEFT;

  ws.mergeCells("I5:M5");
  const consultCell = ws.getCell("I5");
  consultCell.value = "CONSULTANT: Blindly Online";
  consultCell.font = bodyFont();
  consultCell.fill = fill(C.GREY);
  consultCell.alignment = LEFT;

  ws.getCell("A5").fill = fill(C.GREY);

  // ── ROW 6: Phone ─────────────────────────────────────────────────────────
  ws.getRow(6).height = 14;
  ws.mergeCells("B6:M6");
  const phoneCell = ws.getCell("B6");
  phoneCell.value = `PHONE: ${data.customer_phone}`;
  phoneCell.font = bodyFont();
  phoneCell.fill = fill(C.GREY);
  phoneCell.alignment = LEFT;

  ws.getCell("A6").fill = fill(C.GREY);

  // ── ROW 7: Spacer ────────────────────────────────────────────────────────
  ws.getRow(7).height = 6;
  fillRange(1, 13, 7, C.WHITE);

  // ── ROWS 8–9: Column headers ─────────────────────────────────────────────
  ws.getRow(8).height = 20;
  ws.getRow(9).height = 16;

  // Row 8: group labels
  const hdrDefs: [string, string, string | null][] = [
    ["B8",  "NO.",        null],
    ["C8",  "LOCATION",   null],
    ["D8",  "QTY",        null],
    ["E8",  "WIDTH",      null],
    ["F8",  "DROP",       null],
    ["G8",  "CONTROLS",   "H8"], // merge G8:H8
    ["I8",  "MOUNT",      null],
    ["J8",  "BLIND TYPE", null],
    ["K8",  "RANGE",      null],
    ["L8",  "COLOUR",     null],
    ["M8",  "SLAT",       null],
  ];

  ws.getCell("A8").fill = fill(C.MID);

  for (const [ref, label, mergeTo] of hdrDefs) {
    if (mergeTo) ws.mergeCells(`${ref}:${mergeTo}`);
    const c = ws.getCell(ref);
    c.value = label;
    c.font = hdrFont(9);
    c.fill = fill(C.MID);
    c.alignment = CENTER;
    c.border = {
      top:    mediumSide(),
      bottom: thinSide(),
      left:   thinSide(),
      right:  thinSide(),
    };
  }

  // Row 9: sub-labels (mm / L / R)
  const subDefs: [string, string][] = [
    ["B9", ""],
    ["C9", ""],
    ["D9", ""],
    ["E9", "mm"],
    ["F9", "mm"],
    ["G9", "L"],
    ["H9", "R"],
    ["I9", ""],
    ["J9", ""],
    ["K9", ""],
    ["L9", ""],
    ["M9", ""],
  ];

  ws.getCell("A9").fill = fill(C.LIGHT);

  for (const [ref, label] of subDefs) {
    const c = ws.getCell(ref);
    c.value = label;
    c.font = hdrFont(8, "FF1A3A6B");
    c.fill = fill(C.LIGHT);
    c.alignment = CENTER;
    c.border = {
      bottom: mediumSide(),
      left:   thinSide(),
      right:  thinSide(),
    };
  }

  // ── Item rows starting at row 10 ─────────────────────────────────────────
  const DATA_START = 10;

  data.items.forEach((item, i) => {
    const r = DATA_START + i;
    ws.getRow(r).height = 16;
    const rowFill = fill(i % 2 === 0 ? C.ALT : C.WHITE);
    const rowBorder: Partial<ExcelJS.Borders> = {
      top:    hairSide(),
      bottom: hairSide(),
      left:   thinSide(),
      right:  thinSide(),
    };

    function sc(col: string, value: ExcelJS.CellValue, opts?: { bold?: boolean; align?: "center" | "left" }) {
      const c = ws.getCell(`${col}${r}`);
      c.value = value;
      c.font = bodyFont(9, C.TEXT, opts?.bold ?? false);
      c.fill = rowFill;
      c.alignment = { horizontal: opts?.align ?? "center", vertical: "middle" };
      c.border = rowBorder;
    }

    let location = item.location_label ?? "";
    if (item.selected_extras && item.selected_extras.length > 0) {
      const extras = item.selected_extras.map((e) => e.name).join(", ");
      location = location ? `${location} [${extras}]` : `[${extras}]`;
    }

    sc("A", null);
    sc("B", i + 1, { bold: true });
    sc("C", location, { align: "left" });
    sc("D", 1);
    sc("E", item.matched_width_cm * 10);
    sc("F", item.matched_drop_cm * 10);
    sc("G", item.control_side === "left"  ? "X" : "");
    sc("H", item.control_side === "right" ? "X" : "");
    sc("I", item.mount_type === "inside"  ? "Inside" : "Outside");
    sc("J", item.type_name,  { align: "left" });
    sc("K", item.range_name, { align: "left" });
    sc("L", item.colour,     { align: "left" });
    sc("M", item.slat_size_mm ?? "");
  });

  // ── ADDITIONAL INFORMATION section ───────────────────────────────────────
  const addRow = DATA_START + Math.max(data.items.length, 1) + 1;

  ws.getRow(addRow).height = 14;
  ws.mergeCells(`B${addRow}:M${addRow}`);
  const addTitle = ws.getCell(`B${addRow}`);
  addTitle.value = "ADDITIONAL INFORMATION";
  addTitle.font = hdrFont(9);
  addTitle.fill = fill(C.MID);
  addTitle.alignment = LEFT;
  ws.getCell(`A${addRow}`).fill = fill(C.MID);

  ws.getRow(addRow + 1).height = 50;
  ws.mergeCells(`B${addRow + 1}:M${addRow + 1}`);
  const addBody = ws.getCell(`B${addRow + 1}`);
  addBody.fill = fill(C.GREY);
  addBody.border = {
    top:    thinSide(),
    bottom: thinSide(),
    left:   thinSide(),
    right:  thinSide(),
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
