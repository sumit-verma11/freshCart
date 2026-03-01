import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { ok, fail, zodFail } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error as ZodError);

    const { name, email, password, phone } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return fail("An account with this email already exists", 409);

    // passwordHash field — pre-save hook in User model hashes it automatically
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      phone,
      role: "user",
    });

    return ok({ id: user._id, name: user.name, email: user.email }, 201);
  } catch (error) {
    console.error("[REGISTER]", error);
    return fail("Internal server error", 500);
  }
}
