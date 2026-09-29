import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        const partner = await User.findOne({ email: session.user.email });
        if (!partner) {
            return NextResponse.json({ message: "partner not found" }, { status: 400 });
        }
      
        const bookings = await Booking.find({
            driver: partner._id,
            bookingStatus: "requested"
        })
        return NextResponse.json(bookings, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get pending bookings error ${error}` }, { status: 500 })
    }
}