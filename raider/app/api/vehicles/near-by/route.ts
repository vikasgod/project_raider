import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { latitude, longitude, vehicleType } = await req.json();
        if (!latitude || !longitude) {
            return NextResponse.json(
                { message: "coordinates not found" },
                { status: 400 }
            );
        }

        const partners = await User.find({
            role: "partner",
            isOnline: true,
            partnerStatus: "approved",
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude],
                    },
                    // $maxDistance: 10000,
                    // $minDistance: 0,
                },
            },
        })
        const prtnersId = partners.map((partner) => partner._id);
        if (prtnersId.length === 0) {
            return NextResponse.json(
                [],
                { status: 200 }
            );
        }
        const vehicles = await Vehicle.find({
            owner: { $in: prtnersId },
            type: vehicleType,
            status: "approved",
            isActive: true,
        }).lean();
        return NextResponse.json(
            vehicles,
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { message: `near by vehicle error ${error}` },
            { status: 500 }
        );
    }
}