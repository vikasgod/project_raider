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
        const { bookingId } = await req.json();
        const booking = await Booking.findOne({
            _id: bookingId,
            driver: session.user.id,
            bookingStatus: "confirmed",
        }).populate("user");
        if (!booking) {
            return NextResponse.json(
                { message: "confirmed ride not found" },
                { status: 404 },
            )
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        booking.pickUpOtp = otp;
        booking.pickUpOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await booking.save();
        if (booking.user.email) {
            await sendMail(booking.user.email, "Your Pickup OTP -Raider",
                `<div style="font-family:sans-serif;padding:20px">
                <h2>Ride OTP</h2>
                <p>Your OTP for pickup is <strong>${otp}</strong></p>
                <p>This OTP will expire in 5 minutes</p>
                <p>Share this otp with your driver to start the ride</p>
                <br />
                <b>RAIDER</b>
                </div>
           ` );

        }

        return NextResponse.json({ message: "Pickup OTP sent successfully" }, { status: 200 })

    } catch (error) {
        console.error("Pickup OTP send failed:", error);
        return NextResponse.json({ message: "Pickup otp Error" }, { status: 500 })
    }
}