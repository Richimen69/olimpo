import { useState, useEffect, useCallback } from "react";
import { X, Download, FileText, ChevronLeft, ChevronRight, Image, Video, } from "lucide-react";

interface FileViewerModalProps {
  files: any[]; // Ahora recibimos la lista completa
  initialIndex: number; // Y el índice donde empezamos
  onClose: () => void;
}

export const FileViewerModal = ({
  files,
  initialIndex,
  onClose,
}: FileViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Funciones de navegación (hacen un ciclo infinito)
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
  }, [files.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? files.length - 1 : prev - 1));
  }, [files.length]);

  // Bloquear scroll y escuchar el teclado
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext, handlePrev, onClose]);

  const file = files[currentIndex];
  if (!file) return null;

  const isImage = file.fileType.startsWith("image/");
  const isVideo = file.fileType.startsWith("video/");
  const isPdf = file.fileType === "application/pdf";
  const isPreviewable = isImage || isVideo || isPdf;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-[#0f0f0f] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/80 z-20">
          <h3 className="text-white font-medium truncate pr-4 flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isImage ? (
                <Image size={18} />
              ) : isVideo ? (
                <Video size={18} />
              ) : (
                <FileText size={18} />
              )}
              <span>{file.title}</span>
            </div>
            {/* Contador de archivos */}
            {files.length > 1 && (
              <span className="text-zinc-500 text-xs ml-2 font-normal">
                ({currentIndex + 1} de {files.length})
              </span>
            )}
          </h3>
          <div className="flex items-center gap-3">
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Descargar
            </a>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido y Flechas */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/50 min-h-[50vh] relative group">
          {/* Flecha Izquierda */}
          {files.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 p-3 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Archivo */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {isImage && (
              <img
                src={file.fileUrl}
                alt={file.title}
                className="max-w-full max-h-[75vh] object-contain select-none"
              />
            )}
            {isVideo && (
              <video
                src={file.fileUrl}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] rounded-lg shadow-lg"
              />
            )}
            {isPdf && (
              <iframe
                src={file.fileUrl}
                className="w-full h-[75vh] bg-white rounded-lg"
                title={file.title}
              />
            )}

            {!isPreviewable && (
              <div className="text-center text-zinc-400 p-10">
                <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <p className="mb-4 text-lg text-white">
                  Vista previa no disponible
                </p>
                <p className="mb-6 text-sm">
                  Este tipo de archivo debe descargarse para poder verlo.
                </p>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" /> Descargar Archivo
                </a>
              </div>
            )}
          </div>

          {/* Flecha Derecha */}
          {files.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 p-3 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
