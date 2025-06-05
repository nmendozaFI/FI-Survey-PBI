import { NextResponse } from "next/server"
import { getFlattenedSurveyData } from "@/lib/database"

export async function GET() {
  try {
    const data = await getFlattenedSurveyData()

    // Convertir a formato CSV
    const headers = ["Nombre", "Equipo", "Fecha", "Informe", "Página", "¿Cumple su propósito?", "Propósito alternativo"]

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          `"${row.name}"`,
          `"${row.team}"`,
          `"${new Date(row.timestamp).toLocaleDateString("es-ES")}"`,
          `"${row.report_name}"`,
          `"${row.page_name}"`,
          `"${row.fulfills_purpose === "si" ? "Sí" : "No"}"`,
          `"${row.purpose}"`,
        ].join(","),
      ),
    ].join("\n")

    // Agregar BOM para Excel
    const BOM = "\uFEFF"

    return new NextResponse(BOM + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="todas-las-encuestas-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export Error:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
