import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, createUser } from "@/lib/store";
import { hashPassword, createToken, getTokenCookieOptions } from "@/lib/auth";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = parsed.data;

    // Check if user already exists
    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = createUser({ firstName, lastName, email, passwordHash });

    // Create JWT token
    const token = await createToken(user);

    // Set cookie and return user
    const response = NextResponse.json(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );

    response.cookies.set(getTokenCookieOptions(token));
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
