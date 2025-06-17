import { type NextRequest, NextResponse } from "next/server"
import { saveSurveyResult, getAllSurveyResults } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, team, extra_need, responses } = body

    if (!name || !team || !responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: "Missing required fields: name, team, responses" }, { status: 400 })
    }

    console.log("Received survey data:", { name, team, responses })
    const result = await saveSurveyResult({ name, team,extra_need, responses })

    if (result.success) {
      return NextResponse.json({
        success: true,
        survey_id: result.survey_id,
        message: "Survey saved successfully",
      })
    } else {
      return NextResponse.json({ error: result.error || "Failed to save survey" }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const surveys = await getAllSurveyResults()
    return NextResponse.json({ surveys })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch surveys" }, { status: 500 })
  }
}
