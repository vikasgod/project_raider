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

        if(booking.pickUpOtpExpires < new Date()){
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
        return NextResponse.json({ message: "pickup verify otp Error" }, { status: 500 })
    }
}