import connectDB from "@/lib/db";
import razorpay from "@/lib/razorpay";
import Booking from "@/models/booking.modal";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        await connectDB()
        const { bookingId } = await req.json()
        const booking = await Booking.findOne({
            _id: bookingId,
            user: session.user.id,
            bookingStatus: "started",
            paymentStatus: "pending",
        })

        if (!booking) {
            return NextResponse.json(
                { message: "payment is only available to the ride's customer after pickup" },
                { status: 400 },
            )
        }
        if (!Number.isFinite(booking.fare) || booking.fare <= 0) {
            return NextResponse.json({ message: "invalid booking fare" }, { status: 400 });
        }
        if (booking.razorpayOrderId) {
            return NextResponse.json(
                {
                    orderId: booking.razorpayOrderId,
                    amount: Math.round(booking.fare * 100),
                },
                { status: 200 },
            );
        }

        const order = await razorpay.orders.create({
            amount: Math.round(booking.fare * 100),
            currency: "INR",
            receipt: `Booking ${booking._id.toString()}`,
        })

        const savedBooking = await Booking.findOneAndUpdate(
            {
                _id: booking._id,
                user: session.user.id,
                bookingStatus: "started",
                paymentStatus: "pending",
                razorpayOrderId: { $exists: false },
            },
            { $set: { razorpayOrderId: order.id } },
            { new: true },
        );
        if (!savedBooking) {
            const currentBooking = await Booking.findOne({
                _id: booking._id,
                user: session.user.id,
                bookingStatus: "started",
                paymentStatus: "pending",
            }).select("razorpayOrderId");
            if (!currentBooking?.razorpayOrderId) {
                return NextResponse.json(
                    { message: "could not prepare payment for this ride" },
                    { status: 409 },
                );
            }

            return NextResponse.json(
                {
                    orderId: currentBooking.razorpayOrderId,
                    amount: Math.round(booking.fare * 100),
                },
                { status: 200 },
            );
        }

        return NextResponse.json(
            { orderId: order.id, amount: order.amount },
            { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `create booking error ${error}` }, { status: 500 })
    }
}