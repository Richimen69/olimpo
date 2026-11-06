// src/shared/lib/files.ts
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export const isImageType = (mime?: string, name?: string) =>
  (mime || "").startsWith("image/") ||
  /\.(jpe?g|png|gif|webp|avif)$/i.test(name || "");

export const formatSize = (bytes?: number | null) => {
  if (bytes == null || isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
};

export const getTypeLabel = (mime?: string) => {
  if (!mime) return "Archivo";
  const m = mime.toLowerCase();
  if (m.startsWith("image/"))
    return `Imagen ${(m.split("/")[1] || "").replace("jpeg", "jpg").toUpperCase()}`;
  if (m.includes("pdf")) return "Documento PDF";
  if (m.includes("spreadsheet") || m.includes("excel") || m.includes("csv"))
    return "Hoja de cálculo";
  if (m.includes("presentation") || m.includes("powerpoint")) return "Presentación";
  if (m.includes("word") || m.includes("document")) return "Documento de Word";
  if (m.includes("zip") || m.includes("rar") || m.includes("compressed"))
    return "Archivo comprimido";
  if (m.startsWith("video/")) return "Video";
  if (m.startsWith("audio/")) return "Audio";
  if (m.startsWith("text/")) return "Texto";
  return m.split("/")[1]?.toUpperCase() || "Archivo";
};

export const getFileIcon = (mime?: string): { Icon: LucideIcon; color: string } => {
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf")) return { Icon: FileText, color: "text-red-400" };
  if (m.includes("spreadsheet") || m.includes("excel") || m.includes("csv"))
    return { Icon: FileSpreadsheet, color: "text-emerald-400" };
  if (m.includes("word") || m.includes("document"))
    return { Icon: FileText, color: "text-sky-400" };
  if (m.includes("zip") || m.includes("rar") || m.includes("compressed"))
    return { Icon: FileArchive, color: "text-amber-400" };
  if (m.startsWith("image/")) return { Icon: ImageIcon, color: "text-violet-400" };
  return { Icon: FileIcon, color: "text-zinc-400" };
};

const MIME_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/csv": "csv",
  "image/jpeg": "jpg",
  "video/mp4": "mp4",
};

const extFromType = (mime?: string) => {
  if (!mime) return "";
  const m = mime.toLowerCase();
  if (MIME_EXT[m]) return MIME_EXT[m];
  const sub = m.split("/")[1] || "";
  return /^[a-z0-9]{2,5}$/.test(sub) ? sub : "";
};

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "_").trim() || "archivo";

/** Nombre de archivo a partir del título, agregando la extensión si falta */
export const buildFileName = (title: string | undefined, fileType: string | undefined, fallback: string) => {
  const base = safeName(title || fallback);
  const ext = extFromType(fileType);
  return ext && !base.toLowerCase().endsWith(`.${ext}`) ? `${base}.${ext}` : base;
};

/** Descarga un archivo de R2. Usa blob porque `<a download>` se ignora entre dominios. */
export const downloadFile = async (url: string, fileName: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  saveAs(await res.blob(), fileName);
};

interface ZipDoc {
  fileUrl: string;
  title?: string;
  fileType?: string;
}

/**
 * Descarga varios archivos en un ZIP. Si alguno falla, descarga los demás
 * y devuelve cuántos faltaron. Los nombres repetidos se numeran ("foto (2).jpg").
 */
export const downloadAsZip = async (docs: ZipDoc[], zipName: string) => {
  const zip = new JSZip();
  const used = new Set<string>();

  const uniqueName = (name: string) => {
    if (!used.has(name.toLowerCase())) return name;
    const dot = name.lastIndexOf(".");
    const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
    let n = 2;
    while (used.has(`${base} (${n})${ext}`.toLowerCase())) n++;
    return `${base} (${n})${ext}`;
  };

  const results = await Promise.allSettled(
    docs.map(async (doc, i) => {
      const res = await fetch(doc.fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const name = uniqueName(buildFileName(doc.title, doc.fileType, `archivo_${i + 1}`));
      used.add(name.toLowerCase());
      zip.file(name, blob);
    }),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed === docs.length) throw new Error("No se pudo descargar ningún archivo.");

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${safeName(zipName)}.zip`);
  return { failed };
};