/**
 * Generates a styled Shademaster-compatible order form as Excel XML (SpreadsheetML).
 * Zero external dependencies — produces XML that Excel, LibreOffice, and Google Sheets
 * all open natively with full styling (colours, borders, fonts, merged cells).
 */

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

// ── Colours (Excel XML uses #RRGGBB) ─────────────────────────────────────────
const DARK = "#1A1A2E";
const MID = "#2D4A7A";
const LIGHT = "#D6E4F7";
const ALT = "#F0F6FF";
const ACCENT = "#C4663A";
const GREY = "#F5F5F5";
const BORDER = "#AACAEE";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cell(
  value: string | number,
  styleId: string,
  opts?: { mergeAcross?: number; type?: "Number" | "String" }
): string {
  const type = opts?.type ?? (typeof value === "number" ? "Number" : "String");
  const merge = opts?.mergeAcross ? ` ss:MergeAcross="${opts.mergeAcross}"` : "";
  return `<Cell ss:StyleID="${styleId}"${merge}><Data ss:Type="${type}">${esc(String(value))}</Data></Cell>`;
}

function emptyCell(styleId: string, mergeAcross?: number): string {
  const merge = mergeAcross ? ` ss:MergeAcross="${mergeAcross}"` : "";
  return `<Cell ss:StyleID="${styleId}"${merge}/>`;
}

