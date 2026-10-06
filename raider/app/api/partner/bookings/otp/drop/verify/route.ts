import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Booking from "@/models/booking.modal";
import { auth } from "@/app/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "partner") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        await connectDB();
        const { bookingId, otp } = await req.json();
        const booking = await Booking.findOne({
            _id: bookingId,
            driver: session.user.id,
            bookingStatus: "started",
            paymentStatus: { $in: ["paid", "cash"] },
        });
        if (!booking) {
            return NextResponse.json(
                { message: "paid ride not found" },
                { status: 404 },
            )
        }
        if (!booking.dropOtp) {
            return NextResponse.json(
                { message: "drop otp not generated" },
                { status: 400 }
            )
        }
        if (booking.dropOtp != otp) {
            return NextResponse.json(
                { message: "otp not match" },
                { status: 400 }
            )
        }

        if (!booking.dropOtpExpires || booking.dropOtpExpires < new Date()) {
            return NextResponse.json(
                { message: "otp expired" },
                { status: 400 }
            )
        }

        booking.bookingStatus = "completed";
        booking.dropOtp = "";
        booking.dropOtpExpires = undefined;
        await booking.save();

        return NextResponse.json({ message: "drop otp verified" }, { status: 200 })

    } catch (error) {
        console.error("Drop OTP verification failed:", error);
        return NextResponse.json({ message: "drop verify otp Error" }, { status: 500 })
    }
}