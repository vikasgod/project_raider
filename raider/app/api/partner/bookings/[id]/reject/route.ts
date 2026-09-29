import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
import axios from "axios";
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }) {
    try {
        const id = (await context.params).id;
        await connectDB()

        const booking = await Booking.findById(id);
        if (!booking || booking.bookingStatus !== "requested") {
            return NextResponse.json(
                { message: "booking not found invalid" },
                { status: 400 }
            );
        }

        booking.bookingStatus = "rejected";
        await booking.save();

        await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/emit`, {
            event: "reject-booking",
            userId: booking.user.toString(),
            data: booking.bookingStatus
        })

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: `reject booking error ${error}` }, { status: 500 });
    }
}