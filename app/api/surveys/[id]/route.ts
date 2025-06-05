import { type NextRequest, NextResponse } from "next/server"
import { deleteSurveyResult } from "@/lib/database"

export async function DELETE(request: NextRequest) {
  try {
     const url = new URL(request.url)
    const survey_id = url.pathname.split("/").pop() // <- Aquí obtienes el [id]

    if (!survey_id) {
      return NextResponse.json({ error: "Survey ID not provided" }, { status: 400 })
    }

    const result = await deleteSurveyResult(survey_id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Survey deleted successfully",
      })
    } else {
      return NextResponse.json({ error: result.error || "Failed to delete survey" }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
