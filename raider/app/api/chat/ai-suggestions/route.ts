import connectDB from "@/lib/db";
import ChatMessage from "@/models/chatMessage.modal";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const geminiUrl = process.env.GEMINI_API_URL!;
export async function POST(req: NextRequest) {
    try {
        await connectDB()
        const { lastMessage, role } = await req.json()

        const prompt = `you are an AI reply suggestion system for a vehicle booking chat app.
        Generate short,smart,human-like quick reply suggestion based on:
        -ROLE (Driver or User)
        -RECENT_MESSAGE
        
        Rules:
        -Return exactly 4 suggestions
        -keep replies short and concise (3-12 words)
        -Match the conversation context and tone
        -Driver replies should sound professional ,friendly and helpful
        -User reolies should sound natural and realistic
        -Avoid repetition
        -Return ONLY valid JSON

        Output format:
        {
            "suggestions": [
                "Reply 1",
                "Reply 2",
                "Reply 3",
                "Reply 4"
            ]
        }
        Input:
        ROLE:${role}
        RECENT_MESSAGE:${lastMessage}
        `
        const response = await axios.post(geminiUrl, {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        })
        const suggestions = response.data.candidates[0].content.parts[0].text
        console.log("0939849498",suggestions)
        return NextResponse.json(suggestions, { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: `get AI suggestions error ${error}` }, { status: 500 })
    }
}