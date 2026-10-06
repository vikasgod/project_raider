import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.modal";
import { NextResponse } from "next/server";

const RANGE_DAYS = {
    today: 1,
    week: 7,
    month: 30,
    threeMonths: 90,
    sixMonths: 180,
    year: 365,
} as const;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKey(value: string) {
    if (!DATE_KEY_PATTERN.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getIndiaDateKey(date: Date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((value) => value.type === type)?.value ?? "";

    return `${part("year")}-${part("month")}-${part("day")}`;
}

function getIndiaDayStart(dateKey: string) {
    return new Date(`${dateKey}T00:00:00.000+05:30`);
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "partner") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }

        const searchParams = new URL(req.url).searchParams;
        const range = searchParams.get("range") ?? "today";
        const todayKey = getIndiaDateKey(new Date());
        let startKey: string;
        let endKey: string;

        if (range === "custom") {
            startKey = searchParams.get("startDate") ?? "";
            endKey = searchParams.get("endDate") ?? "";
            if (
                !isValidDateKey(startKey) ||
                !isValidDateKey(endKey) ||
                startKey > endKey ||
                endKey > todayKey
            ) {
                return NextResponse.json({ message: "invalid earning date range" }, { status: 400 });
            }
        } else if (Object.hasOwn(RANGE_DAYS, range)) {
            const start = getIndiaDayStart(todayKey);
            start.setUTCDate(start.getUTCDate() - (RANGE_DAYS[range as keyof typeof RANGE_DAYS] - 1));
            startKey = getIndiaDateKey(start);
            endKey = todayKey;
        } else {
            return NextResponse.json({ message: "invalid earning range" }, { status: 400 });
        }

        await connectDB();
        const start = getIndiaDayStart(startKey);
        const end = getIndiaDayStart(endKey);
        end.setUTCDate(end.getUTCDate() + 1);

        const bookings = await Booking.find({
            driver: session.user.id,
            paymentStatus: { $in: ["paid", "cash"] },
            bookingStatus: "completed",
            createdAt: { $gte: start, $lt: end },
        }).select("partnerAmount createdAt");

        const earningMap = new Map<string, number>();
        for (const booking of bookings) {
            const dateKey = getIndiaDateKey(new Date(booking.createdAt));
            earningMap.set(
                dateKey,
                (earningMap.get(dateKey) ?? 0) + booking.partnerAmount,
            );
        }

        const earnings = [];
        for (const day = new Date(start); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
            const dateKey = getIndiaDateKey(day);
            earnings.push({ date: dateKey, earnings: earningMap.get(dateKey) ?? 0 });
        }

        return NextResponse.json(earnings, { status: 200 });
    } catch (error) {
        console.error("Partner earnings fetch failed:", error);
        return NextResponse.json({ message: "Could not load partner earnings" }, { status: 500 });
    }
}