import { google } from "googleapis";

export async function syncProductsToSheets(products: Record<string, unknown>[]) {
  if (!process.env.GOOGLE_SHEETS_API_KEY || !process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    console.log("Google Sheets not configured");
    return;
  }
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: "", private_key: "" },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const values = [
      ["ID", "Barcode", "Name", "Category", "Price", "Cost", "Quantity", "Unit"],
      ...products.map((p) => [p.id, p.barcode, p.name, p.category, p.price, p.cost, p.quantity, p.unit]),
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: "Products!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });
  } catch (err) {
    console.error("Error syncing products to sheets:", err);
  }
}

export async function syncSalesToSheets(sales: Record<string, unknown>[]) {
  if (!process.env.GOOGLE_SHEETS_API_KEY || !process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    console.log("Google Sheets not configured");
    return;
  }
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: "", private_key: "" },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const values = [
      ["ID", "Clerk", "Member", "Total", "Discount", "Payment", "Status", "Date"],
      ...sales.map((s) => [s.id, s.clerkId, s.memberId, s.total, s.discount, s.paymentMethod, s.status, s.createdAt]),
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: "Sales!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });
  } catch (err) {
    console.error("Error syncing sales to sheets:", err);
  }
}
