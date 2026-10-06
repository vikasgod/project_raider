import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
import axios from "axios";
import { auth } from "@/app/auth";
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "partner") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }
        const id = (await context.params).id;
        await connectDB()

        const booking = await Booking.findOneAndUpdate(
            { _id: id, driver: session.user.id, bookingStatus: "requested" },
            { $set: { bookingStatus: "rejected" } },
            { new: true },
        );
        if (!booking) {
            return NextResponse.json(
                { message: "booking not found invalid" },
                { status: 400 }
            );
        }

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