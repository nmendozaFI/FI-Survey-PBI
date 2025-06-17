/* eslint-disable @typescript-eslint/no-explicit-any */
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

export type SurveyResult = {
  id?: number;
  survey_id: string;
  name: string;
  team: string;
  timestamp: string;
  extra_need?: string;
  responses: SurveyResponse[];
};

export type SurveyResponse = {
  id?: number;
  survey_id: string;
  report_name: string;
  page_name: string;
  fulfills_purpose: "si" | "no";
  purpose: string;
};

export type FlattenedSurveyData = {
  survey_id: string;
  name: string;
  team: string;
  timestamp: string;
  report_name: string;
  page_name: string;
  fulfills_purpose: "si" | "no";
  purpose: string;
};

// Guardar una nueva encuesta
export async function saveSurveyResult(surveyData: {
  name: string;
  team: string;
  extra_need?: string;
  responses: Array<{
    report_name: string;
    page_name: string;
    fulfills_purpose: "si" | "no";
    purpose: string;
  }>;
}): Promise<{ success: boolean; survey_id?: string; error?: string }> {
  console.log("Saving survey result:", surveyData);
  try {
    const survey_id = Date.now().toString();

    // Insertar el resultado de la encuesta
    await sql`
      INSERT INTO survey_results (survey_id, name, team, extra_need)
      VALUES (${survey_id}, ${surveyData.name}, ${surveyData.team}, ${surveyData.extra_need || ""})
    `;

    // Insertar todas las respuestas
    if (surveyData.responses.length > 0) {
      const responseValues = surveyData.responses.map((response) => [
        survey_id,
        response.report_name,
        response.page_name,
        response.fulfills_purpose,
        response.purpose || "",
      ]);

      for (const response of responseValues) {
        await sql`
          INSERT INTO survey_responses (survey_id, report_name, page_name, fulfills_purpose, purpose)
          VALUES (${response[0]}, ${response[1]}, ${response[2]}, ${response[3]}, ${response[4]})
        `;
      }
    }

    return { success: true, survey_id };
  } catch (error) {
    console.error("Error saving survey result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Obtener todas las encuestas
export async function getAllSurveyResults(): Promise<SurveyResult[]> {
  try {
    const results = await sql`
      SELECT 
        sr.id,
        sr.survey_id,
        sr.name,
        sr.team,
        sr.timestamp,
        sr.extra_need,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', resp.id,
              'survey_id', resp.survey_id,
              'report_name', resp.report_name,
              'page_name', resp.page_name,
              'fulfills_purpose', resp.fulfills_purpose,
              'purpose', resp.purpose
            ) ORDER BY resp.id
          ) FILTER (WHERE resp.id IS NOT NULL),
          '[]'::json
        ) as responses
      FROM survey_results sr
      LEFT JOIN survey_responses resp ON sr.survey_id = resp.survey_id
      GROUP BY sr.id, sr.survey_id, sr.name, sr.team, sr.timestamp, sr.extra_need
      ORDER BY sr.timestamp DESC
    `;

    return results.map((row: any) => ({
      id: row.id,
      survey_id: row.survey_id,
      name: row.name,
      team: row.team,
      timestamp: row.timestamp,
      extra_need: row.extra_need || "",
      responses: Array.isArray(row.responses) ? row.responses : [],
    }));
  } catch (error) {
    console.error("Error fetching survey results:", error);
    return [];
  }
}

// Obtener datos aplanados para exportación
export async function getFlattenedSurveyData(): Promise<FlattenedSurveyData[]> {
  try {
    const results = await sql`
      SELECT 
        sr.survey_id,
        sr.name,
        sr.team,
        sr.timestamp,
        resp.report_name,
        resp.page_name,
        resp.fulfills_purpose,
        resp.purpose
      FROM survey_results sr
      INNER JOIN survey_responses resp ON sr.survey_id = resp.survey_id
      ORDER BY sr.timestamp DESC, resp.id
    `;

    return results.map((row: any) => ({
      survey_id: row.survey_id,
      name: row.name,
      team: row.team,
      timestamp: row.timestamp,
      report_name: row.report_name,
      page_name: row.page_name,
      fulfills_purpose: row.fulfills_purpose,
      purpose: row.purpose || "",
    }));
  } catch (error) {
    console.error("Error fetching flattened survey data:", error);
    return [];
  }
}

// Eliminar una encuesta
export async function deleteSurveyResult(
  survey_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      DELETE FROM survey_results WHERE survey_id = ${survey_id}
    `;

    return { success: true };
  } catch (error) {
    console.error("Error deleting survey result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Obtener estadísticas
export async function getSurveyStats(): Promise<{
  total_surveys: number;
  total_responses: number;
  teams: string[];
  fulfills_purpose_stats: { si: number; no: number };
}> {
  try {
    const [surveyCount, responseCount, teamList, purposeStats] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM survey_results`,
        sql`SELECT COUNT(*) as count FROM survey_responses`,
        sql`SELECT DISTINCT team FROM survey_results ORDER BY team`,
        sql`
        SELECT 
          fulfills_purpose,
          COUNT(*) as count
        FROM survey_responses 
        GROUP BY fulfills_purpose
      `,
      ]);

    const purposeStatsObj = purposeStats.reduce(
      (acc: any, row: any) => {
        acc[row.fulfills_purpose] = Number.parseInt(row.count);
        return acc;
      },
      { si: 0, no: 0 }
    );

    return {
      total_surveys: Number.parseInt(surveyCount[0].count),
      total_responses: Number.parseInt(responseCount[0].count),
      teams: teamList.map((row: any) => row.team),
      fulfills_purpose_stats: purposeStatsObj,
    };
  } catch (error) {
    console.error("Error fetching survey stats:", error);
    return {
      total_surveys: 0,
      total_responses: 0,
      teams: [],
      fulfills_purpose_stats: { si: 0, no: 0 },
    };
  }
}

// Obtener solo las sugerencias (extra_need) para exportación separada
export async function getExtraNeedsData(): Promise<
  Array<{
    name: string
    team: string
    extra_need: string
    timestamp: string
  }>
> {
  try {
    const results = await sql`
      SELECT name, team, extra_need, timestamp
      FROM survey_results 
      WHERE extra_need IS NOT NULL AND extra_need != ''
      ORDER BY timestamp DESC
    `

    return results.map((row: any) => ({
      name: row.name,
      team: row.team,
      extra_need: row.extra_need,
      timestamp: row.timestamp,
    }))
  } catch (error) {
    console.error("Error fetching extra needs data:", error)
    return []
  }
}
