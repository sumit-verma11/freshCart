import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { ok, fail, requireAdmin, zodFail } from "@/lib/api";
import { updateOrderStatusSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Params = { params: { id: string } };

/** PUT /api/orders/[id]/status — admin updates an order's status */
export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = params;
  if (!id.match(/^[a-f\d]{24}$/i)) return fail("Invalid order ID", 400);

  try {
    await connectDB();

    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error as ZodError);

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status: parsed.data.status } },
      { new: true, runValidators: true }
    ).lean();

    if (!order) return fail("Order not found", 404);
    return ok(order);
  } catch (error) {
    console.error("[ORDER STATUS PUT]", error);
    return fail("Internal server error", 500);
  }
}
