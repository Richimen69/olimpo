import { useState } from "react";
import { Download, Calendar, Trash2, Bookmark, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isBookmarked, toggleBookmark } from "@/core/bookmarks";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { buildFileName, downloadFile, formatSize, getFileIcon } from "@/shared/lib/files";

interface DocumentCardProps {
  id: string;
  title: string;
  categoryName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  fileType: string;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

// Visibles al pasar el mouse, al navegar con teclado y siempre en pantallas táctiles
const HOVER_REVEAL =
  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100";

export const DocumentCard = ({
  id,
  title,
  categoryName,
  fileUrl,
  fileSize,
  createdAt,
  fileType,
  onClick,
  onDelete,
  onEdit,
}: DocumentCardProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [saved, setSaved] = useState(isBookmarked(id));
  const [isDownloading, setIsDownloading] = useState(false);

  const parsedDate = new Date(createdAt);
  const date = isNaN(parsedDate.getTime())
    ? null
    : parsedDate.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  const { Icon, color } = getFileIcon(fileType);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleBookmark({ id, title, categoryName, fileUrl, fileSize, createdAt, fileType });
    setSaved(newState);
    toast.success(newState ? "Guardado en tus documentos" : "Quitado de guardados");
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFile(fileUrl, buildFileName(title, fileType, "documento"));
    } catch (error) {
      console.error("Error descargando:", error);
      toast.error("No se pudo descargar el archivo. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  const actionBtn =
    "p-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && e.key === "Enter") onClick();
      }}
      className="bg-[#0f0f0f] border border-zinc-800 rounded-xl p-5 hover:border-red-600/50 transition-colors group flex flex-col justify-between h-full cursor-pointer relative focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {/* Acciones agrupadas: eliminar queda separado de editar para evitar clics accidentales */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        {onDelete && isAuthenticated && (
          <button
            onClick={onDelete}
            className={`${actionBtn} hover:bg-red-600 mr-2 ${HOVER_REVEAL}`}
            title="Eliminar documento"
            aria-label="Eliminar documento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {onEdit && isAuthenticated && (
          <button
            onClick={onEdit}
            className={`${actionBtn} hover:bg-zinc-700 ${HOVER_REVEAL}`}
            title="Editar documento"
            aria-label="Editar documento"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleBookmark}
          aria-pressed={saved}
          className={`${actionBtn} ${
            saved ? "!bg-red-600/10 !text-red-500" : `hover:bg-zinc-700 ${HOVER_REVEAL}`
          }`}
          title={saved ? "Quitar de guardados" : "Guardar documento"}
          aria-label={saved ? "Quitar de guardados" : "Guardar documento"}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-red-500" : ""}`} />
        </button>
      </div>

      <div>
        <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <h4 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-red-500 transition-colors">
          {title}
        </h4>
        <p className="text-zinc-500 text-xs mb-4">{categoryName}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50 mt-auto">
        <div className="flex items-center gap-3 text-zinc-500 text-xs">
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {date}
            </span>
          )}
          <span>{formatSize(fileSize)}</span>
        </div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          title="Descargar"
          aria-label={`Descargar ${title}`}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};