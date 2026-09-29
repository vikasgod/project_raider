import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import Vehicle from "@/models/vehicle.model";
import { NextRequest } from "next/server";

export async function POST(
    req: NextRequest, context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB()
        const session = await auth();
        if (!session || !session.user?.email || session.user.role != "admin") {
            return Response.json(
                { message: "unauthorized" }, { status: 400 }
            );
        }
        const { reason } = await req.json()
        const vehicleId = (await context.params).id

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return Response.json(
                { message: "vehicle not found" },
                { status: 400 }
            )
        }

        vehicle.status = "rejected"
        vehicle.rejectionReason = reason
        await vehicle.save()

        return Response.json(
            vehicle,
            { status: 200 }
        )
    } catch (error) {
        return Response.json(
            { message: `vehicle rejected error ${error}` },
            { status: 500 }
        )
    }
}