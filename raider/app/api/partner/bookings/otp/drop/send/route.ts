import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Booking from "@/models/booking.modal";
import { sendMail } from "@/lib/sendMail";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { bookingId } = await req.json();
        const booking = await Booking.findById(bookingId).populate("user");
        if (!booking) {
            return NextResponse.json(
                { message: "Booking not found" },
                { status: 400 }
            )
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        booking.dropOtp = otp;
        booking.dropOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await booking.save();

        if (booking.user.email) {
            await sendMail(booking.user.email, "Your Drop OTP -Raider",
                `<div style="font-family:sans-serif;padding:20px">
                <h2>Ride OTP</h2>
                <p>Your OTP for Drop is <strong>${otp}</strong></p>
                <p>This OTP will expire in 5 minutes</p>
                <p>Share this otp with your driver to complete the ride</p>
                <br />
                <b>RAIDER</b>
                </div>
           ` );

        }

        return NextResponse.json({ message: "Drop OTP sent successfully" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: "Drop otp Error" }, { status: 500 })
    }
}