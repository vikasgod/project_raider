import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Booking from "@/models/booking.modal";
import { auth } from "@/app/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
        }
        await connectDB()
        const {
            bookingId,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = await req.json()
        if (
            typeof bookingId !== "string" ||
            !/^[a-f\d]{24}$/i.test(bookingId) ||
            typeof razorpay_payment_id !== "string" ||
            !razorpay_payment_id ||
            typeof razorpay_order_id !== "string" ||
            !razorpay_order_id ||
            typeof razorpay_signature !== "string" ||
            !/^[a-f\d]{64}$/i.test(razorpay_signature)
        ) {
            return NextResponse.json(
                { success: false, message: "invalid payment verification details" },
                { status: 400 },
            )
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json({ success: false, message: "payment configuration is missing" }, { status: 500 });
        }
        const hmac = crypto.createHmac('sha256', secret)
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id)
        const generated_signature = hmac.digest('hex')

        const expected = Buffer.from(generated_signature, "hex");
        const received = Buffer.from(razorpay_signature, "hex");
        if (!crypto.timingSafeEqual(expected, received)) {
            return NextResponse.json(
                { success: false, message: "signature mismatch" },
                { status: 400 },
            )
        }

        const booking = await Booking.findOne({
            _id: bookingId,
            user: session.user.id,
            bookingStatus: "started",
            paymentStatus: "pending",
            razorpayOrderId: razorpay_order_id,
        })
        if (booking) {
            const adminCommission = booking.fare * 0.10
            const partnerAmount = booking.fare - adminCommission
            const updatedBooking = await Booking.findOneAndUpdate(
                {
                    _id: booking._id,
                    user: session.user.id,
                    bookingStatus: "started",
                    paymentStatus: "pending",
                    razorpayOrderId: razorpay_order_id,
                },
                {
                    $set: {
                        adminCommission,
                        partnerAmount,
                        paymentStatus: "paid",
                        razorpayPaymentId: razorpay_payment_id,
                    },
                },
                { new: true },
            )
            if (updatedBooking) {
                return NextResponse.json(
                    { success: true, adminCommission, partnerAmount },
                    { status: 200 },
                )
            }
        }

        const alreadyVerified = await Booking.findOne({
            _id: bookingId,
            user: session.user.id,
            paymentStatus: "paid",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
        }).select("adminCommission partnerAmount")
        if (alreadyVerified) {
            return NextResponse.json(
                {
                    success: true,
                    adminCommission: alreadyVerified.adminCommission,
                    partnerAmount: alreadyVerified.partnerAmount,
                },
                { status: 200 },
            )
        }

        if (!booking) {
            return NextResponse.json(
                { success: false, message: "booking is not eligible for payment" },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { success: false, message: "booking payment state changed; contact support before paying again" },
            { status: 409 },
        )
    } catch (error) {
        console.error("Payment verification failed", error)
        return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 500 })
    }
}