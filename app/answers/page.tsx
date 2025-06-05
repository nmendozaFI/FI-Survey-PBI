"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, Trash2, FileSpreadsheet, FileDown, Bug } from "lucide-react"
import Link from "next/link"

type FlattenedData = {
  name: string
  team: string
  reportName: string
  pageName: string
  purpose: string
}

type SurveyResult = {
  id: string
  timestamp: string
  name: string
  team: string
  flattenedData: FlattenedData[]
  reports?: any[] // Mantener por compatibilidad
}

export default function AnswersPage() {
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyResult | null>(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    const results = JSON.parse(localStorage.getItem("surveyResults") || "[]")
    console.log("=== DATOS CARGADOS DESDE LOCALSTORAGE (ANSWERS) ===")
    console.log("Número de encuestas:", results.length)

    // Mostrar todos los datos antes de limpiar
    results.forEach((survey: SurveyResult, index: number) => {
      console.log(`\n--- Encuesta ORIGINAL ${index + 1}: ${survey.name} ---`)
      console.log("flattenedData:", survey.flattenedData)
      console.log("Número de páginas en flattenedData:", survey.flattenedData?.length || 0)
      console.log("timestamp:", survey.timestamp)
    })

    // Limpiar duplicados manteniendo la encuesta con MÁS datos
    const cleanedResults: SurveyResult[] = []

    results.forEach((survey: SurveyResult) => {
      const existingIndex = cleanedResults.findIndex(
        (existing) =>
          existing.name === survey.name &&
          existing.team === survey.team &&
          Math.abs(new Date(existing.timestamp).getTime() - new Date(survey.timestamp).getTime()) < 30000, // 30 segundos
      )

      if (existingIndex === -1) {
        // No existe duplicado, agregar
        cleanedResults.push(survey)
        console.log(`Agregando nueva encuesta: ${survey.name} con ${survey.flattenedData?.length || 0} páginas`)
      } else {
        // Existe duplicado, mantener el que tenga más datos
        const existing = cleanedResults[existingIndex]
        const existingPages = existing.flattenedData?.length || 0
        const currentPages = survey.flattenedData?.length || 0

        console.log(`Duplicado encontrado para ${survey.name}:`)
        console.log(`  - Existente: ${existingPages} páginas (${existing.timestamp})`)
        console.log(`  - Actual: ${currentPages} páginas (${survey.timestamp})`)

        if (currentPages > existingPages) {
          console.log(`  -> Reemplazando con la encuesta que tiene más datos`)
          cleanedResults[existingIndex] = survey
        } else {
          console.log(`  -> Manteniendo la encuesta existente`)
        }
      }
    })

    // Si se encontraron duplicados, actualizar localStorage
    if (cleanedResults.length !== results.length) {
      console.log(`Se procesaron ${results.length - cleanedResults.length} duplicados`)
      localStorage.setItem("surveyResults", JSON.stringify(cleanedResults))
    }

    console.log("\n=== DATOS FINALES DESPUÉS DE LIMPIAR ===")
    cleanedResults.forEach((survey: SurveyResult, index: number) => {
      console.log(`\n--- Encuesta FINAL ${index + 1}: ${survey.name} ---`)
      console.log("flattenedData:", survey.flattenedData)
      console.log("Número de páginas en flattenedData:", survey.flattenedData?.length || 0)
    })
    console.log("=== FIN DEBUG INICIAL (ANSWERS) ===\n")

    setSurveyResults(cleanedResults)
  }, [])

  const downloadExcel = async (survey: SurveyResult) => {
    console.log("\n=== DESCARGA INDIVIDUAL (USANDO FLATTENED DATA) ===")
    console.log("Encuesta a descargar:", survey.name)
    console.log("flattenedData:", survey.flattenedData)

    if (!survey.flattenedData || survey.flattenedData.length === 0) {
      console.error("¡ERROR! No hay flattenedData para descargar")
      alert("No hay datos para descargar. La encuesta no tiene datos válidos.")
      return
    }

    // Usar directamente los datos aplanados guardados
    const dataForExcel = survey.flattenedData.map((item) => ({
      Nombre: item.name,
      Equipo: item.team,
      Fecha: new Date(survey.timestamp).toLocaleDateString("es-ES"),
      Informe: item.reportName,
      Página: item.pageName,
      Propósito: item.purpose,
    }))

    console.log("Datos para Excel:", dataForExcel)
    console.log("Total filas:", dataForExcel.length)

    // Convert to CSV format (Excel compatible)
    const headers = ["Nombre", "Equipo", "Fecha", "Informe", "Página", "Propósito"]
    const csvContent = [
      headers.join(","),
      ...dataForExcel.map((row) => headers.map((header) => `"${row[header as keyof typeof row] || ""}"`).join(",")),
    ].join("\n")

    // Add BOM for proper Excel encoding
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.setAttribute("href", url)
    link.setAttribute("download", `encuesta-${survey.name.replace(/\s+/g, "-")}-${survey.id}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllExcel = async () => {
    setIsDownloadingAll(true)
    console.log("\n=== DESCARGA TODAS LAS ENCUESTAS (USANDO FLATTENED DATA) ===")

    try {
      // Usar directamente los datos aplanados de todas las encuestas
      const allData = surveyResults.flatMap((survey) => {
        console.log(`Procesando encuesta: ${survey.name}`)
        console.log("flattenedData:", survey.flattenedData)

        if (!survey.flattenedData) {
          console.warn(`Encuesta ${survey.name} no tiene flattenedData`)
          return []
        }

        return survey.flattenedData.map((item) => ({
          Nombre: item.name,
          Equipo: item.team,
          Fecha: new Date(survey.timestamp).toLocaleDateString("es-ES"),
          Informe: item.reportName,
          Página: item.pageName,
          Propósito: item.purpose,
        }))
      })

      console.log("Todos los datos recopilados:", allData)
      console.log("Total filas para todas las encuestas:", allData.length)

      if (allData.length === 0) {
        console.error("¡ERROR! No hay datos para descargar")
        alert("No hay datos para descargar. Revisa la consola para más detalles.")
        return
      }

      // Convert to CSV format (Excel compatible)
      const headers = ["Nombre", "Equipo", "Fecha", "Informe", "Página", "Propósito"]
      const csvContent = [
        headers.join(","),
        ...allData.map((row) => headers.map((header) => `"${row[header as keyof typeof row] || ""}"`).join(",")),
      ].join("\n")

      // Add BOM for proper Excel encoding
      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      const today = new Date().toISOString().split("T")[0]
      link.setAttribute("href", url)
      link.setAttribute("download", `todas-las-encuestas-${today}.csv`)
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al descargar todas las encuestas:", error)
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const deleteSurvey = (surveyId: string) => {
    const updatedResults = surveyResults.filter((survey) => survey.id !== surveyId)
    setSurveyResults(updatedResults)
    localStorage.setItem("surveyResults", JSON.stringify(updatedResults))
    if (selectedSurvey?.id === surveyId) {
      setSelectedSurvey(null)
    }
  }

  const clearAllSurveys = () => {
    if (confirm("¿Estás seguro de que quieres eliminar todas las encuestas? Esta acción no se puede deshacer.")) {
      setSurveyResults([])
      localStorage.removeItem("surveyResults")
      setSelectedSurvey(null)
    }
  }

  const getTotalPages = (survey: SurveyResult) => {
    return survey.flattenedData?.length || 0
  }

  const getTotalReports = (survey: SurveyResult) => {
    if (!survey.flattenedData) return 0
    // Contar informes únicos en flattenedData
    const uniqueReports = new Set(survey.flattenedData.map((item) => item.reportName))
    return uniqueReports.size
  }

  const getTotalResponses = () => {
    return surveyResults.reduce((total, survey) => {
      return total + (survey.flattenedData?.length || 0)
    }, 0)
  }

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Resultados de Encuestas</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="flex items-center gap-2"
            >
              <Bug size={16} />
              Debug {debugMode ? "ON" : "OFF"}
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAllSurveys} className="flex items-center gap-2">
              <Trash2 size={16} />
              Limpiar Todo
            </Button>
            {/* {surveyResults.length > 0 && (
              <Button
                onClick={downloadAllExcel}
                disabled={isDownloadingAll || surveyResults.length === 0}
                className="flex items-center gap-2"
              >
                <FileDown size={18} />
                Descargar Todas ({getTotalResponses()} respuestas)
              </Button>
            )} */}
            <Link href="/">
              <Button variant="outline">Volver a Encuesta</Button>
            </Link>
          </div>
        </div>

        {debugMode && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Modo Debug - Información Detallada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>Total encuestas:</strong> {surveyResults.length}
                </div>
                <div>
                  <strong>Total respuestas:</strong> {getTotalResponses()}
                </div>
                {surveyResults.map((survey, index) => (
                  <div key={survey.id} className="border-l-2 border-yellow-300 pl-4">
                    <div>
                      <strong>Encuesta {index + 1}:</strong> {survey.name} ({survey.team})
                    </div>
                    <div>ID: {survey.id}</div>
                    <div>Timestamp: {survey.timestamp}</div>
                    <div>Páginas en flattenedData: {survey.flattenedData?.length || 0}</div>
                    <div>Informes únicos: {getTotalReports(survey)}</div>
                    <div>
                      <strong>flattenedData existe:</strong> {survey.flattenedData ? "SÍ" : "NO"}
                    </div>
                    {survey.flattenedData && survey.flattenedData.length > 0 && (
                      <div className="mt-2">
                        <strong>Detalle de páginas:</strong>
                        {survey.flattenedData.slice(0, 3).map((item, pIndex) => (
                          <div key={pIndex} className="ml-4 text-xs">
                            {pIndex + 1}. {item.reportName} - {item.pageName}
                          </div>
                        ))}
                        {survey.flattenedData.length > 3 && (
                          <div className="ml-4 text-xs">... y {survey.flattenedData.length - 3} más</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de encuestas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet size={20} />
                Encuestas Completadas ({surveyResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              {surveyResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay encuestas completadas aún.
                  <br />
                  <Link href="/" className="text-primary hover:underline">
                    Completar primera encuesta
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {surveyResults.map((survey) => (
                    <div
                      key={survey.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSurvey?.id === survey.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedSurvey(survey)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{survey.name}</h3>
                          <p className="text-sm text-muted-foreground">{survey.team}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(survey.timestamp).toLocaleString("es-ES")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{getTotalReports(survey)} informes</Badge>
                          <Badge variant="outline">{getTotalPages(survey)} páginas</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSurvey(survey)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadExcel(survey)
                          }}
                          className="flex items-center gap-1"
                          disabled={!survey.flattenedData || survey.flattenedData.length === 0}
                        >
                          <Download size={14} />
                          Excel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSurvey(survey.id)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {surveyResults.length > 0 && (
              <CardFooter className="border-t pt-4">
                <Button
                  onClick={downloadAllExcel}
                  disabled={isDownloadingAll}
                  className="w-full flex items-center gap-2"
                >
                  <FileDown size={16} />
                  Descargar Todas las Encuestas en un Solo Excel
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Detalle de encuesta seleccionada */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedSurvey ? `Detalle: ${selectedSurvey.name}` : "Selecciona una encuesta"}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSurvey ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Nombre</p>
                      <p className="text-lg">{selectedSurvey.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Equipo</p>
                      <p className="text-lg">{selectedSurvey.team}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium">Fecha</p>
                      <p className="text-lg">{new Date(selectedSurvey.timestamp).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>

                  <div className="border rounded-md max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Informe</TableHead>
                          <TableHead>Página</TableHead>
                          <TableHead>Propósito</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSurvey.flattenedData && selectedSurvey.flattenedData.length > 0 ? (
                          selectedSurvey.flattenedData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.reportName}</TableCell>
                              <TableCell>{item.pageName}</TableCell>
                              <TableCell>{item.purpose}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              No hay páginas seleccionadas en esta encuesta
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Button
                    onClick={() => downloadExcel(selectedSurvey)}
                    className="w-full"
                    disabled={!selectedSurvey.flattenedData || selectedSurvey.flattenedData.length === 0}
                  >
                    <Download size={16} className="mr-2" />
                    Descargar en Excel
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Selecciona una encuesta de la lista para ver los detalles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
