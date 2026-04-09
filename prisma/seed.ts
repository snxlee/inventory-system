import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminHash = await bcrypt.hash("admin123", 10);
  const managerHash = await bcrypt.hash("manager123", 10);
  const auditorHash = await bcrypt.hash("auditor123", 10);
  const clerkHash = await bcrypt.hash("clerk123", 10);

  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@coop.com", passwordHash: adminHash, role: "admin" },
  });
  const manager = await prisma.user.create({
    data: { name: "Manager User", email: "manager@coop.com", passwordHash: managerHash, role: "manager" },
  });
  const auditor = await prisma.user.create({
    data: { name: "Auditor User", email: "auditor@coop.com", passwordHash: auditorHash, role: "auditor" },
  });
  const clerk = await prisma.user.create({
    data: { name: "Clerk User", email: "clerk@coop.com", passwordHash: clerkHash, role: "clerk" },
  });

  // Create 20 products
  const products = await Promise.all([
    prisma.product.create({ data: { barcode: "8901234567890", name: "Rice (5kg)", category: "Grains", price: 280, cost: 220, quantity: 150, minQuantity: 20, unit: "bag" } }),
    prisma.product.create({ data: { barcode: "8901234567891", name: "Cooking Oil (1L)", category: "Oils", price: 85, cost: 65, quantity: 200, minQuantity: 30, unit: "bottle" } }),
    prisma.product.create({ data: { barcode: "8901234567892", name: "Sugar (1kg)", category: "Condiments", price: 60, cost: 45, quantity: 180, minQuantity: 25, unit: "pack" } }),
    prisma.product.create({ data: { barcode: "8901234567893", name: "Salt (500g)", category: "Condiments", price: 20, cost: 12, quantity: 300, minQuantity: 50, unit: "pack" } }),
    prisma.product.create({ data: { barcode: "8901234567894", name: "Canned Sardines", category: "Canned Goods", price: 35, cost: 25, quantity: 400, minQuantity: 50, unit: "can" } }),
    prisma.product.create({ data: { barcode: "8901234567895", name: "Instant Noodles", category: "Noodles", price: 15, cost: 10, quantity: 500, minQuantity: 100, unit: "pack" } }),
    prisma.product.create({ data: { barcode: "8901234567896", name: "Coffee (100g)", category: "Beverages", price: 75, cost: 55, quantity: 120, minQuantity: 20, unit: "pack" } }),
    prisma.product.create({ data: { barcode: "8901234567897", name: "Laundry Soap", category: "Household", price: 25, cost: 18, quantity: 250, minQuantity: 40, unit: "bar" } }),
    prisma.product.create({ data: { barcode: "8901234567898", name: "Dishwashing Liquid", category: "Household", price: 45, cost: 32, quantity: 100, minQuantity: 15, unit: "bottle" } }),
    prisma.product.create({ data: { barcode: "8901234567899", name: "Shampoo (180ml)", category: "Personal Care", price: 55, cost: 40, quantity: 80, minQuantity: 10, unit: "bottle" } }),
    prisma.product.create({ data: { barcode: "8901234567900", name: "Toothpaste (75g)", category: "Personal Care", price: 40, cost: 28, quantity: 90, minQuantity: 15, unit: "tube" } }),
    prisma.product.create({ data: { barcode: "8901234567901", name: "Canned Tuna", category: "Canned Goods", price: 42, cost: 30, quantity: 350, minQuantity: 50, unit: "can" } }),
    prisma.product.create({ data: { barcode: "8901234567902", name: "Vinegar (350ml)", category: "Condiments", price: 22, cost: 15, quantity: 200, minQuantity: 30, unit: "bottle" } }),
    prisma.product.create({ data: { barcode: "8901234567903", name: "Soy Sauce (200ml)", category: "Condiments", price: 18, cost: 12, quantity: 220, minQuantity: 30, unit: "bottle" } }),
    prisma.product.create({ data: { barcode: "8901234567904", name: "Eggs (12pcs)", category: "Fresh", price: 90, cost: 72, quantity: 60, minQuantity: 10, unit: "tray" } }),
    prisma.product.create({ data: { barcode: "8901234567905", name: "Bread (sliced)", category: "Bakery", price: 55, cost: 42, quantity: 40, minQuantity: 5, unit: "loaf" } }),
    prisma.product.create({ data: { barcode: "8901234567906", name: "Milk (1L)", category: "Dairy", price: 70, cost: 54, quantity: 75, minQuantity: 10, unit: "carton" } }),
    prisma.product.create({ data: { barcode: "8901234567907", name: "Butter (225g)", category: "Dairy", price: 85, cost: 65, quantity: 50, minQuantity: 8, unit: "pack" } }),
    prisma.product.create({ data: { barcode: "8901234567908", name: "Garlic (500g)", category: "Vegetables", price: 60, cost: 45, quantity: 30, minQuantity: 3, unit: "bag" } }),
    prisma.product.create({ data: { barcode: "8901234567909", name: "Onion (1kg)", category: "Vegetables", price: 55, cost: 40, quantity: 45, minQuantity: 5, unit: "bag" } }),
  ]);

  // Create 10 members
  const members = await Promise.all([
    prisma.member.create({ data: { memberId: "MEM-001", name: "Juan dela Cruz", email: "juan@email.com", phone: "09171234567", address: "123 Rizal St, Manila" } }),
    prisma.member.create({ data: { memberId: "MEM-002", name: "Maria Santos", email: "maria@email.com", phone: "09182345678", address: "456 Bonifacio Ave, Quezon City" } }),
    prisma.member.create({ data: { memberId: "MEM-003", name: "Pedro Reyes", email: "pedro@email.com", phone: "09193456789", address: "789 Mabini St, Makati" } }),
    prisma.member.create({ data: { memberId: "MEM-004", name: "Ana Garcia", email: "ana@email.com", phone: "09204567890", address: "321 Luna Blvd, Pasig" } }),
    prisma.member.create({ data: { memberId: "MEM-005", name: "Jose Mendoza", email: "jose@email.com", phone: "09215678901", address: "654 Magsaysay St, Mandaluyong" } }),
    prisma.member.create({ data: { memberId: "MEM-006", name: "Luz Castillo", email: "luz@email.com", phone: "09226789012", address: "987 Quezon Blvd, Caloocan" } }),
    prisma.member.create({ data: { memberId: "MEM-007", name: "Carlos Flores", email: "carlos@email.com", phone: "09237890123", address: "147 Commonwealth Ave, Quezon City" } }),
    prisma.member.create({ data: { memberId: "MEM-008", name: "Rosa Torres", email: "rosa@email.com", phone: "09248901234", address: "258 EDSA, Pasay" } }),
    prisma.member.create({ data: { memberId: "MEM-009", name: "Miguel Ramos", email: "miguel@email.com", phone: "09259012345", address: "369 Ayala Ave, Makati" } }),
    prisma.member.create({ data: { memberId: "MEM-010", name: "Elena Cruz", email: "elena@email.com", phone: "09260123456", address: "741 Ortigas Ave, Pasig" } }),
  ]);

  // Create 50+ sales over past 30 days
  const clerkId = clerk.id;
  const now = new Date();

  for (let day = 0; day < 30; day++) {
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - day);
    const salesPerDay = day === 0 ? 3 : Math.floor(Math.random() * 3) + 1;

    for (let s = 0; s < salesPerDay; s++) {
      const member = Math.random() > 0.4 ? members[Math.floor(Math.random() * members.length)] : null;
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [...products].sort(() => Math.random() - 0.5).slice(0, itemCount);

      let total = 0;
      const saleItems = selectedProducts.map((p) => {
        const qty = Math.floor(Math.random() * 3) + 1;
        const subtotal = p.price * qty;
        total += subtotal;
        return { productId: p.id, quantity: qty, price: p.price, subtotal };
      });
      const discount = Math.random() > 0.8 ? Math.floor(total * 0.05) : 0;

      await prisma.sale.create({
        data: {
          clerkId,
          memberId: member?.id,
          total: total - discount,
          discount,
          paymentMethod: Math.random() > 0.3 ? "cash" : "gcash",
          status: "completed",
          createdAt: saleDate,
          items: { create: saleItems },
        },
      });
    }
  }

  // Create inventory logs
  for (const product of products) {
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        type: "purchase",
        quantity: product.quantity,
        notes: "Initial stock",
        createdAt: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Create activity logs
  const actions = ["login", "create_product", "create_sale", "update_product", "view_report"];
  for (let i = 0; i < 20; i++) {
    await prisma.activityLog.create({
      data: {
        userId: [admin.id, manager.id, clerk.id, auditor.id][Math.floor(Math.random() * 4)],
        action: actions[Math.floor(Math.random() * actions.length)],
        details: "System activity",
        ipAddress: "127.0.0.1",
        createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
