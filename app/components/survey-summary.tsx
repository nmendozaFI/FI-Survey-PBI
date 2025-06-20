"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SurveyData } from "@/app/page";
import {
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";

interface SurveySummaryProps {
  surveyData: SurveyData;
  onReset: () => void;
}

export default function SurveySummary({
  surveyData,
  onReset,
}: SurveySummaryProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [saveMessage, setSaveMessage] = useState("");

  const selectedReports = surveyData.reports.filter(
    (report) => report.selected
  );

  const flattenedData = selectedReports.flatMap((report) => {
    const selectedPages = report.pages.filter((page) => page.selected);
    return selectedPages.map((page) => ({
      name: surveyData.name,
      team: surveyData.team,
      reportName: report.name,
      pageName: page.name,
      fulfillsPurpose: page.fulfillsPurpose || "",
      purpose: page.purpose || "",
    }));
  });

  const saveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const responses = flattenedData.map((item) => ({
        report_name: item.reportName,
        page_name: item.pageName,
        fulfills_purpose: item.fulfillsPurpose as "si" | "no",
        purpose: item.purpose,
      }));

      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: surveyData.name,
          team: surveyData.team,
          extra_need: surveyData.extraNeed,
          responses,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSaveStatus("success");
        setSaveMessage(
          "Encuesta guardada exitosamente, puedes cerrar esta ventana."
        );
        console.log("Survey saved with ID:", result.survey_id);
      } else {
        setSaveStatus("error");
        setSaveMessage(result.error || "Error al guardar la encuesta");
        console.error("Save error:", result.error);
      }
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage("Error de conexión al guardar la encuesta");
      console.error("Network error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  //   // Guardar automáticamente cuando se monta el componente
  // useEffect(() => {
  //   if (flattenedData.length > 0) {
  //     saveToDatabase()
  //   }
  // }, []) // Solo se ejecuta una vez

  const downloadCSV = () => {
    setIsDownloading(true);

    try {
      const headers = [
        "Nombre",
        "Equipo",
        "Informe",
        "Página",
        "¿Cumple su propósito?",
        "Propósito alternativo",
      ];
      const csvContent = [
        headers.join(","),
        ...flattenedData.map((row) =>
          [
            `"${row.name}"`,
            `"${row.team}"`,
            `"${row.reportName}"`,
            `"${row.pageName}"`,
            `"${
              row.fulfillsPurpose === "si"
                ? "Sí"
                : row.fulfillsPurpose === "no"
                ? "No"
                : ""
            }"`,
            `"${row.purpose}"`,
          ].join(",")
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
        `encuesta-${surveyData.name.replace(/\s+/g, "-")}-${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar CSV:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-orange-800 mb-2">
          ¡Encuesta completada!
        </h2>
        <p className="text-muted-foreground">
          Gracias por completar la encuesta. Recuerda{" "}
          <b className="text-green-600 text-2xl">Guardar y enviar</b> antes de cerrar.
        </p>
      </div>
      {/* Estado de guardado */}
      {(isSaving || saveStatus !== "idle") && (
        <div
          className={`p-4 border rounded-lg ${
            saveStatus === "success"
              ? "bg-green-50 border-green-200"
              : saveStatus === "error"
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            {saveStatus === "success" && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {saveStatus === "error" && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                saveStatus === "success"
                  ? "text-green-800"
                  : saveStatus === "error"
                  ? "text-red-800"
                  : "text-blue-800"
              }`}
            >
              {isSaving ? "Guardando encuesta..." : saveMessage}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="font-semibold text-orange-800 mb-2">
          Resumen de la Encuesta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Nombre:</span> {surveyData.name}
          </div>
          <div>
            <span className="font-medium">Equipo:</span> {surveyData.team}
          </div>
          <div>
            <span className="font-medium">Informes seleccionados:</span>{" "}
            {selectedReports.length}
          </div>
          <div>
            <span className="font-medium">Total páginas:</span>{" "}
            {flattenedData.length}
          </div>
        </div>
        {surveyData.extraNeed && (
          <div className="mt-4 pt-4 border-t border-blue-300">
            <div>
              <span className="font-medium text-blue-800">
                Sugerencia adicional:
              </span>
              <p className="mt-1 text-sm text-blue-700 bg-blue-100 p-2 rounded">
                {surveyData.extraNeed}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Informe</TableHead>
              <TableHead>Página</TableHead>
              <TableHead>¿Cumple su propósito?</TableHead>
              <TableHead>Proposito alternativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedData.length > 0 ? (
              flattenedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.reportName}
                  </TableCell>
                  <TableCell>{item.pageName}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.fulfillsPurpose === "si"
                          ? "bg-green-100 text-green-800"
                          : item.fulfillsPurpose === "no"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.fulfillsPurpose === "si"
                        ? "Sí"
                        : item.fulfillsPurpose === "no"
                        ? "No"
                        : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>{item.purpose}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No hay datos seleccionados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={downloadCSV}
          className="flex items-center gap-2"
          disabled={isDownloading || flattenedData.length === 0}
        >
          <Download size={16} />
          Descargar Resultados
        </Button>

        <Button
          variant="outline"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Nueva Encuesta
        </Button>

        <Button
          onClick={saveToDatabase}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
          disabled={isDownloading || flattenedData.length === 0}
        >
          <Save size={16} />
          Guardar y Enviar
        </Button>
      </div>
      <hr />
      <p className="text-muted-foreground">
        Si deseas, puedes descargar los resultados en formato CSV.
      </p>
      {/* Estado de guardado */}
      {(isSaving || saveStatus !== "idle") && (
        <div
          className={`p-4 border rounded-lg ${
            saveStatus === "success"
              ? "bg-green-50 border-green-200"
              : saveStatus === "error"
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            {saveStatus === "success" && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {saveStatus === "error" && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                saveStatus === "success"
                  ? "text-green-800"
                  : saveStatus === "error"
                  ? "text-red-800"
                  : "text-blue-800"
              }`}
            >
              {isSaving ? "Guardando encuesta..." : saveMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
