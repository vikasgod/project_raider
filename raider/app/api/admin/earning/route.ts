import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const bookings = await Booking.find({
            paymentStatus: "paid",
            createdAt: { $gte: sevenDaysAgo }
        }).select("adminCommission createdAt")

        let earningMap: Record<string, number> = {}

        bookings.forEach((b) => {
            const date = new Date(b.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            })

            if (!earningMap[date]) {
                earningMap[date] = 0
            }

            earningMap[date] = earningMap[date] + b.adminCommission || 0
        })

        const earnings = Object.entries(earningMap).map(([date, earnings]) => (
            { date, earnings }
        ))
        return NextResponse.json(
            earnings,
            { status: 200 }
        )

    } catch (error) {

        return NextResponse.json({ message: `adsmin earning error ${error}` }, { status: 500 })

    }
}