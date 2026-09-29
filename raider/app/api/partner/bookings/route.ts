import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";

export async function GET(req: NextRequest) {
    try {
        await connectDB()
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { message: "unauthorized" },
                { status: 401 }
            );
        }
        const bookings = await Booking.find({
            driver: session.user.id
        }).populate("user driver vehicle")
            .sort({ createdAt: -1 })

        return NextResponse.json(bookings, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get bookings error ${error}` }, { status: 500 })
    }

}