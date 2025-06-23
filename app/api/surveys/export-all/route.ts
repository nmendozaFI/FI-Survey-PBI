import { NextResponse } from "next/server"
import { getCompleteSurveyData } from "@/lib/database"
import { combineWithAllPages } from "@/lib/survey-utils"

export async function GET() {
  try {
    const surveyData = await getCompleteSurveyData()
    const completeData = combineWithAllPages(surveyData)

    // Convertir a formato CSV
    const headers = ["Nombre", "Equipo", "Fecha", "Informe", "Página", "¿Cumple su propósito?", "Propósito alternativo"]

    const csvContent = [
      headers.join(","),
      ...completeData.map((row) =>
        [
          `"${row.name}"`,
          `"${row.team}"`,
          `"${new Date(row.timestamp).toLocaleDateString("es-ES")}"`,
          `"${row.report_name}"`,
          `"${row.page_name}"`,
          `"${row.fulfills_purpose === "si" ? "Sí" : row.fulfills_purpose === "no" ? "No" : "NO USADA"}"`,
          `"${row.purpose}"`,
        ].join(","),
      ),
    ].join("\n")

    // Agregar BOM para Excel
    const BOM = "\uFEFF"

    return new NextResponse(BOM + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="todas-las-encuestas-completas-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export Error:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
