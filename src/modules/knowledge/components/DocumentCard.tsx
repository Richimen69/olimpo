import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Trash2,
  Bookmark,
  Pencil,
} from "lucide-react";
import { isBookmarked, toggleBookmark } from "@/core/bookmarks";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";

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
  const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
  const date = new Date(createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [saved, setSaved] = useState(isBookmarked(id));

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleBookmark({
      id,
      title,
      categoryName,
      fileUrl,
      fileSize,
      createdAt,
      fileType,
    });
    setSaved(newState);
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#0f0f0f] border border-zinc-800 rounded-xl p-5 hover:border-red-600/50 transition-colors group flex flex-col justify-between h-full cursor-pointer relative"
    >
      {/* Botón de Eliminar (Admin) */}
      {onDelete && isAuthenticated && (
        <button
          onClick={onDelete}
          className="absolute top-4 right-22 p-2 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
          title="Eliminar documento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {onEdit && isAuthenticated && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-13 p-2 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
          title="Editar documento"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={handleBookmark}
        className={`absolute top-4 right-4 p-2 rounded-lg transition-colors cursor-pointer z-10 ${saved ? "bg-red-600/10 text-red-500" : "bg-zinc-900 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100"}`}
        title={saved ? "Quitar de guardados" : "Guardar documento"}
      >
        <Bookmark className={`w-4 h-4 ${saved ? "fill-red-500" : ""}`} />
      </button>

      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <h4 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-red-500 transition-colors">
          {title}
        </h4>
        <p className="text-zinc-500 text-xs mb-4">{categoryName}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50 mt-auto">
        <div className="flex items-center gap-3 text-zinc-500 text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {date}
          </span>
          <span>{sizeInMB} MB</span>
        </div>
        <button className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
