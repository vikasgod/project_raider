import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDB()
        const session = await auth();
        if (!session || !session.user?.email || session.user.role != "admin") {
            return Response.json(
                { message: "unauthorized" }, { status: 400 }
            );
        }
        const totalPartner = await User.countDocuments({ role: "partner" })
        const totalApprovedPartner = await User.countDocuments({ role: "partner", partnerStatus: "approved" })
        const totalPendingPartner = await User.countDocuments({ role: "partner", partnerStatus: "pending" })
        const totalRejectedPartner = await User.countDocuments({ role: "partner", partnerStatus: "rejected" })

        const pendingPartnerUsers = await User.find({
            role: "partner",
            partnerStatus: "pending",
            partnerOnboardingSteps: { $gte: 3 }
        })
        const partnerIds = pendingPartnerUsers.map((p) => p._id)
        const partnerVehicles = await Vehicle.find({
            owner: { $in: partnerIds }
        })
        const vehicleTypeMap = new Map(
            partnerVehicles.map((v) => [String(v.owner), v.type])
        )

        const pendingPartnerReviews = pendingPartnerUsers.map((p) => ({
            _id: p._id,
            name: p.name,
            email: p.email,
            vehicleType: vehicleTypeMap.get(String(p._id))
        }
        ))

        const pendingVehicle = await Vehicle.find({
            status: "pending",
            baseFare: { $exists: true, $ne: null },
            pricePerKM: { $exists: true, $ne: null }
        }).populate("owner");

        return NextResponse.json(
            {
                pendingVehicle,
                stats: {
                    totalPartner,
                    totalApprovedPartner,
                    totalPendingPartner,
                    totalRejectedPartner,
                },
                pendingPartnerReviews
            },
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: `admin dashboard error ${error}` },
            { status: 500 }
        )
    }
}