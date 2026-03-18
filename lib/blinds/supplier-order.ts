import * as XLSX from "xlsx";

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
 * Generates a Shademaster-style order form XLS from scratch.
 * No template file needed — works on any platform including Vercel serverless.
 */
export function generateSupplierOrderXls(data: SupplierOrderData): Buffer {
  const wb = XLSX.utils.book_new();

  // Build rows as array-of-arrays
  const rows: (string | number)[][] = [];
  const addr = data.delivery_address;

  // ── Header section ──────────────────────────────────────────
  // Row 1: Title
  rows.push(["", "SHADEMASTER ORDER FORM"]);
  // Row 2: Customer / Order number
  rows.push(["", `Customer: ${data.customer_name}`, "", "", "", "", "", "", "", "", `Order: ${data.order_number}`]);
  // Row 3: blank
  rows.push([]);
  // Row 4: Address / Date
  rows.push(["", `Address: ${addr.street}`, "", "", "", "", "", "", "", "", `Date: ${data.order_date}`]);
  // Row 5: blank
  rows.push([]);
  // Row 6: City
  rows.push(["", `City: ${addr.city}, ${addr.province} ${addr.postal_code}`]);
  // Row 7: blank
  rows.push([]);
  // Row 8: Contact / Dealer
  rows.push(["", `Contact: ${data.customer_name}`, "", "", "", "", "", "", "", "", "Dealer: Blindly Online"]);
  // Row 9: blank
  rows.push([]);
  // Row 10: Phone
  rows.push(["", `Phone: ${data.customer_phone}`]);
  // Row 11-12: blank
  rows.push([]);
  rows.push([]);

  // Row 13: Column headers
  rows.push([
    "",        // A
    "NO.",     // B
    "LOCATION",// C
    "QTY",     // D
    "WIDTH",   // E
    "DROP",    // F
    "CTRL-L",  // G
    "CTRL-R",  // H
    "MOUNT",   // I
    "",        // J
    "",        // K
    "",        // L
    "BLIND TYPE", // M
    "RANGE",   // N
    "COLOUR",  // O
    "SLAT (mm)", // P
  ]);

  // Row 14: blank separator
  rows.push([]);

  // ── Item rows ───────────────────────────────────────────────
  data.items.forEach((item, i) => {
    let location = item.location_label ?? "";
    if (item.selected_extras && item.selected_extras.length > 0) {
      const extrasNote = item.selected_extras.map((e) => e.name).join(", ");
      location = location ? `${location} [${extrasNote}]` : `[${extrasNote}]`;
    }

    rows.push([
      "",                                                // A
      i + 1,                                             // B: NO.
      location,                                          // C: LOCATION
      1,                                                 // D: QTY
      item.matched_width_cm * 10,                        // E: WIDTH mm
      item.matched_drop_cm * 10,                         // F: DROP mm
      item.control_side === "left" ? "X" : "",           // G: CTRL-L
      item.control_side === "right" ? "X" : "",          // H: CTRL-R
      item.mount_type === "inside" ? "Inside" : "Outside", // I: MOUNT
      "",                                                // J
      "",                                                // K
      "",                                                // L
      item.type_name,                                    // M: BLIND TYPE
      item.range_name,                                   // N: RANGE
      item.colour,                                       // O: COLOUR
      item.slat_size_mm ?? "",                           // P: SLAT WIDTH
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability
  ws["!cols"] = [
    { wch: 2 },   // A
    { wch: 5 },   // B: NO.
    { wch: 22 },  // C: LOCATION
    { wch: 5 },   // D: QTY
    { wch: 8 },   // E: WIDTH
    { wch: 8 },   // F: DROP
    { wch: 7 },   // G: CTRL-L
    { wch: 7 },   // H: CTRL-R
    { wch: 9 },   // I: MOUNT
    { wch: 3 },   // J
    { wch: 18 },  // K
    { wch: 3 },   // L
    { wch: 16 },  // M: BLIND TYPE
    { wch: 18 },  // N: RANGE
    { wch: 16 },  // O: COLOUR
    { wch: 10 },  // P: SLAT
  ];

  XLSX.utils.book_append_sheet(wb, ws, "ORDER FORM");

  const output = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(output);
}
