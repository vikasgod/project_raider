import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import Booking from "@/models/booking.modal";
import "@/models/vehicle.model";

export async function POST(req: NextRequest) {
    try {
        await connectDB()
        const session = await auth()
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { message: "unauthorized" },
                { status: 400 }
            )
        }

        const { bookingId } = await req.json()

        const booking = await Booking.findById(bookingId).populate("user vehicle driver")

        return NextResponse.json(booking, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get active ride for user error ${error}` }, { status: 500 })
    }
} 