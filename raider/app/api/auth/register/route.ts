import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { sendMail } from "@/lib/sendMail";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body?.name?.toString().trim();
    const email = body?.email?.toString().trim().toLowerCase();
    const password = body?.password?.toString();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 },
      );
    }

    await connectDB();
    let user = await User.findOne({ email });
    if (user && user.isEmailVerified) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 },
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user && !user.isEmailVerified) {
      user.name = name;
      user.password = hashedPassword;
      user.email = email;
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpiresAt,
      });
    }

    await sendMail(
      email,
      "Your OTP for Email Verification",
      `<h2>Your Email Verification OTP is <strong>${otp}</strong></h2>`,
    );

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error during registration:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        message: message.includes("MongoDB")
          ? message
          : "Internal Server Error",
      },
      { status: 503 },
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    let users = await User.find();
    return NextResponse.json({
      data: users,
      success: true,
      message: "MongoDB Connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
