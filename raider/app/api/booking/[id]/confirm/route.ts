import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB()

        const bookingId = (await context.params).id
        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "booking not found invalid" },
                { status: 400 }
            );
        }

        booking.paymentStatus = "cash"
        booking.bookingStatus = "confirmed"
        await booking.save()

        return NextResponse.json(
            { success: true, message: "booking confirmed" },
            { status: 200 }
        )


    } catch (error) {
        return NextResponse.json({ message: `confirm booking error ${error}` }, { status: 500 })
    }
}
