import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth"
import User from "@/models/user.model";
import Booking from "@/models/booking.modal";
import axios from "axios";


export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    message: "unauthorized"
                },
                { status: 400 }
            )
        }
        const { driverId, vehicleId, pickUpAddress, dropAddress, pickUpLocation, dropLocation, fare, mobileNumber } = await req.json();
        if (!driverId || !vehicleId || !pickUpLocation.coordinates || !dropLocation.coordinates) {
            return NextResponse.json(
                {
                    message: "missing required details"
                },
                { status: 400 }
            )
        }

        const driver = await User.findById(driverId);
        if (!driver) {
            return NextResponse.json(
                { message: "driver not found" },
                { status: 400 }
            )
        }
        const existing = await Booking.findOne({
            user: session.user.id,
            bookingStatus: {
                $in: ["requested", "awaiting_payment", "confirmed", "started"]
            }
        })

        if (existing) {
            return NextResponse.json(existing)
        }

        const booking = await Booking.create({
            user: session.user.id,
            driver,
            vehicle: vehicleId,
            pickUpAddress,
            dropAddress,
            pickUpLocation,
            dropLocation,
            fare,
            userMobileNumber: mobileNumber,
            driverMobileNumber: driver.mobileNumber,
            bookingStatus: "requested",

        })

        await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/emit`, {
            event: "new-booking",
            userId: driverId,
            data: booking
        })

        return NextResponse.json(booking, { status: 200 })

    } catch (error) {
        return NextResponse.json(
            { message: `Create booking error ${error}` },
            { status: 500 }
        );
    }
}