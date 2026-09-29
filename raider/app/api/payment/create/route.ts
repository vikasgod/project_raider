import connectDB from "@/lib/db";
import razorpay from "@/lib/razorpay";
import Booking from "@/models/booking.modal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB()
        const { bookingId } = await req.json()
        const booking = await Booking.findById(bookingId)

        if (!booking) {
            return NextResponse.json(
                { message: "booking not found" },
                { status: 400 }
            )
        }
        const order = await razorpay.orders.create({
            amount: booking.fare * 100,
            currency: "INR",
            receipt: `Booking #${booking._id.toString()}`
        })

        booking.bookingStatus = "awaiting_payment"
        await booking.save()

        return NextResponse.json(
            { orderId: order.id, amount: order.amount },
            { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `create booking error ${error}` }, { status: 500 })
    }
}