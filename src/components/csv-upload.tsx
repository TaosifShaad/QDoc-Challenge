"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Check, Loader2, X, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Patient } from "@/lib/types";

interface CsvUploadProps {
  onSuccess: () => void;
}

interface ParsedRow {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  chronicConditions: string[];
  riskFactors: string[];
}

export function CsvUpload({ onSuccess }: CsvUploadProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseFile = (file: File) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const parsed: ParsedRow[] = rows.map((row) => ({
          firstName: row.firstName || row.first_name || row["First Name"] || "",
          lastName: row.lastName || row.last_name || row["Last Name"] || "",
          dateOfBirth: row.dateOfBirth || row.date_of_birth || row.dob || row.DOB || "",
          gender: row.gender || row.Gender || "",
          email: row.email || row.Email || "",
          phone: row.phone || row.Phone || "",
          address: row.address || row.Address || "",
          chronicConditions: (row.chronicConditions || row.chronic_conditions || row["Chronic Conditions"] || "")
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean),
          riskFactors: (row.riskFactors || row.risk_factors || row["Risk Factors"] || "")
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean),
        }));
        setParsedData(parsed.filter((p) => p.firstName && p.lastName));
        toast.success(`Parsed ${parsed.length} records from CSV`);
      },
      error: (error) => {
        toast.error("Failed to parse CSV", {
          description: error.message,
        });
      },
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      parseFile(file);
    } else {
      toast.error("Please upload a CSV file");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          parsedData.map((p) => ({
            ...p,
            vaccinations: [],
          }))
        ),
      });

      if (!res.ok) throw new Error("Import failed");

      const result = await res.json();
      toast.success(`Successfully imported ${result.count} patients!`);
      setParsedData([]);
      setFileName(null);
      onSuccess();
    } catch (error) {
      toast.error("Failed to import patients");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "firstName,lastName,dateOfBirth,gender,email,phone,address,chronicConditions,riskFactors\nJohn,Doe,1990-05-15,Male,john@email.com,(204) 555-0000,123 Main St,Diabetes;Asthma,Healthcare Worker\nJane,Smith,1985-11-22,Female,jane@email.com,(204) 555-0001,456 Oak Ave,Heart Disease,Pregnant";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="qdoc-card border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-[#12455a]">
            Import Patients from CSV
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="border-[#116cb6] text-[#116cb6] hover:bg-[#d6e6f2]"
          >
            <Download className="mr-1 h-4 w-4" />
            Template
          </Button>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${isDragOver
                ? "border-[#116cb6] bg-[#d6e6f2]/50 scale-[1.01]"
                : "border-[#c2dcee] hover:border-[#116cb6]/50 hover:bg-[#f8fbfe]"
              }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
              id="csv-upload-input"
            />
            <div className="flex flex-col items-center gap-3">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${isDragOver ? "bg-[#116cb6]" : "bg-[#d6e6f2]"
                  }`}
              >
                <Upload
                  className={`h-8 w-8 ${isDragOver ? "text-white" : "text-[#116cb6]"
                    }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-[#12455a]">
                  {fileName ? (
                    <span className="flex items-center justify-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-[#8fc748]" />
                      {fileName}
                    </span>
                  ) : (
                    "Drag & drop a CSV file here, or click to browse"
                  )}
                </p>
                <p className="mt-1 text-xs text-[#5a7d8e]">
                  Supports: firstName, lastName, dateOfBirth, gender, email,
                  phone, address, chronicConditions (semicolon-separated),
                  riskFactors (semicolon-separated)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card className="qdoc-card border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#12455a]">
              Preview ({parsedData.length} records)
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setParsedData([]);
                  setFileName(null);
                }}
                className="border-[#d64545] text-[#d64545] hover:bg-[#fde8e8]"
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing}
                className="bg-[#8fc748] text-white hover:bg-[#7db63c]"
              >
                {importing ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1 h-4 w-4" />
                )}
                Import All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-[#c2dcee]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#eef4f9]">
                    <TableHead className="text-[#12455a]">Name</TableHead>
                    <TableHead className="text-[#12455a]">DOB</TableHead>
                    <TableHead className="text-[#12455a]">Gender</TableHead>
                    <TableHead className="text-[#12455a]">Email</TableHead>
                    <TableHead className="text-[#12455a]">Conditions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, i) => (
                    <TableRow key={i} className="hover:bg-[#f8fbfe]">
                      <TableCell className="font-medium text-[#12455a]">
                        {row.firstName} {row.lastName}
                      </TableCell>
                      <TableCell className="text-[#5a7d8e]">
                        {row.dateOfBirth}
                      </TableCell>
                      <TableCell className="text-[#5a7d8e]">
                        {row.gender}
                      </TableCell>
                      <TableCell className="text-[#5a7d8e]">
                        {row.email || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.chronicConditions.map((c) => (
                            <Badge
                              key={c}
                              variant="outline"
                              className="border-[#116cb6] text-[#116cb6] text-xs"
                            >
                              {c}
                            </Badge>
                          ))}
                          {row.chronicConditions.length === 0 && (
                            <span className="text-xs text-[#5a7d8e]">None</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
