import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { EditVehicleModal } from "../components/EditVehicleModal";
import {
  Download,
  Folder,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Home,
  CarFront,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import {
  getDocuments,
  getCategoryById,
  deleteDocument,
  deleteVehicle,
} from "../services/knowledge.service";
import { DocumentCard } from "../components/DocumentCard";
import { DynamicIcon } from "@/shared/components/ui/DynamicIcon";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { FileViewerModal } from "@/shared/components/ui/FileViewerModal";
import { saveToHistory } from "@/core/history";
import { VehicleCard } from "../components/VehicleCard";
import { EditDocumentModal } from "../components/EditDocumentModal";

export const CategoryPage = () => {
  const { categoryId } = useParams();

  const [category, setCategory] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isZipping, setIsZipping] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [viewerData, setViewerData] = useState<{
    list: any[];
    index: number;
  } | null>(null);
  const loadData = async () => {
    if (!categoryId) return;
    setIsLoading(true);
    try {
      const [catData, docsData] = await Promise.all([
        getCategoryById(categoryId),
        getDocuments(categoryId),
      ]);

      setCategory(catData);
      setDocuments(docsData);
      if (catData) {
        saveToHistory({
          id: catData.id,
          name: catData.name,
          icon: catData.icon || "Folder",
          url: `/category/${catData.id}`,
        });
      }
    } catch (error) {
      console.error("Error cargando la categoría:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [categoryId]);

  const handleDeleteFile = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation(); // Evita que se abra el Modal al hacer clic en el basurero

    if (
      !window.confirm(
        "¿Estás seguro de eliminar este archivo? Esta acción no se puede deshacer.",
      )
    )
      return;

    try {
      await deleteDocument(docId);
      // Actualizamos la lista quitando el documento borrado sin recargar la página
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el archivo.");
    }
  };
  const downloadAlbum = async () => {
    const images = documents.filter((doc) => doc.fileType.startsWith("image/"));
    if (images.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();
    const folderName = category.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const imgFolder = zip.folder(folderName);

    try {
      // Descargamos cada imagen desde Cloudflare R2 y la metemos al ZIP
      await Promise.all(
        images.map(async (img, index) => {
          const response = await fetch(img.fileUrl);
          const blob = await response.blob();
          // Intentamos usar el título original, si no, le ponemos un número
          const extension = img.fileType.split("/")[1] || "jpg";
          const fileName = img.title
            ? `${img.title}.${extension}`
            : `foto_${index + 1}.${extension}`;
          imgFolder?.file(fileName, blob);
        }),
      );

      // Generamos el archivo ZIP y forzamos la descarga
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}_album.zip`);
    } catch (error) {
      console.error("Error creando el ZIP:", error);
      alert("Hubo un error al descargar el álbum. Revisa tu conexión.");
    } finally {
      setIsZipping(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-zinc-500 text-center">Cargando contenido...</div>
    );
  if (!category)
    return (
      <div className="p-8 text-red-500 text-center">
        Categoría no encontrada.
      </div>
    );

  // Separamos los documentos en Imágenes y Archivos (PDFs, etc)
  const images = documents.filter((doc) => doc.fileType.startsWith("image/"));
  const files = documents.filter((doc) => !doc.fileType.startsWith("image/"));
  const subCategories = category.children || [];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6 font-medium">
        <Link
          to="/"
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" /> Inicio
        </Link>

        {/* Renderizamos los padres y abuelos */}
        {category.breadcrumbs?.map((crumb: any) => (
          <div key={crumb.id} className="flex items-center gap-2">
            <span className="text-zinc-700">/</span>
            <Link
              to={`/category/${crumb.id}`}
              className="hover:text-white transition-colors"
            >
              {crumb.name}
            </Link>
          </div>
        ))}

        {/* Carpeta actual (No es un link porque ya estamos aquí) */}
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300">{category.name}</span>
      </nav>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center text-red-500">
            <DynamicIcon
              name={category.icon}
              fallback="Folder"
              className="w-8 h-8"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {category.name}
            </h1>
            <p className="text-zinc-400">
              {category.description || "Explora el contenido de esta carpeta."}
            </p>
          </div>
        </div>

        {/* BOTÓN DE DESCARGAR ÁLBUM (Solo aparece si hay imágenes) */}
        {images.length > 0 && (
          <button
            onClick={downloadAlbum}
            disabled={isZipping}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg border border-zinc-800 hover:border-red-600 transition-all cursor-pointer disabled:opacity-50"
          >
            {isZipping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="font-medium">
              {isZipping ? "Comprimiendo..." : "Descargar Álbum (.zip)"}
            </span>
          </button>
        )}
      </div>

      {/* 1. SUBCARPETAS (Álbumes) */}
      {subCategories.length > 0 && (
        <div className="mb-10">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
            Subcarpetas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {subCategories.map((sub: any) => {
              // Verificamos si el backend nos mandó una imagen de portada
              const coverUrl =
                sub.coverUrl ||
                (sub.documents && sub.documents.length > 0
                  ? sub.documents[0].fileUrl
                  : null);

              return (
                <Link
                  key={sub.id}
                  to={`/category/${sub.id}`}
                  className="group block h-full"
                >
                  <div className="bg-[#0f0f0f] border border-zinc-800 rounded-xl overflow-hidden hover:border-red-500/50 transition-all h-full flex flex-col">
                    {/* Portada del Álbum */}
                    <div className="h-32 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <DynamicIcon
                          name={sub.icon}
                          fallback="Folder"
                          className="w-10 h-10 text-zinc-700 group-hover:text-red-500 transition-colors"
                        />
                      )}
                    </div>
                    {/* Título */}
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h4 className="text-white font-medium text-sm truncate">
                        {sub.name}
                      </h4>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {category.vehicles && category.vehicles.length > 0 && (
        <div className="mb-12">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CarFront className="w-4 h-4" /> Modelos Disponibles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.vehicles.map((vehicle: any) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onViewDocument={(list, index) => setViewerData({ list, index })}
                onEdit={() => setEditingVehicle(vehicle)}
                onDelete={async (id) => {
                  if (window.confirm("¿Eliminar este vehículo?")) {
                    await deleteVehicle(id);
                    loadData();
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. GALERÍA DE FOTOS */}
      {images.length > 0 && (
        <div className="mb-10">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Galería de Imágenes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                onClick={() => setViewerData({ list: images, index })}
                className="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-red-500 transition-all block cursor-pointer"
              >
                <img
                  src={img.fileUrl}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium px-3 py-1 bg-red-600 rounded-full">
                    Ver foto
                  </span>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={(e) => handleDeleteFile(e, img.id)}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DOCUMENTOS (PDFs, Excels, etc) */}
      {files.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documentos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {files.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                fileType={doc.fileType}
                title={doc.title}
                categoryName={category.name}
                fileUrl={doc.fileUrl}
                fileSize={doc.fileSize}
                createdAt={doc.createdAt}
                onEdit={(e) => {
                  e.stopPropagation();
                  setEditingDocument(doc);
                }}
                onClick={() => setViewerData({ list: files, index })}
                onDelete={(e) => handleDeleteFile(e, doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* MENSAJE VACÍO */}
      {subCategories.length === 0 && documents.length === 0 && (
        <div className="text-center py-20 bg-[#0f0f0f] rounded-2xl border border-zinc-800 border-dashed">
          <Folder className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-1">
            Carpeta vacía
          </h3>
          <p className="text-zinc-500 text-sm">
            Aún no hay contenido en esta ubicación.
          </p>
        </div>
      )}
      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          categoryDocuments={documents}
          onClose={() => setEditingVehicle(null)}
          onSuccess={() => {
            setEditingVehicle(null);
            window.location.reload();
          }}
        />
      )}
      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSuccess={() => {
            setEditingDocument(null);
            window.location.reload();
          }}
        />
      )}
      {viewerData && (
        <FileViewerModal
          files={viewerData.list}
          initialIndex={viewerData.index}
          onClose={() => setViewerData(null)}
        />
      )}
    </div>
  );
};
