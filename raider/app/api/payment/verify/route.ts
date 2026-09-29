import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Booking from "@/models/booking.modal";

export async function POST(req: NextRequest) {
    try {
        await connectDB()
        const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature, } = await req.json()

        const hmac = crypto.createHmac('sha256', process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET!)
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id)
        const generated_signature = hmac.digest('hex')

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json(
                { success: false, message: "signature mismatch" },
                { status: 400 },
            )
        }

        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "booking not found" },
                { status: 400 }
            )
        }
        const adminCommission = booking.fare * 0.10
        const partnerAmount = booking.fare - adminCommission
        booking.adminCommission = adminCommission
        booking.partnerAmount = partnerAmount
        booking.paymentStatus = "paid"
        booking.bookingStatus = "confirmed"
        await booking.save()

        return NextResponse.json({ success: true, adminCommission, partnerAmount }, { status: 200 })
    } catch (error) {
        console.error("Payment verification failed", error)
        return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 500 })
    }
}