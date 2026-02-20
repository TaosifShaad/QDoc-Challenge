import { NextResponse } from "next/server";
import { getClearCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set(getClearCookieOptions());
  return response;
}
