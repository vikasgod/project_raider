import connectDB from "@/lib/db";
import ChatMessage from "@/models/chatMessage.modal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB()
        const { bookingId } = await req.json()
        const msgs = await ChatMessage.find({
            bookingId
        })
        return NextResponse.json(msgs, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `get chat error ${error}` }, { status: 500 })
    }
}