"use client";
import { useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import MemberSearch from "@/components/MemberSearch";
import StatCard from "@/components/StatCard";

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  unit: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Member {
  id: string;
  memberId: string;
  name: string;
  phone?: string;
}

interface Sale {
  id: string;
  total: number;
  createdAt: string;
  items: { product: { name: string }; quantity: number; price: number }[];
}

interface POSClientProps {
  todaySales: number;
  todayRevenue: number;
  lowStockCount: number;
  recentSales: Sale[];
}

export default function POSClient({
  todaySales,
  todayRevenue,
  lowStockCount,
  recentSales,
}: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [sales, setSales] = useState<Sale[]>(recentSales);

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
      if (!res.ok) { setMessage(`Product not found: ${barcode}`); return; }
      const product = await res.json() as Product;
      addToCart(product);
    } catch {
      setMessage("Error looking up product");
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setMessage("");
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) { setMessage("Cart is empty"); return; }
    setProcessing(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            price: i.product.price,
          })),
          memberId: selectedMember?.id,
          discount,
          paymentMethod,
        }),
      });
      if (!res.ok) throw new Error("Checkout failed");
      const sale = await res.json() as Sale;
      setMessage(`✅ Sale completed! Total: ₱${total.toFixed(2)}`);
      setCart([]);
      setSelectedMember(null);
      setDiscount(0);
      setSales((prev) => [sale, ...prev.slice(0, 9)]);
    } catch {
      setMessage("Checkout failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Point of Sale</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Today&apos;s Sales" value={todaySales} icon="🛒" color="blue" />
        <StatCard title="Today&apos;s Revenue" value={`₱${todayRevenue.toFixed(2)}`} icon="💰" color="green" />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          icon="⚠️"
          color={lowStockCount > 0 ? "red" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POS Interface */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Scan Product</h2>
            <BarcodeScanner onScan={handleBarcodeScan} />
            {message && (
              <p className={`mt-2 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Cart ({cart.length} items)</h2>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Cart is empty</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        ₱{item.product.price.toFixed(2)} / {item.product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 text-sm hover:bg-gray-100 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 text-sm hover:bg-gray-100 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-20 text-right">
                      ₱{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => updateQty(item.product.id, 0)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Discount</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>₱{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checkout Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Member</h2>
            <MemberSearch onSelect={setSelectedMember} selected={selectedMember} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Payment</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["cash", "gcash", "credit", "check"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    paymentMethod === method
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing || cart.length === 0}
              className="w-full bg-green-600 text-white rounded-lg py-3 font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {processing ? "Processing..." : `Checkout ₱${total.toFixed(2)}`}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Recent Sales</h2>
            <div className="space-y-2">
              {sales.slice(0, 5).map((sale, i) => (
                <div
                  key={sale.id || i}
                  className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-1 last:border-0"
                >
                  <span>{new Date(sale.createdAt).toLocaleTimeString()}</span>
                  <span className="font-semibold">₱{sale.total.toFixed(2)}</span>
                </div>
              ))}
              {sales.length === 0 && (
                <p className="text-gray-400 text-xs text-center py-2">No sales today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
