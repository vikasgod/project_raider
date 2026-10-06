import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
import { auth } from "@/app/auth";
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        const id = (await context.params).id;
        await connectDB()

        const booking = await Booking.findOneAndUpdate(
            { _id: id, user: session.user.id, bookingStatus: "requested" },
            { $set: { bookingStatus: "cancelled" } },
            { new: true },
        );
        if (!booking) {
            return NextResponse.json(
                { message: "booking not found invalid" },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: `cancel booking error ${error}` }, { status: 500 });
    }
}