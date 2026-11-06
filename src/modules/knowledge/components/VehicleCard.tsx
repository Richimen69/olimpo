// src/modules/knowledge/components/VehicleCard.tsx
import { useState } from "react";
import {
  Download,
  Eye,
  Trash2,
  Clock,
  Image as ImageIcon,
  Pencil,
  FolderOpen,
  Loader2,
  ChevronDown,
  CarFront,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import {
  buildFileName,
  downloadAsZip,
  downloadFile,
  formatSize,
  getFileIcon,
} from "@/shared/lib/files";

interface VehicleCardProps {
  vehicle: any;
  onViewDocument: (list: any[], index: number) => void;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
}

const HOVER_REVEAL =
  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100";

export const VehicleCard = ({ vehicle, onViewDocument, onDelete, onEdit }: VehicleCardProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [expanded, setExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const documents = vehicle.documents || [];
  const images = documents.filter((doc: any) => doc.fileType?.startsWith("image/"));
  const files = documents.filter((doc: any) => !doc.fileType?.startsWith("image/"));

  const collapsedLimit = images.length > 0 ? 2 : 3;
  const visibleFiles = expanded ? files : files.slice(0, collapsedLimit);
  const hiddenCount = files.length - collapsedLimit;

  const parsedDate = new Date(vehicle.updatedAt || vehicle.createdAt);
  const date = isNaN(parsedDate.getTime())
    ? null
    : parsedDate.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  const handleDownloadAll = async () => {
    if (documents.length === 0 || isDownloading) return;
    setIsDownloading(true);
    try {
      if (documents.length === 1) {
        const doc = documents[0];
        await downloadFile(doc.fileUrl, buildFileName(doc.title, doc.fileType, "documento"));
      } else {
        const { failed } = await downloadAsZip(documents, vehicle.name || "vehiculo");
        if (failed > 0)
          toast.warning(`Descarga lista, pero faltaron ${failed} de ${documents.length} archivos.`);
      }
    } catch (error) {
      console.error("Error descargando documentos del vehículo:", error);
      toast.error("No se pudieron descargar los documentos. Intenta de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  const specs = [
    { label: "Motorización", value: vehicle.engine },
    { label: "Potencia máx.", value: vehicle.power },
    { label: "Torque", value: vehicle.torque },
    { label: "Tracción", value: vehicle.traction },
  ];

  const actionBtn =
    "p-2 bg-black/70 text-white rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500";

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full group relative">
      {isAuthenticated && (onEdit || onDelete) && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {onDelete && (
            <button
              onClick={() => onDelete(vehicle.id)}
              className={`${actionBtn} hover:bg-red-600 mr-2 ${HOVER_REVEAL}`}
              title="Eliminar vehículo"
              aria-label={`Eliminar ${vehicle.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className={`${actionBtn} hover:bg-zinc-700 ${HOVER_REVEAL}`}
              title="Editar vehículo"
              aria-label={`Editar ${vehicle.name}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* IMAGEN DE PORTADA */}
      <div className="h-48 bg-zinc-900 relative overflow-hidden">
        {vehicle.coverUrl ? (
          <img
            src={vehicle.coverUrl}
            alt={vehicle.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-700">
            <CarFront className="w-10 h-10" />
            <span className="text-xs">Sin foto de portada</span>
          </div>
        )}
        <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
          {vehicle.category?.name || "Modelo"}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-4">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
            Especificaciones técnicas
          </p>
          <h3 className="text-lg font-bold text-white leading-tight">{vehicle.name}</h3>
        </div>

        <dl className="grid grid-cols-3 gap-x-2 gap-y-3 mb-6 text-xs border-b border-zinc-800/50 pb-5">
          {specs.map((s) => (
            <div key={s.label} className="contents">
              <dt className="col-span-1 text-zinc-500">{s.label}</dt>
              <dd className="col-span-2 text-white font-medium text-right break-words">
                {s.value || "—"}
              </dd>
            </div>
          ))}
        </dl>

        {/* DOCUMENTOS VINCULADOS */}
        <div className="flex-1 mb-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Documentación vinculada ({documents.length}{" "}
            {documents.length === 1 ? "archivo" : "archivos"})
          </p>

          <div className="space-y-2">
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => onViewDocument(images, 0)}
                className="w-full flex items-center justify-between text-xs hover:bg-zinc-900/50 p-1.5 -mx-1.5 rounded-md cursor-pointer transition-colors group/doc border border-transparent hover:border-zinc-800 text-left"
              >
                <span className="flex items-center gap-2 overflow-hidden">
                  <FolderOpen className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-zinc-300 group-hover/doc:text-white truncate font-medium">
                    Galería del vehículo ({images.length}{" "}
                    {images.length === 1 ? "foto" : "fotos"})
                  </span>
                </span>
                <ImageIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-2" />
              </button>
            )}

            <div className={expanded ? "max-h-56 overflow-y-auto space-y-2 pr-1" : "space-y-2"}>
              {visibleFiles.map((doc: any, index: number) => {
                const { Icon, color } = getFileIcon(doc.fileType);
                return (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => onViewDocument(files, index)}
                    className="w-full flex items-center justify-between text-xs hover:bg-zinc-900/50 p-1.5 -mx-1.5 rounded-md cursor-pointer transition-colors group/doc text-left"
                  >
                    <span className="flex items-center gap-2 overflow-hidden">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                      <span className="text-zinc-300 group-hover/doc:text-white truncate">
                        {doc.title}
                      </span>
                    </span>
                    <span className="text-zinc-600 shrink-0 ml-2">{formatSize(doc.fileSize)}</span>
                  </button>
                );
              })}
            </div>

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white pt-1 cursor-pointer"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                {expanded
                  ? "Mostrar menos"
                  : `${hiddenCount} ${hiddenCount === 1 ? "documento más" : "documentos más"}`}
              </button>
            )}

            {documents.length === 0 && (
              <p className="text-xs text-zinc-600 italic">No hay archivos vinculados.</p>
            )}
          </div>
        </div>

        <div className="mt-auto">
          {date && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-4">
              <Clock className="w-3 h-3" /> Actualizado el {date}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={documents.length === 0 || isDownloading}
              title={
                documents.length > 1
                  ? "Descarga todos los archivos en un .zip"
                  : "Descargar documento"
              }
              className="flex items-center justify-center gap-2 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-bold rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isDownloading ? "Preparando..." : "Descargar"}
            </button>
            <button
              type="button"
              onClick={() => onViewDocument([...files, ...images], 0)}
              disabled={documents.length === 0}
              className="flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="w-3.5 h-3.5" /> Ver documentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};