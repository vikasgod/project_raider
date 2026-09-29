import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import Booking from "@/models/booking.modal";
import "@/models/vehicle.model";

export async function GET(req: NextRequest) {
    try {
        await connectDB()
        const session = await auth()
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { message: "unauthorized" },
                { status: 400 }
            )
        }
        const user = await User.findOne({ email: session.user.email })
        const booking = await Booking.findOne({
            driver: user._id,
            bookingStatus: { $in: ["confirmed", "started"] }
        }).populate("user vehicle driver")

        return NextResponse.json(booking, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get active ride error ${error}` }, { status: 500 })
    }
} 