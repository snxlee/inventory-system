import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["admin", "manager"].includes(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    const rows: Record<string, unknown>[] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, index) => {
      if (index === 1) {
        headers = (row.values as (string | undefined)[]).slice(1).map((h) => String(h || "").toLowerCase().trim());
      } else {
        const values = (row.values as unknown[]).slice(1);
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => { obj[h] = values[i]; });
        rows.push(obj);
      }
    });

    let imported = 0;
    if (type === "products") {
      for (const row of rows) {
        try {
          await db.product.upsert({
            where: { barcode: String(row.barcode || "") },
            update: {
              name: String(row.name || ""),
              category: String(row.category || "General"),
              price: parseFloat(String(row.price || "0")),
              cost: parseFloat(String(row.cost || "0")),
              quantity: parseInt(String(row.quantity || "0")),
              unit: String(row.unit || "pcs"),
            },
            create: {
              barcode: String(row.barcode || ""),
              name: String(row.name || ""),
              category: String(row.category || "General"),
              price: parseFloat(String(row.price || "0")),
              cost: parseFloat(String(row.cost || "0")),
              quantity: parseInt(String(row.quantity || "0")),
              unit: String(row.unit || "pcs"),
            },
          });
          imported++;
        } catch { /* skip invalid rows */ }
      }
    } else if (type === "members") {
      for (const row of rows) {
        try {
          await db.member.upsert({
            where: { memberId: String(row.memberid || row["member id"] || "") },
            update: {
              name: String(row.name || ""),
              email: String(row.email || ""),
              phone: String(row.phone || ""),
              address: String(row.address || ""),
            },
            create: {
              memberId: String(row.memberid || row["member id"] || ""),
              name: String(row.name || ""),
              email: String(row.email || ""),
              phone: String(row.phone || ""),
              address: String(row.address || ""),
            },
          });
          imported++;
        } catch { /* skip invalid rows */ }
      }
    }

    return Response.json({ success: true, imported });
  } catch {
    return Response.json({ error: "Import failed" }, { status: 500 });
  }
}