export function generateSupplierOrderXls(data: SupplierOrderData): Buffer {
  const addr = data.delivery_address;
  const items = data.items;

  // Build item rows
  const itemRows = items
    .map((item, i) => {
      let location = item.location_label ?? "";
      if (item.selected_extras && item.selected_extras.length > 0) {
        const extras = item.selected_extras.map((e) => e.name).join(", ");
        location = location ? `${location} [${extras}]` : `[${extras}]`;
      }
      const bg = i % 2 === 0 ? "Alt" : "White";
      const bgB = i % 2 === 0 ? "AltBold" : "WhiteBold";
      const bgL = i % 2 === 0 ? "AltLeft" : "WhiteLeft";
      return `<Row ss:AutoFitHeight="0" ss:Height="18">
       ${emptyCell(`Row${bg}`)}
       ${cell(i + 1, `Row${bgB}`)}
       ${cell(location, `Row${bgL}`)}
       ${cell(1, `Row${bg}`)}
       ${cell(item.matched_width_cm * 10, `Row${bg}`)}
       ${cell(item.matched_drop_cm * 10, `Row${bg}`)}
       ${cell(item.control_side === "left" ? "X" : "", `Row${bg}`)}
       ${cell(item.control_side === "right" ? "X" : "", `Row${bg}`)}
       ${cell(item.mount_type === "inside" ? "Inside" : "Outside", `Row${bg}`)}
       ${cell(item.type_name, `Row${bgL}`)}
       ${cell(item.range_name, `Row${bgL}`)}
       ${cell(item.colour, `Row${bgL}`)}
       ${cell(item.slat_size_mm ?? "", `Row${bg}`)}
      </Row>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">

 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Blindly Online</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>

 <Styles>
  <!-- Title bar: white on dark navy, 14pt bold, centered -->
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="${DARK}" ss:Pattern="Solid"/>
  </Style>

  <!-- Info rows: 9pt on grey bg -->
  <Style ss:ID="Info">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9"/>
   <Interior ss:Color="${GREY}" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="InfoBold">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1"/>
   <Interior ss:Color="${GREY}" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="InfoAccent">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="${ACCENT}"/>
   <Interior ss:Color="${GREY}" ss:Pattern="Solid"/>
  </Style>

  <!-- Column headers: white on mid-blue -->
  <Style ss:ID="ColHdr">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="${MID}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>

  <!-- Sub-header row: dark blue text on ice-blue -->
  <Style ss:ID="SubHdr">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="8" ss:Bold="1" ss:Color="#1A3A6B"/>
   <Interior ss:Color="${LIGHT}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>

  <!-- Data rows: alternating white / light blue -->
  <Style ss:ID="RowAlt">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9"/>
   <Interior ss:Color="${ALT}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>
  <Style ss:ID="RowAltBold">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1"/>
   <Interior ss:Color="${ALT}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>
  <Style ss:ID="RowAltLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9"/>
   <Interior ss:Color="${ALT}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>

  <Style ss:ID="RowWhite">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>
  <Style ss:ID="RowWhiteBold">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>
  <Style ss:ID="RowWhiteLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>

  <!-- Additional info section header -->
  <Style ss:ID="AddHdr">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="${MID}" ss:Pattern="Solid"/>
  </Style>

  <!-- Additional info body -->
  <Style ss:ID="AddBody">
   <Interior ss:Color="${GREY}" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${BORDER}"/>
   </Borders>
  </Style>

  <Style ss:ID="Default">
   <Font ss:FontName="Arial" ss:Size="9"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="ORDER FORM">
  <Table ss:DefaultRowHeight="15">
   <!-- Column widths (in points, ~7.5 per Excel unit) -->
   <Column ss:Width="15"/>  <!-- A: spacer -->
   <Column ss:Width="38"/>  <!-- B: NO -->
   <Column ss:Width="180"/> <!-- C: LOCATION -->
   <Column ss:Width="38"/>  <!-- D: QTY -->
   <Column ss:Width="68"/>  <!-- E: WIDTH -->
   <Column ss:Width="68"/>  <!-- F: DROP -->
   <Column ss:Width="53"/>  <!-- G: CTRL L -->
   <Column ss:Width="53"/>  <!-- H: CTRL R -->
   <Column ss:Width="90"/>  <!-- I: MOUNT -->
   <Column ss:Width="135"/> <!-- J: BLIND TYPE -->
   <Column ss:Width="165"/> <!-- K: RANGE -->
   <Column ss:Width="135"/> <!-- L: COLOUR -->
   <Column ss:Width="75"/>  <!-- M: SLAT -->

   <!-- Row 1: Title bar -->
   <Row ss:AutoFitHeight="0" ss:Height="32">
    ${cell("SHADEMASTER ORDER FORM", "Title", { mergeAcross: 12 })}
   </Row>

   <!-- Row 2: Customer | Order No -->
   <Row ss:AutoFitHeight="0" ss:Height="20">
    ${emptyCell("Info")}
    ${cell(`CUSTOMER: ${data.customer_name}`, "InfoBold", { mergeAcross: 6 })}
    ${cell(`ORDER NO: ${data.order_number}`, "InfoAccent", { mergeAcross: 4 })}
   </Row>

   <!-- Row 3: Address | Date -->
   <Row ss:AutoFitHeight="0" ss:Height="18">
    ${emptyCell("Info")}
    ${cell(`ADDRESS: ${addr.street}`, "Info", { mergeAcross: 6 })}
    ${cell(`DATE: ${data.order_date}`, "Info", { mergeAcross: 4 })}
   </Row>

   <!-- Row 4: City | Dealer -->
   <Row ss:AutoFitHeight="0" ss:Height="18">
    ${emptyCell("Info")}
    ${cell(`CITY: ${addr.city}, ${addr.province} ${addr.postal_code}`, "Info", { mergeAcross: 6 })}
    ${cell("DEALER: Blindly Online", "Info", { mergeAcross: 4 })}
   </Row>

   <!-- Row 5: Contact | Consultant -->
   <Row ss:AutoFitHeight="0" ss:Height="18">
    ${emptyCell("Info")}
    ${cell(`CONTACT: ${data.customer_name}`, "Info", { mergeAcross: 6 })}
    ${cell("CONSULTANT: Blindly Online", "Info", { mergeAcross: 4 })}
   </Row>

   <!-- Row 6: Phone -->
   <Row ss:AutoFitHeight="0" ss:Height="18">
    ${emptyCell("Info")}
    ${cell(`PHONE: ${data.customer_phone}`, "Info", { mergeAcross: 11 })}
   </Row>

   <!-- Row 7: Spacer -->
   <Row ss:AutoFitHeight="0" ss:Height="6"/>

   <!-- Row 8: Column headers -->
   <Row ss:AutoFitHeight="0" ss:Height="22">
    ${emptyCell("ColHdr")}
    ${cell("NO.", "ColHdr")}
    ${cell("LOCATION", "ColHdr")}
    ${cell("QTY", "ColHdr")}
    ${cell("WIDTH", "ColHdr")}
    ${cell("DROP", "ColHdr")}
    ${cell("CONTROLS", "ColHdr", { mergeAcross: 1 })}
    ${cell("MOUNT", "ColHdr")}
    ${cell("BLIND TYPE", "ColHdr")}
    ${cell("RANGE", "ColHdr")}
    ${cell("COLOUR", "ColHdr")}
    ${cell("SLAT", "ColHdr")}
   </Row>

   <!-- Row 9: Sub-headers -->
   <Row ss:AutoFitHeight="0" ss:Height="18">
    ${emptyCell("SubHdr")}
    ${emptyCell("SubHdr")}
    ${emptyCell("SubHdr")}
    ${emptyCell("SubHdr")}
    ${cell("mm", "SubHdr")}
    ${cell("mm", "SubHdr")}
    ${cell("L", "SubHdr")}
    ${cell("R", "SubHdr")}
    ${emptyCell("SubHdr")}
    ${emptyCell("SubHdr")}
    ${emptyCell("SubHdr")}
    ${emptyCell("SubHdr")}
    ${emptyCell("SubHdr")}
   </Row>

   <!-- Data rows -->
   ${itemRows}

   <!-- Spacer row -->
   <Row ss:AutoFitHeight="0" ss:Height="6"/>

   <!-- Additional Information header -->
   <Row ss:AutoFitHeight="0" ss:Height="20">
    ${emptyCell("AddHdr")}
    ${cell("ADDITIONAL INFORMATION", "AddHdr", { mergeAcross: 11 })}
   </Row>

   <!-- Additional Information body -->
   <Row ss:AutoFitHeight="0" ss:Height="50">
    ${emptyCell("AddBody")}
    ${emptyCell("AddBody", 11)}
   </Row>
  </Table>

  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
    <PageMargins x:Bottom="0.5" x:Left="0.5" x:Right="0.5" x:Top="0.5"/>
   </PageSetup>
   <FitToPage/>
   <DoNotDisplayGridlines/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
   </Print>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  return Buffer.from(xml, "utf-8");
}
