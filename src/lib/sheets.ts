import { google } from "googleapis";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function isSheetsConfigured() {
  return (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  );
}

export async function syncProductsToSheets(products: Record<string, unknown>[]) {
  if (!isSheetsConfigured()) {
    console.log("Google Sheets not configured");
    return;
  }
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
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
  if (!isSheetsConfigured()) {
    console.log("Google Sheets not configured");
    return;
  }
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
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
