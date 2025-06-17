import { NextResponse } from "next/server"
import { getExtraNeedsData } from "@/lib/database"

export async function GET() {
  try {
    const data = await getExtraNeedsData()

    // Convertir a formato CSV
    const headers = ["Nombre", "Equipo", "Fecha", "Sugerencias"]

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          `"${row.name}"`,
          `"${row.team}"`,
          `"${new Date(row.timestamp).toLocaleDateString("es-ES")}"`,
          `"${row.extra_need}"`,
        ].join(","),
      ),
    ].join("\n")

    // Agregar BOM para Excel
    const BOM = "\uFEFF"

    return new NextResponse(BOM + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sugerencias-informes-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export Extra Needs Error:", error)
    return NextResponse.json({ error: "Failed to export extra needs data" }, { status: 500 })
  }
}
