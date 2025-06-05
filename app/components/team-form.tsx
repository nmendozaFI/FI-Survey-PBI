"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TeamFormProps {
  onSubmit: (name: string, team: string) => void
  initialName?: string
  initialTeam?: string
}

export default function TeamForm({ onSubmit, initialName = "", initialTeam = "" }: TeamFormProps) {
  const [name, setName] = useState(initialName)
  const [team, setTeam] = useState(initialTeam)
  const [errors, setErrors] = useState({ name: "", team: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = { name: "", team: "" }

    if (!name.trim()) {
      newErrors.name = "Por favor ingrese su nombre"
    }

    if (!team.trim()) {
      newErrors.team = "Por favor ingrese el nombre del equipo"
    }

    setErrors(newErrors)

    if (!newErrors.name && !newErrors.team) {
      onSubmit(name.trim(), team.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">¿Nombre?</Label>
          <Input
            id="name"
            placeholder="Tu nombre..."
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((prev) => ({ ...prev, name: "" }))
            }}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="team">¿A qué equipo perteneces?</Label>
          <Input
            id="team"
            placeholder="Ej: Madrid-violencia"
            value={team}
            onChange={(e) => {
              setTeam(e.target.value)
              setErrors((prev) => ({ ...prev, team: "" }))
            }}
            className={errors.team ? "border-red-500" : ""}
          />
          {errors.team && <p className="text-sm text-red-500">{errors.team}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continuar
      </Button>
    </form>
  )
}
