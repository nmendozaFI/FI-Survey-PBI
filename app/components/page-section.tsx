"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import type { Report } from "@/app/page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageSelectionProps {
  report: Report;
  reportIndex: number;
  totalReports: number;
  onSubmit: (
    reportId: string,
    pages: {
      id: string;
      name: string;
      purpose?: string;
      selected?: boolean;
      fulfillsPurpose?: string;
    }[]
  ) => void;
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isLastReport?: boolean;
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
      fulfillsPurpose: page.fulfillsPurpose ? page.fulfillsPurpose : "si",
    }))
  );
  const [error, setError] = useState("");
  const [tempPurpose, setTempPurpose] = useState<{
    [pageId: string]: { why: string; forWhat: string; info: string };
  }>({});

  const handleTempPurposeChange = (
    pageId: string,
    field: "why" | "forWhat" | "info",
    value: string
  ) => {
    const updated = {
      ...tempPurpose[pageId],
      [field]: value,
    };

    setTempPurpose((prev) => ({
      ...prev,
      [pageId]: updated,
    }));

    // Concatenamos las tres partes en una sola string
    const combinedPurpose = `${updated.why} | ${updated.forWhat} | ${updated.info}`;
    handlePurposeChange(pageId, combinedPurpose);
  };

  // Update pages when report changes
  useEffect(() => {
    setPages(
      report.pages.map((page) => ({
        ...page,
        selected: page.selected || false,
        purpose: page.purpose || "",
        fulfillsPurpose: page.fulfillsPurpose ? page.fulfillsPurpose : "si",
      }))
    );
    setError("");
  }, [report]);

  const handleTogglePage = (pageId: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === pageId ? { ...page, selected: !page.selected } : page
      )
    );
    setError("");
  };

  const handlePurposeChange = (pageId: string, purpose: string) => {
    setPages((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, purpose } : page))
    );
  };

  const handleFulfillsPurposeChange = (
    pageId: string,
    fulfillsPurpose: string
  ) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === pageId ? { ...page, fulfillsPurpose } : page
      )
    );
  };

  const validateAndSave = () => {
    const selectedPages = pages.filter((page) => page.selected);

    if (selectedPages.length === 0) {
      setError("Por favor seleccione al menos una página");
      return false;
    }

    const hasEmptyFulfillsPurpose = selectedPages.some(
      (page) => !page.fulfillsPurpose?.trim()
    );

    if (hasEmptyFulfillsPurpose) {
      setError(
        "Por favor responda si cada página seleccionada cumple su propósito"
      );
      return false;
    }

    const hasEmptyPurpose = selectedPages.some(
      (page) => page.fulfillsPurpose === "no" && !page.purpose?.trim()
    );

    if (hasEmptyPurpose) {
      setError(
        "Por favor complete el propósito para todas las páginas que no cumplen su función"
      );
      return false;
    }

    // Save current report data
    onSubmit(report.id, pages);
    return true;
  };

  const handleBack = () => {
    // Save current state before going back
    onSubmit(report.id, pages);
    if (onBack) onBack();
  };

  const handleNext = () => {
    if (validateAndSave() && onNext) {
      onNext();
    }
  };

  const handleFinish = () => {
    if (validateAndSave() && onFinish) {
      onFinish();
    }
  };

  const selectedPagesCount = pages.filter((page) => page.selected).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{report.name}</h2>
        <h2 className="text-xl font-semibold">
          Estamos en el Informe {reportIndex} de los {totalReports} que
          seleccionaste.
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecciona las páginas que utilizas de este informe
        </p>
        {selectedPagesCount > 0 && (
          <p className="text-sm text-green-600">
            {selectedPagesCount} página{selectedPagesCount !== 1 ? "s" : ""}{" "}
            seleccionada
            {selectedPagesCount !== 1 ? "s" : ""}
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-6 mt-4 max-h-96 overflow-y-auto">
          {pages.map((page) => (
            <div key={page.id} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${report.id}-${page.id}`}
                  checked={page.selected}
                  onCheckedChange={() => handleTogglePage(page.id)}
                />
                <Label
                  htmlFor={`${report.id}-${page.id}`}
                  className="cursor-pointer flex-1"
                >
                  {page.name}
                </Label>
              </div>

              {page.selected && (
                <div className="ml-6 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`${report.id}-${page.id}-fulfills`}
                        className="text-sm font-medium"
                      >
                        ¿Cumple su propósito?
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleAlert size={20} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {" "}
                            ¿La información de la página os sirve así? o
                            necesitas trabajarla por aparte.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <Select
                      value={page.fulfillsPurpose}
                      onValueChange={(value) =>
                        handleFulfillsPurposeChange(page.id, value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {page.fulfillsPurpose === "no" && (
                    <div>
                      <Label
                        htmlFor={`${report.id}-${page.id}-why`}
                        className="text-sm font-medium"
                      >
                        ¿Por qué?
                      </Label>
                      <Input
                        id={`${report.id}-${page.id}-why`}
                        placeholder="Por que tengo que descargar un excel y trabajarlo por aparte, por que es mejor la base..."
                        value={tempPurpose[page.id]?.why || ""}
                        onChange={(e) =>
                          handleTempPurposeChange(
                            page.id,
                            "why",
                            e.target.value
                          )
                        }
                        className={`mt-1 ${
                          error &&
                          page.fulfillsPurpose === "no" &&
                          !page.purpose.trim()
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />

                      <Label
                        htmlFor={`${report.id}-${page.id}-forWhat`}
                        className="text-sm font-medium"
                      >
                        ¿Para qué utilizas esta página?
                      </Label>
                      <Input
                        id={`${report.id}-${page.id}-forWhat`}
                        placeholder="La uso para ver los datos de las socias..."
                        value={tempPurpose[page.id]?.forWhat || ""}
                        onChange={(e) =>
                          handleTempPurposeChange(
                            page.id,
                            "forWhat",
                            e.target.value
                          )
                        }
                        className={`mt-1 ${
                          error &&
                          page.fulfillsPurpose === "no" &&
                          !page.purpose.trim()
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />

                      <Label
                        htmlFor={`${report.id}-${page.id}-info`}
                        className="text-sm font-medium"
                      >
                        ¿Qué información te gustaría que tuviera?
                      </Label>
                      <Input
                        id={`${report.id}-${page.id}-info`}
                        placeholder="En la tabla, me gustaria poder ver el movil... "
                        value={tempPurpose[page.id]?.info || ""}
                        onChange={(e) =>
                          handleTempPurposeChange(
                            page.id,
                            "info",
                            e.target.value
                          )
                        }
                        className={`mt-1 ${
                          error &&
                          page.fulfillsPurpose === "no" &&
                          !page.purpose.trim()
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <div className="flex gap-3 flex-1">
          {canGoBack && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
          )}

          {canGoNext && !isLastReport && (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          )}
        </div>

        {isLastReport && (
          <Button
            onClick={handleFinish}
            className="bg-green-600 hover:bg-green-700"
          >
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
