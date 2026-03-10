import path from "path";
import fs from "fs";
import XLSX from "xlsx";

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

/**
 * Fills the Shademaster order form template with order data
 * and returns the filled workbook as a Buffer.
 *
 * Template must exist at: public/templates/shademaster-order.xls
 */
export function generateSupplierOrderXls(data: SupplierOrderData): Buffer {
  const templatePath = path.join(
    process.cwd(),
    "public/templates/shademaster-order.xls"
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      "Supplier order template not found at public/templates/shademaster-order.xls"
    );
  }

  const wb = XLSX.readFile(templatePath);
  const ws = wb.Sheets["ORDER FORM"];

  function setCell(addr: string, value: string | number) {
    if (!ws[addr]) ws[addr] = { t: typeof value === "number" ? "n" : "s" };
    ws[addr].v = value;
    ws[addr].t = typeof value === "number" ? "n" : "s";
  }

  // ── Header fields ──────────────────────────────────────────
  setCell("B2", data.customer_name);
  setCell("K2", data.order_number);
  setCell("B4", data.delivery_address.street);
  setCell("K4", data.order_date);
  setCell("B6", `${data.delivery_address.city}, ${data.delivery_address.province} ${data.delivery_address.postal_code}`);
  setCell("B8", data.customer_name);
  setCell("K8", "Blindly Online");
  setCell("B10", data.customer_phone);

  // ── Item rows (Excel rows 15–34, 0-indexed rows 14–33) ─────
  // Columns: B=NO, C=LOCATION, D=QTY, E=WIDTH, F=DROP,
  //          G=CTRL-L, H=CTRL-R, M=BLIND TYPE, N=RANGE,
  //          O=COLOUR, P=SLAT WIDTH
  data.items.forEach((item, i) => {
    if (i >= 20) return; // template only has 20 rows
    const row = 15 + i; // Excel row number
    const r = row - 1;  // 0-indexed

    const ec = (col: number) => XLSX.utils.encode_cell({ r, c: col });

    setCell(ec(1), i + 1);                                   // B: NO.
    setCell(ec(2), item.location_label ?? "");               // C: LOCATION
    setCell(ec(3), 1);                                       // D: QTY
    setCell(ec(4), item.matched_width_cm * 10);              // E: WIDTH mm
    setCell(ec(5), item.matched_drop_cm * 10);               // F: DROP mm
    setCell(ec(6), item.control_side === "left" ? "X" : ""); // G: CTRL L
    setCell(ec(7), item.control_side === "right" ? "X" : "");// H: CTRL R
    setCell(ec(12), item.type_name);                         // M: BLIND TYPE
    setCell(ec(13), item.range_name);                        // N: RANGE
    setCell(ec(14), item.colour);                            // O: COLOUR
    if (item.slat_size_mm) {
      setCell(ec(15), item.slat_size_mm);                    // P: SLAT WIDTH
    }
    // Note accessories in location field if any
    if (item.selected_extras && item.selected_extras.length > 0) {
      const extrasNote = item.selected_extras.map((e) => e.name).join(", ");
      const loc = item.location_label ? `${item.location_label} [${extrasNote}]` : `[${extrasNote}]`;
      setCell(ec(2), loc);
    }
  });

  return XLSX.write(wb, { type: "buffer", bookType: "xls" }) as Buffer;
}
