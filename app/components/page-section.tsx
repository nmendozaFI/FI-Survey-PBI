"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Report } from "@/app/page"

interface PageSelectionProps {
  report: Report
  reportIndex: number
  totalReports: number
  onSubmit: (reportId: string, pages: { id: string; name: string; purpose?: string; selected?: boolean }[]) => void
  onBack?: () => void
  onNext?: () => void
  onFinish?: () => void
  canGoBack?: boolean
  canGoNext?: boolean
  isLastReport?: boolean
}

export default function PageSelection({
  report,
  reportIndex,
  totalReports,
  onSubmit,
  onBack,
  onNext,
  onFinish,
  canGoBack = false,
  canGoNext = false,
  isLastReport = false,
}: PageSelectionProps) {
  const [pages, setPages] = useState(
    report.pages.map((page) => ({
      ...page,
      selected: page.selected || false,
      purpose: page.purpose || "",
    })),
  )
  const [error, setError] = useState("")

  // Update pages when report changes
  useEffect(() => {
    setPages(
      report.pages.map((page) => ({
        ...page,
        selected: page.selected || false,
        purpose: page.purpose || "",
      })),
    )
    setError("")
  }, [report])

  const handleTogglePage = (pageId: string) => {
    setPages((prev) => prev.map((page) => (page.id === pageId ? { ...page, selected: !page.selected } : page)))
    setError("")
  }

  const handlePurposeChange = (pageId: string, purpose: string) => {
    setPages((prev) => prev.map((page) => (page.id === pageId ? { ...page, purpose } : page)))
  }

  const validateAndSave = () => {
    const selectedPages = pages.filter((page) => page.selected)

    if (selectedPages.length === 0) {
      setError("Por favor seleccione al menos una página")
      return false
    }

    const hasEmptyPurpose = selectedPages.some((page) => !page.purpose?.trim())

    if (hasEmptyPurpose) {
      setError("Por favor complete el propósito para todas las páginas seleccionadas")
      return false
    }

    // Save current report data
    onSubmit(report.id, pages)
    return true
  }

  const handleBack = () => {
    // Save current state before going back
    onSubmit(report.id, pages)
    if (onBack) onBack()
  }

  const handleNext = () => {
    if (validateAndSave() && onNext) {
      onNext()
    }
  }

  const handleFinish = () => {
    if (validateAndSave() && onFinish) {
      onFinish()
    }
  }

  const selectedPagesCount = pages.filter((page) => page.selected).length

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          Informe {reportIndex} de {totalReports}: {report.name}
        </h2>
        <p className="text-sm text-muted-foreground">Selecciona las páginas que utilizas de este informe</p>
        {selectedPagesCount > 0 && (
          <p className="text-sm text-green-600">
            {selectedPagesCount} página{selectedPagesCount !== 1 ? "s" : ""} seleccionada
            {selectedPagesCount !== 1 ? "s" : ""}
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-6 mt-4 max-h-96 overflow-y-auto">
          {pages.map((page) => (
            <div key={page.id} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${report.id}-${page.id}`}
                  checked={page.selected}
                  onCheckedChange={() => handleTogglePage(page.id)}
                />
                <Label htmlFor={`${report.id}-${page.id}`} className="cursor-pointer flex-1">
                  {page.name}
                </Label>
              </div>

              {page.selected && (
                <div className="ml-6 mt-2">
                  <Label htmlFor={`${report.id}-${page.id}-purpose`} className="text-sm">
                    ¿Para qué utilizas esta página?
                  </Label>
                  <Input
                    id={`${report.id}-${page.id}-purpose`}
                    placeholder="Describe el propósito o uso que le das a esta página"
                    value={page.purpose}
                    onChange={(e) => handlePurposeChange(page.id, e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <div className="flex gap-3 flex-1">
          {canGoBack && (
            <Button type="button" variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ChevronLeft size={16} />
              Anterior
            </Button>
          )}

          {canGoNext && !isLastReport && (
            <Button type="button" onClick={handleNext} className="flex items-center gap-2">
              Siguiente
              <ChevronRight size={16} />
            </Button>
          )}
        </div>

        {isLastReport && (
          <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
            Finalizar Encuesta
          </Button>
        )}
      </div>
    </div>
  )
}
