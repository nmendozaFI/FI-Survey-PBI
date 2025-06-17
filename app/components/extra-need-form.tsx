"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ExtraNeedFormProps {
  onSubmit: (extraNeed: string) => void
  onBack?: () => void
  initialValue?: string
}

export default function ExtraNeedForm({ onSubmit, onBack, initialValue = "" }: ExtraNeedFormProps) {
  const [extraNeed, setExtraNeed] = useState(initialValue)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!extraNeed.trim()) {
      const confirmed = confirm(
        "¿Estás seguro de que no quieres agregar ninguna sugerencia? Puedes dejarlo en blanco si no tienes comentarios adicionales.",
      )
      if (!confirmed) {
        return
      }
    }

    onSubmit(extraNeed.trim())
  }

  const handleBack = () => {
    if (onBack) onBack()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Una última pregunta...</h2>
          <p className="text-muted-foreground">Nos ayudarías mucho con tu opinión para mejorar los informes</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="extraNeed" className="text-base font-medium">
            ¿Qué te gustaría ver en los informes que no tienen las páginas actuales?
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Comparte tus ideas sobre nuevas funcionalidades, datos adicionales, visualizaciones o cualquier mejora que
            consideres útil. Este campo es opcional.
          </p>
          <Textarea
            id="extraNeed"
            placeholder="Por ejemplo: gráficos de tendencias, comparativas por regiones, datos históricos, filtros avanzados, etc."
            value={extraNeed}
            onChange={(e) => {
              setExtraNeed(e.target.value)
              setError("")
            }}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Campo opcional</span>
            <span>{extraNeed.length}/1000 caracteres</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <div className="flex gap-3 flex-1">
          {onBack && (
            <Button type="button" variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ChevronLeft size={16} />
              Anterior
            </Button>
          )}
        </div>

        <Button type="submit" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
          Finalizar Encuesta
          <ChevronRight size={16} />
        </Button>
      </div>
    </form>
  )
}
