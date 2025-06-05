import { NextResponse } from "next/server"
import { getSurveyStats } from "@/lib/database"

export async function GET() {
  try {
    const stats = await getSurveyStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Stats API Error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
