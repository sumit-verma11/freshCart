import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Pincode from "@/models/Pincode";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/pincode/check?pincode=400001 — check if a pincode is serviceable */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get("pincode");

  if (!pincode) return fail("pincode query param is required", 400);
  if (!/^\d{6}$/.test(pincode)) return fail("Pincode must be exactly 6 digits", 400);

  try {
    await connectDB();

    const doc = await Pincode.findOne({ pincode }).lean();

    if (!doc) {
      return ok({ serviceable: false, pincode });
    }

    return ok({
      serviceable: doc.isServiceable,
      pincode:     doc.pincode,
      area:        doc.area,
      city:        doc.city,
      state:       doc.state,
      estimatedDelivery: doc.isServiceable ? doc.estimatedDeliveryHours : undefined,
    });
  } catch (error) {
    console.error("[PINCODE CHECK]", error);
    return fail("Internal server error", 500);
  }
}
