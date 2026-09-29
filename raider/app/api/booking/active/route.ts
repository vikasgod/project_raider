import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { auth } from "@/app/auth"
import User from "@/models/user.model";
import Booking from "@/models/booking.modal";
export async function GET(req: NextRequest) {
    try {
        await connectDB()
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { bookings: null },
            );
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ message: "user not found" }, { status: 400 });
        }
        const booking = await Booking.findOne({
            user: user._id,
            bookingStatus: {
                $in: ["requested", "awaiting_payment", "confirmed", "started"]
            }
        })
        if (!booking) {
            return NextResponse.json(
                { booking: "idle" }
            )
        }
        return NextResponse.json({booking}, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get active bookings error ${error}` }, { status: 500 })
    }
}