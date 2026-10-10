// src/modules/knowledge/components/VehicleCard.tsx
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Clock,
  Image as ImageIcon,
  Pencil,
  FolderOpen,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";

interface VehicleCardProps {
  vehicle: any;
  onViewDocument: (list: any[], index: number) => void;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
}

export const VehicleCard = ({
  vehicle,
  onViewDocument,
  onDelete,
  onEdit,
}: VehicleCardProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 1. SEPARAMOS LAS IMÁGENES DE LOS PDFs
  const documents = vehicle.documents || [];
  const images = documents.filter((doc: any) =>
    doc.fileType.startsWith("image/"),
  );
  const files = documents.filter(
    (doc: any) => !doc.fileType.startsWith("image/"),
  );

  // Formatear fecha
  const date = new Date(
    vehicle.updatedAt || vehicle.createdAt,
  ).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full group relative">
      {onDelete && isAuthenticated && (
        <button
          onClick={() => onDelete(vehicle.id)}
          className="absolute top-3 right-15 p-2 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
          title="Eliminar vehículo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {onEdit && isAuthenticated && (
        <button
          onClick={onEdit}
          className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-blue-600 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
          title="Editar vehículo"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {/* IMAGEN DE PORTADA */}
      <div className="h-48 bg-zinc-900 relative overflow-hidden">
        {vehicle.coverUrl ? (
          <img
            src={vehicle.coverUrl}
            alt={vehicle.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            Sin imagen
          </div>
        )}
        <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
          {vehicle.category?.name || "Modelo"}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* TÍTULO */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
            Especificaciones Técnicas
          </p>
          <h3 className="text-lg font-bold text-white leading-tight">
            {vehicle.name}
          </h3>
        </div>

        {/* ESPECIFICACIONES */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 mb-6 text-xs border-b border-zinc-800/50 pb-5">
          <div className="col-span-1 text-zinc-500">Motorización</div>
          <div className="col-span-2 text-white font-medium text-right">
            {vehicle.engine || "-"}
          </div>

          <div className="col-span-1 text-zinc-500">Potencia Máx.</div>
          <div className="col-span-2 text-white font-medium text-right">
            {vehicle.power || "-"}
          </div>

          <div className="col-span-1 text-zinc-500">Torque</div>
          <div className="col-span-2 text-white font-medium text-right">
            {vehicle.torque || "-"}
          </div>

          <div className="col-span-1 text-zinc-500">Tracción</div>
          <div className="col-span-2 text-white font-medium text-right">
            {vehicle.traction || "-"}
          </div>
        </div>

        {/* DOCUMENTOS VINCULADOS CON AGRUPACIÓN INTELIGENTE */}
        <div className="flex-1 mb-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Documentación Vinculada ({documents.length} archivos)
          </p>

          <div className="space-y-2">
            {/* 1. FILA DE ÁLBUM (Si hay imágenes vinculadas) */}
            {images.length > 0 && (
              <div
                onClick={() => onViewDocument(images, 0)}
                className="flex items-center justify-between text-xs hover:bg-zinc-900/50 p-1.5 -mx-1.5 rounded-md cursor-pointer transition-colors group/doc border border-transparent hover:border-zinc-800"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FolderOpen className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-zinc-300 group-hover/doc:text-white truncate font-medium">
                    Galería del Vehículo ({images.length} fotos)
                  </span>
                </div>
                <ImageIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-2" />
              </div>
            )}

            {/* 2. LISTA DE PDFs (Ocupan el resto de los espacios) */}
            {files
              .slice(0, images.length > 0 ? 2 : 3)
              .map((doc: any, index: number) => (
                <div
                  key={doc.id}
                  onClick={() => onViewDocument(files, index)}
                  className="flex items-center justify-between text-xs hover:bg-zinc-900/50 p-1.5 -mx-1.5 rounded-md cursor-pointer transition-colors group/doc"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-zinc-300 group-hover/doc:text-white truncate">
                      {doc.title}
                    </span>
                  </div>
                  <span className="text-zinc-600 shrink-0 ml-2">
                    {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              ))}

            {/* MENSAJE DE ARCHIVOS RESTANTES */}
            {files.length > (images.length > 0 ? 2 : 3) && (
              <p className="text-xs text-zinc-500 italic pt-1">
                + {files.length - (images.length > 0 ? 2 : 3)} documentos más...
              </p>
            )}

            {/* MENSAJE VACÍO */}
            {documents.length === 0 && (
              <p className="text-xs text-zinc-600 italic">
                No hay archivos vinculados.
              </p>
            )}
          </div>
        </div>

        {/* FOOTER Y BOTONES */}
        <div className="mt-auto">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-4">
            <Clock className="w-3 h-3" /> Actualizado el {date}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-bold rounded-md transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Descargar
            </button>
            <button className="flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-colors cursor-pointer">
              <Eye className="w-3.5 h-3.5" /> Ver Detalle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
