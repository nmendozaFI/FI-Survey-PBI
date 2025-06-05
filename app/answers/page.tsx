"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileDown,
  Bug,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

type SurveyResponse = {
  id?: number;
  survey_id: string;
  report_name: string;
  page_name: string;
  fulfills_purpose: "si" | "no";
  purpose: string;
};

type SurveyResult = {
  id?: number;
  survey_id: string;
  name: string;
  team: string;
  timestamp: string;
  responses: SurveyResponse[];
};

export default function AnswersPage() {
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyResult | null>(
    null
  );
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/surveys");
      const data = await response.json();

      if (response.ok) {
        setSurveyResults(data.surveys || []);
        console.log("Surveys loaded:", data.surveys?.length || 0);
      } else {
        setError(data.error || "Error al cargar las encuestas");
      }
    } catch (err) {
      setError("Error de conexión al cargar las encuestas");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const downloadExcel = async (survey: SurveyResult) => {
    if (!survey.responses || survey.responses.length === 0) {
      alert("No hay datos para descargar en esta encuesta.");
      return;
    }

    try {
      const dataForExcel = survey.responses.map((response) => ({
        Nombre: survey.name,
        Equipo: survey.team,
        Fecha: new Date(survey.timestamp).toLocaleDateString("es-ES"),
        Informe: response.report_name,
        Página: response.page_name,
        "¿Cumple su propósito?":
          response.fulfills_purpose === "si" ? "Sí" : "No",
        "Propósito alternativo": response.purpose,
      }));

      const headers = [
        "Nombre",
        "Equipo",
        "Fecha",
        "Informe",
        "Página",
        "¿Cumple su propósito?",
        "Propósito alternativo",
      ];
      const csvContent = [
        headers.join(","),
        ...dataForExcel.map((row) =>
          headers
            .map((header) => `"${row[header as keyof typeof row] || ""}"`)
            .join(",")
        ),
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `encuesta-${survey.name.replace(/\s+/g, "-")}-${survey.survey_id}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar:", error);
      alert("Error al generar la descarga");
    }
  };

  const downloadAllExcel = async () => {
    setIsDownloadingAll(true);

    try {
      const response = await fetch("/api/surveys/export");

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `todas-las-encuestas-${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Error al descargar todas las encuestas");
      }
    } catch (error) {
      console.error("Error al descargar todas las encuestas:", error);
      alert("Error de conexión al descargar");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const deleteSurvey = async (survey_id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta encuesta?")) {
      return;
    }

    try {
      const response = await fetch(`/api/surveys/${survey_id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSurveyResults((prev) =>
          prev.filter((survey) => survey.survey_id !== survey_id)
        );
        if (selectedSurvey?.survey_id === survey_id) {
          setSelectedSurvey(null);
        }
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar la encuesta");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error de conexión al eliminar");
    }
  };

  const getTotalPages = (survey: SurveyResult) => {
    return survey.responses?.length || 0;
  };

  const getTotalReports = (survey: SurveyResult) => {
    if (!survey.responses) return 0;
    const uniqueReports = new Set(
      survey.responses.map((response) => response.report_name)
    );
    return uniqueReports.size;
  };

  const getTotalResponses = () => {
    return surveyResults.reduce((total, survey) => {
      return total + (survey.responses?.length || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando encuestas...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSurveys}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </main>
    );
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
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSurveys}
              className="flex items-center gap-2"
            >
            <RefreshCw size={16} />
              Actualizar
            </Button>
             {surveyResults.length > 0 && (
              <Button onClick={downloadAllExcel} disabled={isDownloadingAll} className="flex items-center gap-2">
                <FileDown size={18} />
                Descargar Todas ({surveyResults.length}) respuestas
              </Button>
            )}
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
                  <div key={survey.survey_id} className="border-l-2 border-yellow-300 pl-4">
                    <div>
                      <strong>Encuesta {index + 1}:</strong> {survey.name} ({survey.team})
                    </div>
                    <div>ID: {survey.survey_id}</div>
                    <div>Timestamp: {survey.timestamp}</div>
                    <div>Respuestas: {survey.responses?.length || 0}</div>
                    <div>Informes únicos: {getTotalReports(survey)}</div>
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
                      key={survey.survey_id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSurvey?.survey_id === survey.survey_id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
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
                          disabled={!survey.responses || survey.responses.length === 0}
                        >
                          <Download size={14} />
                          Excel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSurvey(survey.survey_id)
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
                          <TableHead>¿Cumple su propósito?</TableHead>
                          <TableHead>Propósito alternativo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSurvey.responses && selectedSurvey.responses.length > 0 ? (
                          selectedSurvey.responses.map((response, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{response.report_name}</TableCell>
                              <TableCell>{response.page_name}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    response.fulfills_purpose === "si"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {response.fulfills_purpose === "si" ? "Sí" : "No"}
                                </span>
                              </TableCell>
                              <TableCell>{response.purpose}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No hay respuestas en esta encuesta
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Button
                    onClick={() => downloadExcel(selectedSurvey)}
                    className="w-full"
                    disabled={!selectedSurvey.responses || selectedSurvey.responses.length === 0}
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
  );
}
