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
            bookingStatus: "confirmed",
        });
        if (!booking) {
            return NextResponse.json(
                { message: "confirmed ride not found" },
                { status: 404 },
            )
        }
        if (!booking.pickUpOtp) {
            return NextResponse.json(
                { message: "pickup otp not generated" },
                { status: 400 }
            )
        }
        if (booking.pickUpOtp != otp) {
            return NextResponse.json(
                { message: "otp not match" },
                { status: 400 }
            )
        }

        if (!booking.pickUpOtpExpires || booking.pickUpOtpExpires < new Date()) {
            return NextResponse.json(
                { message: "otp expired" },
                { status: 400 }
            )
        }

        booking.bookingStatus = "started";
        booking.pickUpOtp = "";
        booking.pickUpOtpExpires = undefined;
        await booking.save();

        return NextResponse.json({ message: "pickup otp verified" }, { status: 200 })

    } catch (error) {
        console.error("Pickup OTP verification failed:", error);
        return NextResponse.json({ message: "pickup verify otp Error" }, { status: 500 })
    }
}