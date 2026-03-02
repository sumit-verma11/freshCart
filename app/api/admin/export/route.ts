import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/api";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

// ── helpers ───────────────────────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(cells: unknown[]): string {
  return cells.map(escapeCSV).join(",");
}

// ── GET /api/admin/export?type=orders|products ─────────────────────────────
// Streams a CSV download for the requested report type.
// type=orders   → all non-cancelled orders, one row per order
// type=products → product performance (revenue, units sold, order count)

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const type = req.nextUrl.searchParams.get("type") ?? "orders";

  try {
    await connectDB();

    if (type === "products") {
      const rows = await Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id:        "$items.productId",
            name:       { $first: "$items.name" },
            revenue:    { $sum: { $multiply: ["$items.price", "$items.qty"] } },
            units:      { $sum: "$items.qty" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      const lines: string[] = [
        row(["Product ID", "Name", "Revenue (₹)", "Units Sold", "Order Count"]),
        ...rows.map((r) =>
          row([String(r._id), r.name, r.revenue, r.units, r.orderCount])
        ),
      ];

      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type":        "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="product-performance-${today()}.csv"`,
        },
      });
    }

    // Default: orders
    const orders = await Order.find({ status: { $ne: "cancelled" } })
      .sort({ placedAt: -1 })
      .lean();

    const lines: string[] = [
      row([
        "Order Number", "Status", "Placed At",
        "Grand Total (₹)", "Total Discount (₹)", "Items",
        "Customer ID",
        "Street", "City", "State", "Pincode",
      ]),
      ...orders.map((o) =>
        row([
          o.orderNumber,
          o.status,
          new Date(o.placedAt).toISOString(),
          o.grandTotal,
          o.totalDiscount ?? 0,
          o.items.map((i: { name: string; qty: number }) => `${i.name} ×${i.qty}`).join("; "),
          String(o.userId),
          o.deliveryAddress?.street ?? "",
          o.deliveryAddress?.city   ?? "",
          o.deliveryAddress?.state  ?? "",
          o.deliveryAddress?.pincode ?? "",
        ])
      ),
    ];

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${today()}.csv"`,
      },
    });
  } catch (err) {
    console.error("[EXPORT]", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
