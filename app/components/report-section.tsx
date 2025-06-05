"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Report } from "@/app/page"

interface ReportSelectionProps {
  reports: Report[]
  onSubmit: (selectedReports: Report[]) => void
}

export default function ReportSelection({ reports, onSubmit }: ReportSelectionProps) {
  const [selectedReports, setSelectedReports] = useState<Report[]>(reports.filter((report) => report.selected))
  const [error, setError] = useState("")

  const handleToggleReport = (report: Report) => {
    setSelectedReports((prev) => {
      const isSelected = prev.some((r) => r.id === report.id)

      if (isSelected) {
        return prev.filter((r) => r.id !== report.id)
      } else {
        return [...prev, report]
      }
    })

    setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedReports.length === 0) {
      setError("Por favor seleccione al menos un informe")
      return
    }

    onSubmit(selectedReports)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">¿Qué informes utilizas?</h2>
        <p className="text-sm text-muted-foreground">Selecciona todos los que apliquen</p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-3 mt-4">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center space-x-2">
              <Checkbox
                id={report.id}
                checked={selectedReports.some((r) => r.id === report.id)}
                onCheckedChange={() => handleToggleReport(report)}
              />
              <Label htmlFor={report.id} className="cursor-pointer">
                {report.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Informes seleccionados:</h3>
        {selectedReports.length > 0 ? (
          <ul className="list-disc list-inside">
            {selectedReports.map((report) => (
              <li key={report.id}>{report.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Ningún informe seleccionado</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Continuar
      </Button>
    </form>
  )
}
