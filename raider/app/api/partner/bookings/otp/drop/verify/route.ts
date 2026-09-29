import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Booking from "@/models/booking.modal";
import { sendMail } from "@/lib/sendMail";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { bookingId, otp } = await req.json();
        const booking = await Booking.findById(bookingId).populate("user");
        if (!booking) {
            return NextResponse.json(
                { message: "Booking not found" },
                { status: 400 }
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

        if (booking.dropOtpExpires < new Date()) {
            return NextResponse.json(
                { message: "otp expired" },
                { status: 400 }
            )
        }

        if (booking.paymentStatus === "cash") {
            const adminCommission = booking.fare * 0.10
            const partnerAmount = booking.fare - adminCommission
            booking.adminCommission = adminCommission
            booking.partnerAmount = partnerAmount
        }
        
        booking.paymentStatus = "paid"
        booking.bookingStatus = "completed";
        booking.dropOtp = "";
        booking.dropOtpExpires = undefined;
        await booking.save();

        return NextResponse.json({ message: "drop otp verified" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: "drop verify otp Error" }, { status: 500 })
    }
}