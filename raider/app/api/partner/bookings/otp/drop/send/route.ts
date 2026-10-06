import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Booking from "@/models/booking.modal";
import { sendMail } from "@/lib/sendMail";
import { auth } from "@/app/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "partner") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        await connectDB();
        const { bookingId, resend = false } = await req.json();
        const booking = await Booking.findOne({
            _id: bookingId,
            driver: session.user.id,
            bookingStatus: "started",
            paymentStatus: { $in: ["paid", "cash"] },
        }).populate("user");
        if (!booking) {
            return NextResponse.json(
                { message: "ride must be paid before sending the drop OTP" },
                { status: 400 },
            )
        }
        if (
            !resend &&
            booking.dropOtp &&
            booking.dropOtpExpires &&
            booking.dropOtpExpires > new Date()
        ) {
            return NextResponse.json(
                { message: "Drop OTP is already active" },
                { status: 200 },
            );
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        booking.dropOtp = otp;
        booking.dropOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await booking.save();

        if (booking.user.email) {
            await sendMail(booking.user.email, "Your Drop OTP -Raider",
                `<div style="font-family:sans-serif;padding:20px">
                <h2>Ride OTP</h2>
                <p>Fare paid: <strong>₹${booking.fare.toFixed(2)}</strong></p>
                <p>Your OTP for Drop is <strong>${otp}</strong></p>
                <p>This OTP will expire in 5 minutes</p>
                <p>Share this OTP with your driver to complete the ride</p>
                <br />
                <b>RAIDER</b>
                </div>
           ` );

        }

        return NextResponse.json({ message: "Drop OTP sent successfully" }, { status: 200 })

    } catch (error) {
        console.error("Drop OTP send failed:", error);
        return NextResponse.json({ message: "Drop otp Error" }, { status: 500 })
    }
}