import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest } from "next/server";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()
        const session = await auth();
        const { rejectionReason } = await req.json()
        if (!session || !session.user?.email || session.user.role != "admin") {
            return Response.json(
                { message: "unauthorized" }, { status: 400 }
            );
        }
        const partnerId = (await context.params).id

        const partner = await User.findById(partnerId)
        if (!partner || partner.role !== "partner") {
            return Response.json(
                { message: "partner not found" },
                { status: 400 }
            )
        }

        partner.partnerStatus = "rejected"
        partner.rejectionReason = rejectionReason;
        partner.partnerOnboardingSteps = 4;
        await partner.save()

        return Response.json(
            { message: "Partner rejected successfully" },
            { status: 200 }
        )
    } catch (error) {
        return Response.json(
            { message: `Partner rejected error ${error}` },
            { status: 500 }
        )
    }
}