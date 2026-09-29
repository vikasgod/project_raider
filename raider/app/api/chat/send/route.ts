import connectDB from "@/lib/db";
import ChatMessage from "@/models/chatMessage.modal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB()
        const { bookingId, sender, text } = await req.json()
        const msg = await ChatMessage.create({
            bookingId,
            sender,
            text
        })
        return NextResponse.json(msg, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `send chat error ${error}` }, { status: 500 })
    }
}