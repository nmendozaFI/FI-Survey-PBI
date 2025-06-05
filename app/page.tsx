"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

import reportsData from "./utils/informes-data.json"
import StepIndicator from "./components/step-indicator"
import TeamForm from "./components/team-form"
import ReportSelection from "./components/report-section"
import PageSelection from "./components/page-section"
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
}

const initialReports: Report[] = reportsData

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [surveyData, setSurveyData] = useState<SurveyData>({
    name: "",
    team: "",
    reports: initialReports,
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
    pages: { id: string; name: string; purpose?: string; selected?: boolean, fulfillsPurpose?: string }[],
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
    // Save survey data to localStorage
    const surveyResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      name: surveyData.name,
      team: surveyData.team,
      reports: surveyData.reports.filter((report) => report.selected),
    }

    const existingResults = JSON.parse(localStorage.getItem("surveyResults") || "[]")
    existingResults.push(surveyResult)
    localStorage.setItem("surveyResults", JSON.stringify(existingResults))

    setCurrentStep(4)
  }

  const handleReset = () => {
    setSurveyData({
      name: "",
      team: "",
      reports: initialReports,
    })
    setCurrentStep(1)
    setCurrentReportIndex(0)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Encuesta de Uso de Power BI</h1>

        <StepIndicator currentStep={currentStep} totalSteps={4} labels={["Datos", "Informes", "Páginas", "Resumen"]} />

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

            {currentStep === 4 && <SurveySummary surveyData={surveyData} onReset={handleReset} />}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

