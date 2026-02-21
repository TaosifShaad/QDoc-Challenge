import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const OCR_TIMEOUT_MS = 120_000;
const workerPath = path.join(
  process.cwd(),
  "node_modules",
  "tesseract.js",
  "src",
  "worker-script",
  "node",
  "index.js"
);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

async function runOcr(image: Buffer): Promise<string> {
  const tesseractModule = await import("tesseract.js");
  const tesseract = (tesseractModule.default ??
    tesseractModule) as {
    recognize: (
      image: Buffer,
      lang: string,
      options?: { langPath?: string; gzip?: boolean; workerPath?: string }
    ) => Promise<{ data: { text: string } }>;
  };
  const engDataModule = await import("@tesseract.js-data/eng");
  const engData = (engDataModule.default ?? engDataModule) as {
    langPath?: string;
    gzip?: boolean;
  };
  return withTimeout(
    tesseract
      .recognize(image, "eng", {
        langPath: engData.langPath,
        gzip: engData.gzip ?? true,
        workerPath,
      })
      .then((result) => result.data.text),
    OCR_TIMEOUT_MS,
    `OCR timed out after ${Math.floor(OCR_TIMEOUT_MS / 1000)} seconds.`
  );
}

type ExtractedFields = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  documentTitle?: string;
  issuingProvince?: string;
  country?: string;
  pageIndicator?: string;
  vaccinesAdministered?: number;
  issuedOn?: string;
};

type ExtractedVaccination = {
  date?: string;
  product?: string;
  lot?: string;
};

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  janvier: 1,
  feb: 2,
  february: 2,
  fev: 2,
  fevr: 2,
  fevrier: 2,
  février: 2,
  mar: 3,
  march: 3,
  mars: 3,
  apr: 4,
  april: 4,
  avr: 4,
  avril: 4,
  may: 5,
  mai: 5,
  jun: 6,
  june: 6,
  juin: 6,
  jul: 7,
  july: 7,
  juil: 7,
  juillet: 7,
  aug: 8,
  august: 8,
  aout: 8,
  août: 8,
  sep: 9,
  sept: 9,
  september: 9,
  septembre: 9,
  oct: 10,
  october: 10,
  octobre: 10,
  nov: 11,
  november: 11,
  novembre: 11,
  dec: 12,
  december: 12,
  decembre: 12,
  décembre: 12,
};

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
];

const COUNTRIES = ["Canada", "United States", "USA", "U.S.A."];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeYear(value: number): number {
  if (value >= 100) return value;
  return value >= 40 ? 1900 + value : 2000 + value;
}

function isoFromParts(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseDateToIso(input: string): string | null {
  const text = input.replace(/[|]/g, " ").trim();
  if (!text) return null;

  const isoMatch = text.match(/\b(19|20)\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/);
  if (isoMatch) return isoMatch[0];

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const bilingualMonthMatch = normalized.match(
    /\b(\d{1,2})\s+([A-Za-z]{3,12})\s*\/\s*([A-Za-z]{3,12})\s+(\d{2,4})\b/
  );
  if (bilingualMonthMatch) {
    const day = Number(bilingualMonthMatch[1]);
    const monthLeft = MONTH_MAP[bilingualMonthMatch[2].toLowerCase()];
    const monthRight = MONTH_MAP[bilingualMonthMatch[3].toLowerCase()];
    const month = monthLeft ?? monthRight;
    const year = normalizeYear(Number(bilingualMonthMatch[4]));
    if (month) return isoFromParts(year, month, day);
  }

  const monthWordMatch = normalized.match(
    /\b(\d{1,2})\s*[-\s\/]?\s*([A-Za-z]{3,12})\s*[-,\s\/]?\s*(\d{2,4})\b/
  );
  if (monthWordMatch) {
    const day = Number(monthWordMatch[1]);
    const month = MONTH_MAP[monthWordMatch[2].toLowerCase()];
    const year = normalizeYear(Number(monthWordMatch[3]));
    if (month) return isoFromParts(year, month, day);
  }

  const slashMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const year = normalizeYear(Number(slashMatch[3]));
    const day = a > 12 ? a : b;
    const month = a > 12 ? b : a;
    return isoFromParts(year, month, day);
  }

  return null;
}

