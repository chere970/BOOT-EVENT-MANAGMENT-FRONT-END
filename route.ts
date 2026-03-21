import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (email === "user@example.com" && password === "password") {
    const token = "fake-jwt-token";
    return NextResponse.json({ token, user: { email } });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
