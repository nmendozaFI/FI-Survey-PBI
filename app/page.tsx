"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import reportsData from "./utils/informes-data.json"
import StepIndicator from "./components/step-indicator"
import TeamForm from "./components/team-form"
import ReportSelection from "./components/report-section"
import PageSelection from "./components/page-section"
import ExtraNeedForm from "./components/extra-need-form"
import SurveySummary from "./components/survey-summary"


export type Report = {
  id: string
  name: string
  pages: {
    id: string
    name: string
    purpose?: string
    selected?: boolean
    fulfillsPurpose?: string
  }[]
  selected?: boolean
}

export type SurveyData = {
  name: string
  team: string
  reports: Report[]
  extraNeed?: string
}

const initialReports: Report[] = reportsData

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [surveyData, setSurveyData] = useState<SurveyData>({
    name: "",
    team: "",
    reports: initialReports,
    extraNeed: "",
  })
  const [currentReportIndex, setCurrentReportIndex] = useState(0)

  const selectedReports = surveyData.reports.filter((report) => report.selected)

  const handleTeamSubmit = (name: string, team: string) => {
    setSurveyData((prev) => ({ ...prev, name, team }))
    setCurrentStep(2)
  }

  const handleReportSelection = (selectedReports: Report[]) => {
    setSurveyData((prev) => ({
      ...prev,
      reports: prev.reports.map((report) => ({
        ...report,
        selected: selectedReports.some((r) => r.id === report.id),
      })),
    }))
    setCurrentStep(3)
    setCurrentReportIndex(0)
  }

  const handlePageSelection = (
    reportId: string,
    pages: { id: string; name: string; purpose?: string; selected?: boolean; fulfillsPurpose?: string }[],
  ) => {
    setSurveyData((prev) => ({
      ...prev,
      reports: prev.reports.map((report) => (report.id === reportId ? { ...report, pages } : report)),
    }))
  }

  const handleNextReport = () => {
    const nextIndex = currentReportIndex + 1
    if (nextIndex < selectedReports.length) {
      setCurrentReportIndex(nextIndex)
    }
  }

  const handlePreviousReport = () => {
    const prevIndex = currentReportIndex - 1
    if (prevIndex >= 0) {
      setCurrentReportIndex(prevIndex)
    }
  }

  const handleFinishSurvey = () => {
    setCurrentStep(4) // Ir al paso de extraNeed en lugar de directamente al resumen
  }

  const handleExtraNeedSubmit = (extraNeed: string) => {
    setSurveyData((prev) => ({ ...prev, extraNeed }))
    setCurrentStep(5) // Cambiar a paso 5 (resumen)
  }

  const handleReset = () => {
    setSurveyData({
      name: "",
      team: "",
      reports: initialReports,
      extraNeed: "",
    })
    setCurrentStep(1)
    setCurrentReportIndex(0)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Encuesta de Uso de Informes</h1>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={5}
          labels={["Datos", "Informes", "Páginas", "Sugerencias", "Resumen"]}
        />

        <Card className="mt-6">
          <CardContent className="pt-6">
            {currentStep === 1 && (
              <TeamForm onSubmit={handleTeamSubmit} initialName={surveyData.name} initialTeam={surveyData.team} />
            )}

            {currentStep === 2 && <ReportSelection reports={surveyData.reports} onSubmit={handleReportSelection} />}

            {currentStep === 3 && selectedReports.length > 0 && (
              <PageSelection
                report={selectedReports[currentReportIndex]}
                onSubmit={handlePageSelection}
                reportIndex={currentReportIndex + 1}
                totalReports={selectedReports.length}
                onBack={handlePreviousReport}
                onNext={handleNextReport}
                onFinish={handleFinishSurvey}
                canGoBack={currentReportIndex > 0}
                canGoNext={currentReportIndex < selectedReports.length - 1}
                isLastReport={currentReportIndex === selectedReports.length - 1}
              />
            )}

            {currentStep === 4 && (
              <ExtraNeedForm
                onSubmit={handleExtraNeedSubmit}
                onBack={() => setCurrentStep(3)}
                initialValue={surveyData.extraNeed}
              />
            )}

            {currentStep === 5 && <SurveySummary surveyData={surveyData} onReset={handleReset} />}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
