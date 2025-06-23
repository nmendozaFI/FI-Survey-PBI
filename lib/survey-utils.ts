import  reportsData  from "../app/utils/informes-data.json"
import type { CompleteSurveyData } from "./database"

export type AllPagesData = {
  survey_id: string
  name: string
  team: string
  timestamp: string
  report_name: string
  page_name: string
  fulfills_purpose: "si" | "no" | "NO USADA"
  purpose: string
  page_status: "selected" | "not_selected"
}

export function combineWithAllPages(surveyData: CompleteSurveyData[]): AllPagesData[] {
  const result: AllPagesData[] = []

  // Agrupar datos por encuesta
  const surveyGroups = surveyData.reduce(
    (acc, item) => {
      if (!acc[item.survey_id]) {
        acc[item.survey_id] = {
          survey_info: {
            survey_id: item.survey_id,
            name: item.name,
            team: item.team,
            timestamp: item.timestamp,
          },
          selected_pages: [],
        }
      }
      acc[item.survey_id].selected_pages.push({
        report_name: item.report_name,
        page_name: item.page_name,
        fulfills_purpose: item.fulfills_purpose,
        purpose: item.purpose,
      })
      return acc
    },
    {} as Record<
      string,
      {
        survey_info: {
          survey_id: string
          name: string
          team: string
          timestamp: string
        }
        selected_pages: Array<{
          report_name: string
          page_name: string
          fulfills_purpose: "si" | "no" | "NO USADA"
          purpose: string
        }>
      }
    >,
  )

  // Para cada encuesta, generar todas las páginas
  Object.values(surveyGroups).forEach((survey) => {
    // Crear un mapa de páginas seleccionadas para búsqueda rápida
    const selectedPagesMap = new Map<string, { fulfills_purpose: "si" | "no"| "NO USADA"; purpose: string }>()

    survey.selected_pages.forEach((page) => {
      const key = `${page.report_name}|||${page.page_name}`
      selectedPagesMap.set(key, {
        fulfills_purpose: page.fulfills_purpose,
        purpose: page.purpose,
      })
    })

    // Iterar sobre todos los informes y páginas
    reportsData.forEach((report) => {
      report.pages.forEach((page) => {
        const key = `${report.name}|||${page.name}`
        const selectedPage = selectedPagesMap.get(key)

        if (selectedPage) {
          // Página seleccionada
          result.push({
            survey_id: survey.survey_info.survey_id,
            name: survey.survey_info.name,
            team: survey.survey_info.team,
            timestamp: survey.survey_info.timestamp,
            report_name: report.name,
            page_name: page.name,
            fulfills_purpose: selectedPage.fulfills_purpose,
            purpose: selectedPage.purpose,
            page_status: "selected",
          })
        } else {
          // Página NO seleccionada
          result.push({
            survey_id: survey.survey_info.survey_id,
            name: survey.survey_info.name,
            team: survey.survey_info.team,
            timestamp: survey.survey_info.timestamp,
            report_name: report.name,
            page_name: page.name,
            fulfills_purpose:"NO USADA",
            purpose: "",
            page_status: "not_selected",
          })
        }
      })
    })
  })

  return result
}

export function combineWithAllPagesForSingleSurvey(
  surveyInfo: {
    survey_id: string
    name: string
    team: string
    timestamp: string
  },
  selectedPages: Array<{
    report_name: string
    page_name: string
    fulfills_purpose: "si" | "no"
    purpose: string
  }>,
): AllPagesData[] {
  const result: AllPagesData[] = []

  // Crear un mapa de páginas seleccionadas para búsqueda rápida
  const selectedPagesMap = new Map<string, { fulfills_purpose: "si" | "no"; purpose: string }>()

  selectedPages.forEach((page) => {
    const key = `${page.report_name}|||${page.page_name}`
    selectedPagesMap.set(key, {
      fulfills_purpose: page.fulfills_purpose,
      purpose: page.purpose,
    })
  })

  // Iterar sobre todos los informes y páginas
  reportsData.forEach((report) => {
    report.pages.forEach((page) => {
      const key = `${report.name}|||${page.name}`
      const selectedPage = selectedPagesMap.get(key)

      if (selectedPage) {
        // Página seleccionada
        result.push({
          survey_id: surveyInfo.survey_id,
          name: surveyInfo.name,
          team: surveyInfo.team,
          timestamp: surveyInfo.timestamp,
          report_name: report.name,
          page_name: page.name,
          fulfills_purpose: selectedPage.fulfills_purpose,
          purpose: selectedPage.purpose,
          page_status: "selected",
        })
      } else {
        // Página NO seleccionada
        result.push({
          survey_id: surveyInfo.survey_id,
          name: surveyInfo.name,
          team: surveyInfo.team,
          timestamp: surveyInfo.timestamp,
          report_name: report.name,
          page_name: page.name,
          fulfills_purpose: "NO USADA",
          purpose: "",
          page_status: "not_selected",
        })
      }
    })
  })

  return result
}
