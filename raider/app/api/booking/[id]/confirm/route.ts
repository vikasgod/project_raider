import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
import { auth } from "@/app/auth";
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        await connectDB()

        const bookingId = (await context.params).id
        const booking = await Booking.findOne({
            _id: bookingId,
            user: session.user.id,
            bookingStatus: "started",
            paymentStatus: "pending",
            razorpayOrderId: { $exists: false },
        })
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "booking is not eligible for cash payment" },
                { status: 400 }
            );
        }

        booking.paymentStatus = "cash"
        booking.adminCommission = booking.fare * 0.10;
        booking.partnerAmount = booking.fare - booking.adminCommission;
        await booking.save()

        return NextResponse.json(
            { success: true, message: "cash payment recorded" },
            { status: 200 }
        )


    } catch (error) {
        console.error("Cash payment confirmation failed:", error);
        return NextResponse.json({ message: "Cash payment confirmation failed" }, { status: 500 })
    }
}
