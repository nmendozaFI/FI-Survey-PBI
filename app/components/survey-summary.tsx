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
import { Download, RotateCcw } from "lucide-react";


interface SurveySummaryProps {
  surveyData: SurveyData;
  onReset: () => void;
}

export default function SurveySummary({
  surveyData,
  onReset,
}: SurveySummaryProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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
      purpose: page.purpose || "",
    }));
  });

  console.log("=== DATOS EN SURVEY SUMMARY ===");
  console.log("surveyData completo:", surveyData);
  console.log("selectedReports:", selectedReports);
  console.log("flattenedData:", flattenedData);
  console.log("=== FIN SURVEY SUMMARY ===");

  const saveToLocalStorage = () => {
    // Guardar exactamente los mismos datos que se muestran en la tabla
    const surveyResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      name: surveyData.name,
      team: surveyData.team,
      // Guardar los datos aplanados directamente para evitar problemas de estructura
      flattenedData: flattenedData,
      // También guardar la estructura original por compatibilidad
      reports: selectedReports,
    };

    console.log("=== GUARDANDO EN LOCALSTORAGE ===");
    console.log("Datos a guardar:", surveyResult);

    const existingResults = JSON.parse(
      localStorage.getItem("surveyResults") || "[]"
    );
    existingResults.push(surveyResult);
    localStorage.setItem("surveyResults", JSON.stringify(existingResults));

    console.log("Datos guardados exitosamente");
    console.log("=== FIN GUARDADO ===");
  };

  // Llamar a saveToLocalStorage cuando se monta el componente
  useState(() => {
    saveToLocalStorage();
  });

  const downloadCSV = () => {
    setIsDownloading(true);

    try {
      const headers = ["Nombre", "Equipo", "Informe", "Página", "Propósito"];
      const csvContent = [
        headers.join(","),
        ...flattenedData.map((row) =>
          [
            `"${row.name}"`,
            `"${row.team}"`,
            `"${row.reportName}"`,
            `"${row.pageName}"`,
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
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          ¡Encuesta Completada!
        </h2>
        <p className="text-muted-foreground">
          Gracias por completar la encuesta. Los datos han sido guardados
          correctamente. 
          Puedes descargar los resultados y cerrar esta ventanta. 
        </p>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">
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
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Informe</TableHead>
              <TableHead>Página</TableHead>
              <TableHead>Propósito</TableHead>
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
                  <TableCell>{item.purpose}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
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
      </div>
    </div>
  );
}