function splitName(fullName: string): { firstName?: string; lastName?: string } {
  const clean = fullName.replace(/\s+/g, " ").trim();
  if (!clean) return {};
  if (clean.includes(",")) {
    const [last, first] = clean.split(",", 2).map((s) => s.trim());
    return { firstName: first || undefined, lastName: last || undefined };
  }
  const parts = clean.split(" ");
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function parseOcrText(rawText: string): {
  fields: ExtractedFields;
  vaccinations: ExtractedVaccination[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const text = rawText.replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const fields: ExtractedFields = {};

  const nameMatch =
    text.match(/\b(?:Patient\s*Name|Name|Nom)\s*[:\-]\s*([^\n]+)/i) ||
    text.match(/\b(?:Client|Recipient|Titulaire)\s*[:\-]\s*([^\n]+)/i) ||
    text.match(/\b(?:Name\s*\/\s*Nom|Nom\s*\/\s*Name)\s*[:\-]?\s*([^\n]+)/i);
  if (nameMatch?.[1]) {
    fields.fullName = cleanLine(nameMatch[1]);
    const split = splitName(fields.fullName);
    fields.firstName = split.firstName;
    fields.lastName = split.lastName;
  }

  const dobMatch = text.match(
    /\b(?:Date\s*of\s*Birth|DOB|Date\s*de\s*naissance|Naissance)\s*[:\-]?\s*([^\n]+)/i
  );
  if (dobMatch?.[1]) {
    fields.dateOfBirth = parseDateToIso(dobMatch[1]) ?? undefined;
  }

  fields.documentTitle = lines.find((line) =>
    /proof of vaccination|vaccination record|immunization/i.test(line)
  );
  fields.issuingProvince = PROVINCES.find((province) =>
    new RegExp(`\\b${province.replace(/\s+/g, "\\s+")}\\b`, "i").test(text)
  );
  fields.country = COUNTRIES.find((country) =>
    new RegExp(`\\b${country.replace(".", "\\.")}\\b`, "i").test(text)
  );

  const pageMatch = text.match(/\bPage\s+\d+\s*\/\s*\d+\b/i);
  if (pageMatch) fields.pageIndicator = pageMatch[0];

  const countMatch = text.match(
    /\b(?:Vaccines?\s+administered|Vaccins?\s+administr(?:e|é)s?)\s*[:\-]?\s*(\d+)\b/i
  );
  if (countMatch) fields.vaccinesAdministered = Number(countMatch[1]);

  const issuedMatch = text.match(
    /\b(?:Issued(?:\s+on)?|D[ée]livr[ée]\s*(?:le)?)\s*[:\-]?\s*([^\n]+)/i
  );
  if (issuedMatch?.[1]) {
    fields.issuedOn = parseDateToIso(issuedMatch[1]) ?? undefined;
  }

  const looksLikeDoseDate = (line: string) => {
    if (/date of birth|dob|issued/i.test(line)) return false;
    return (
      /\b(19|20)\d{2}-\d{2}-\d{2}\b/.test(line) ||
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(line) ||
      /\b\d{1,2}\s+[A-Za-z]{3,12}\s+\d{2,4}\b/.test(line) ||
      /\b\d{1,2}\s+[A-Za-z]{3,12}\s*\/\s*[A-Za-z]{3,12}\s+\d{2,4}\b/.test(line)
    );
  };

  const vaccinations: ExtractedVaccination[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!looksLikeDoseDate(line)) continue;

    const date = parseDateToIso(line) ?? undefined;
    if (!date) continue;

    const block: string[] = [line];
    let j = i + 1;
    while (j < lines.length && !looksLikeDoseDate(lines[j]) && block.length < 5) {
      block.push(lines[j]);
      j += 1;
    }

    const joined = block.join(" ");
    const lotMatch = joined.match(
      /\b(?:lot|batch)\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Za-z0-9\-]+)/i
    );
    const lot = lotMatch?.[1];

    const product = block
      .slice(1)
      .map((candidate) => candidate.replace(/\b(?:lot|batch).*/i, "").trim())
      .find(
        (candidate) =>
          candidate.length >= 4 &&
          !/vaccines?\s+administered|page\s+\d+\/\d+|issued/i.test(candidate)
      );

    vaccinations.push({ date, product, lot });
    i = j - 1;
  }

  // Fallback parser for common "Date/Product/Lot" dose blocks.
  if (vaccinations.length === 0) {
    const blockRegex =
      /Date\s*[:\-]\s*([^\n]+)\n\s*Product\s*\/\s*Produit\s*[:\-]\s*([^\n]+)\n\s*Lot\s*[:\-]\s*([^\n]+)/gi;
    let match: RegExpExecArray | null = blockRegex.exec(text);
    while (match) {
      const date = parseDateToIso(match[1]) ?? undefined;
      const product = cleanLine(match[2]);
      const lot = cleanLine(match[3]);
      vaccinations.push({
        date,
        product: product || undefined,
        lot: lot || undefined,
      });
      match = blockRegex.exec(text);
    }
  }

  if (!fields.firstName && !fields.lastName) {
    warnings.push("Could not confidently extract patient name.");
  }
  if (!fields.dateOfBirth) {
    warnings.push("Could not confidently extract date of birth.");
  }
  if (vaccinations.length === 0) {
    warnings.push("No vaccination entries were confidently extracted.");
  }
  if (fields.vaccinesAdministered && vaccinations.length < fields.vaccinesAdministered) {
    warnings.push(
      `Detected ${fields.vaccinesAdministered} administered vaccines, but parsed ${vaccinations.length} entries.`
    );
  }

  return { fields, vaccinations, warnings };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A multipart file field named 'file' is required." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Please upload an image under 8MB." },
        { status: 413 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const sharpModule = (await import("sharp")).default;
    const preprocessed = await sharpModule(bytes)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(155)
      .png()
      .toBuffer();

    const rawText = await runOcr(preprocessed);

    const parsed = parseOcrText(rawText);

    return NextResponse.json({
      source: "ocr",
      fields: parsed.fields,
      vaccinations: parsed.vaccinations,
      warnings: parsed.warnings,
      ...(process.env.NODE_ENV !== "production" ? { rawText } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract immunization data.";
    if (message.toLowerCase().includes("timed out")) {
      return NextResponse.json({ error: message }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
