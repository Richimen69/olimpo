import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Pencil,
  LayoutGrid,
  LayoutList,
  List,
  Table,
  ArrowUp,
  ArrowDown,
  Check,
  Minus,
  X,
  CheckSquare,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/shared/components/ui/ConfirmDialog";
import {
  buildFileName,
  downloadAsZip,
  downloadFile,
  formatSize,
  getFileIcon,
  getTypeLabel,
} from "@/shared/lib/files";

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

// ─────────────────────────────────────────────────────────────
// Tipos y helpers de la vista tipo "Explorador"
// ─────────────────────────────────────────────────────────────

type ViewMode = "icons" | "tiles" | "list" | "details";
type SortKey = "name" | "date" | "type" | "size";
type SortDir = "asc" | "desc";
type ItemKind = "folder" | "image" | "file";

interface ExplorerItem {
  id: string;
  kind: ItemKind;
  name: string;
  typeLabel: string;
  size: number | null;
  date: string | null;
  thumb: string | null;
  icon?: string;
  fileType?: string;
  raw: any;
}

const VIEW_STORAGE_KEY = "category-view-mode";

// ⚠️ Ajusta a la ruta real de AdminUploadPage en tu router
const UPLOAD_ROUTE = "/admin/upload";

// Visible con hover, con teclado y siempre en pantallas táctiles
const HOVER_REVEAL =
  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100";

const VIEW_MODES: { id: ViewMode; label: string; Icon: React.ElementType }[] = [
  { id: "icons", label: "Iconos grandes", Icon: LayoutGrid },
  { id: "tiles", label: "Mosaicos", Icon: LayoutList },
  { id: "list", label: "Lista", Icon: List },
  { id: "details", label: "Detalles", Icon: Table },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "date", label: "Fecha" },
  { key: "type", label: "Tipo" },
  { key: "size", label: "Tamaño" },
];

// Recuerda la última vista elegida (como hace Windows)
const readStoredViewMode = (): ViewMode => {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored && VIEW_MODES.some((m) => m.id === stored)) {
      return stored as ViewMode;
    }
  } catch {
    /* localStorage no disponible */
  }
  return "icons";
};

const formatDate = (date: string | null, withTime = false) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

// Miniatura / icono reutilizable para mosaicos, lista y detalles
const ItemThumb = ({ item, size }: { item: ExplorerItem; size: "sm" | "md" }) => {
  const box = size === "sm" ? "w-5 h-5 rounded" : "w-12 h-12 rounded-lg";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  const bg = size === "md" ? "bg-zinc-900 border border-zinc-800" : "";

  // En tamaño pequeño solo las imágenes muestran miniatura; las carpetas, su icono
  const showThumb = item.thumb && (size === "md" || item.kind === "image");

  if (showThumb) {
    return (
      <img
        src={item.thumb!}
        alt=""
        loading="lazy"
        className={`${box} object-cover shrink-0 bg-zinc-900`}
      />
    );
  }

  if (item.kind === "folder") {
    return (
      <div className={`${box} ${bg} shrink-0 flex items-center justify-center`}>
        <DynamicIcon
          name={item.icon}
          fallback="Folder"
          className={`${iconSize} text-red-500`}
        />
      </div>
    );
  }

  const { Icon, color } = getFileIcon(item.fileType);
  return (
    <div className={`${box} ${bg} shrink-0 flex items-center justify-center`}>
      <Icon className={`${iconSize} ${color}`} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────

// Casilla de selección (se usa en todas las vistas)
const SelectBox = ({
  checked,
  indeterminate = false,
  onToggle,
  label,
  className = "",
}: {
  checked: boolean;
  indeterminate?: boolean;
  onToggle: (e: React.MouseEvent) => void;
  label: string;
  className?: string;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? "mixed" : checked}
    aria-label={label}
    title={label}
    onClick={(e) => {
      e.stopPropagation();
      onToggle(e);
    }}
    className={`w-5 h-5 shrink-0 rounded border cursor-pointer flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
      checked || indeterminate
        ? "bg-red-600 border-red-600 text-white"
        : "bg-black/50 border-zinc-500 hover:border-zinc-200"
    } ${className}`}
  >
    {indeterminate ? (
      <Minus className="w-3.5 h-3.5" strokeWidth={3} />
    ) : (
      checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────

export const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

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

  // Vista y orden
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "name",
    dir: "asc",
  });

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false); // útil en móvil (sin hover ni Ctrl)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDownloadingSelection, setIsDownloadingSelection] = useState(false);
  const selectionActive = selectMode || selectedIds.size > 0;

  const clearSelection = () => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
    setSelectMode(false);
  };

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignorar */
    }
  };

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : // Fecha y tamaño empiezan descendente (más reciente / más grande primero)
          { key, dir: key === "date" || key === "size" ? "desc" : "asc" },
    );
  };

  // silent: recarga los datos sin mostrar "Cargando..." (no pierde scroll ni vista)
  const loadData = async (silent = false) => {
    if (!categoryId) return;
    if (!silent) setIsLoading(true);
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
      if (silent) toast.error("No se pudo actualizar el contenido. Recarga la página.");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    clearSelection();
    loadData();
  }, [categoryId]);

  const handleDeleteFile = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation(); // Evita que se abra el Modal al hacer clic en el basurero

    const doc = documents.find((d) => d.id === docId);
    const ok = await confirmDialog({
      title: "¿Eliminar este archivo?",
      description: doc?.title ? (
        <>
          Se eliminará <span className="text-white">“{doc.title}”</span>. Esta acción no se
          puede deshacer.
        </>
      ) : (
        "Esta acción no se puede deshacer."
      ),
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await deleteDocument(docId);
      // Actualizamos la lista quitando el documento borrado sin recargar la página
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setSelectedIds((prev) => {
        if (!prev.has(docId)) return prev;
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
      toast.success("Archivo eliminado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el archivo. Intenta de nuevo.");
    }
  };

  const handleDeleteVehicle = async (vehicle: any) => {
    const docCount = vehicle.documents?.length || 0;
    const ok = await confirmDialog({
      title: "¿Eliminar este vehículo?",
      description: (
        <>
          Se eliminará <span className="text-white">“{vehicle.name}”</span> del catálogo.
          {docCount > 0 &&
            ` Tiene ${docCount} ${docCount === 1 ? "documento vinculado" : "documentos vinculados"}.`}{" "}
          Esta acción no se puede deshacer.
        </>
      ),
      confirmLabel: "Eliminar vehículo",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteVehicle(vehicle.id);
      toast.success("Vehículo eliminado");
      loadData(true);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el vehículo. Intenta de nuevo.");
    }
  };
  const downloadAlbum = async () => {
    const imgs = documents.filter((doc) => doc.fileType?.startsWith("image/"));
    if (imgs.length === 0 || !category) return;
    setIsZipping(true);
    try {
      const { failed } = await downloadAsZip(imgs, `${category.name}_album`);
      if (failed > 0)
        toast.warning(`Álbum descargado, pero faltaron ${failed} de ${imgs.length} fotos.`);
    } catch (error) {
      console.error("Error creando el ZIP:", error);
      toast.error("No se pudo descargar el álbum. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setIsZipping(false);
    }
  };

  const downloadSelected = async () => {
    const docs = documents.filter((d) => selectedIds.has(d.id));
    if (docs.length === 0 || isDownloadingSelection) return;
    setIsDownloadingSelection(true);
    try {
      if (docs.length === 1) {
        await downloadFile(docs[0].fileUrl, buildFileName(docs[0].title, docs[0].fileType, "archivo"));
      } else {
        const { failed } = await downloadAsZip(docs, `${category?.name || "archivos"}_seleccion`);
        if (failed > 0)
          toast.warning(`Descarga lista, pero faltaron ${failed} de ${docs.length} archivos.`);
      }
    } catch (error) {
      console.error("Error descargando la selección:", error);
      toast.error("No se pudo descargar la selección. Intenta de nuevo.");
    } finally {
      setIsDownloadingSelection(false);
    }
  };

  const deleteSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0 || isBulkDeleting) return;

    const label = ids.length === 1 ? "1 archivo" : `${ids.length} archivos`;
    const ok = await confirmDialog({
      title: `¿Eliminar ${label}?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: `Eliminar ${label}`,
      tone: "danger",
    });
    if (!ok) return;

    setIsBulkDeleting(true);
    // allSettled: si alguno falla, los demás sí se eliminan
    const results = await Promise.allSettled(ids.map((id) => deleteDocument(id)));
    const deleted = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
    const failed = ids.filter((id) => !deleted.has(id));

    setDocuments((prev) => prev.filter((doc) => !deleted.has(doc.id)));
    setIsBulkDeleting(false);

    if (failed.length > 0) {
      console.error(
        "Errores al eliminar:",
        results.filter((r) => r.status === "rejected"),
      );
      // Los que fallaron quedan seleccionados para reintentar
      setSelectedIds(new Set(failed));
      toast.error(`No se pudieron eliminar ${failed.length} de ${ids.length} archivos.`, {
        description: "Siguen seleccionados para que lo intentes de nuevo.",
      });
    } else {
      clearSelection();
      toast.success(deleted.size === 1 ? "Archivo eliminado" : `${deleted.size} archivos eliminados`);
    }
  };

  // Atajos: Supr elimina la selección, Esc la cancela
  useEffect(() => {
    if (!selectionActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (editingDocument || editingVehicle || viewerData) return;
      if (e.key === "Escape") clearSelection();
      if (e.key === "Delete") {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectionActive, selectedIds, isBulkDeleting, editingDocument, editingVehicle, viewerData]);

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

  // ── Lista unificada para las vistas Mosaicos / Lista / Detalles ──
  const explorerItems: ExplorerItem[] = [
    ...subCategories.map(
      (sub: any): ExplorerItem => ({
        id: sub.id,
        kind: "folder",
        name: sub.name,
        typeLabel: "Carpeta",
        size: null,
        date: sub.createdAt ?? null,
        thumb: sub.coverUrl || sub.documents?.[0]?.fileUrl || null,
        icon: sub.icon,
        raw: sub,
      }),
    ),
    ...documents.map((doc): ExplorerItem => {
      const isImage = doc.fileType?.startsWith("image/");
      const size = Number(doc.fileSize);
      return {
        id: doc.id,
        kind: isImage ? "image" : "file",
        name: doc.title || "Sin título",
        typeLabel: getTypeLabel(doc.fileType),
        size: isNaN(size) ? null : size,
        date: doc.createdAt ?? null,
        thumb: isImage ? doc.fileUrl : null,
        fileType: doc.fileType,
        raw: doc,
      };
    }),
  ];

  // Carpetas siempre primero, como en Windows
  const sortedItems = [...explorerItems].sort((a, b) => {
    if (a.kind === "folder" && b.kind !== "folder") return -1;
    if (b.kind === "folder" && a.kind !== "folder") return 1;

    const byName = a.name.localeCompare(b.name, "es", {
      numeric: true,
      sensitivity: "base",
    });
    let cmp = 0;
    switch (sort.key) {
      case "name":
        cmp = byName;
        break;
      case "type":
        cmp = a.typeLabel.localeCompare(b.typeLabel, "es");
        break;
      case "size":
        cmp = (a.size ?? -1) - (b.size ?? -1);
        break;
      case "date":
        cmp =
          (a.date ? new Date(a.date).getTime() : 0) -
          (b.date ? new Date(b.date).getTime() : 0);
        break;
    }
    if (cmp === 0 && sort.key !== "name") cmp = byName;
    return sort.dir === "asc" ? cmp : -cmp;
  });

  // Abre carpeta o visor respetando el orden actual
  const openItem = (item: ExplorerItem) => {
    if (item.kind === "folder") {
      navigate(`/category/${item.id}`);
      return;
    }
    const list = sortedItems.filter((i) => i.kind === item.kind).map((i) => i.raw);
    setViewerData({ list, index: list.findIndex((d) => d.id === item.id) });
  };

  // Orden visible de los elementos seleccionables (para Shift + clic)
  const selectableOrder: string[] =
    viewMode === "icons"
      ? [...images, ...files].map((d) => d.id)
      : sortedItems.filter((i) => i.kind !== "folder").map((i) => i.id);

  const allSelected =
    selectableOrder.length > 0 && selectableOrder.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelect = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (!isAuthenticated) return;

    // Shift + clic: selecciona el rango desde el último elegido
    if (e?.shiftKey && lastSelectedId) {
      const a = selectableOrder.indexOf(lastSelectedId);
      const b = selectableOrder.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [from, to] = a < b ? [a, b] : [b, a];
        setSelectedIds((prev) => {
          const next = new Set(prev);
          selectableOrder.slice(from, to + 1).forEach((x) => next.add(x));
          return next;
        });
        return;
      }
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastSelectedId(id);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      setLastSelectedId(null);
    } else {
      setSelectedIds(new Set(selectableOrder));
    }
  };

  // Con selección activa (o Ctrl/Cmd/Shift) el clic selecciona en vez de abrir
  const selectOrOpen = (
    id: string,
    e: React.MouseEvent | React.KeyboardEvent,
    open: () => void,
  ) => {
    if (isAuthenticated && (selectionActive || e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      toggleSelect(id, e);
      return;
    }
    open();
  };

  const handleItemClick = (item: ExplorerItem, e: React.MouseEvent | React.KeyboardEvent) => {
    if (item.kind === "folder") {
      openItem(item);
      return;
    }
    selectOrOpen(item.id, e, () => openItem(item));
  };

  const itemProps = (item: ExplorerItem) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: (e: React.MouseEvent) => handleItemClick(item, e),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return; // ignora teclas en botones internos
      if (e.key === "Enter") handleItemClick(item, e);
      if (e.key === " " && item.kind !== "folder" && isAuthenticated) {
        e.preventDefault();
        toggleSelect(item.id, e);
      }
    },
  });

  const renderSelectBox = (item: ExplorerItem, className = "") => {
    if (!isAuthenticated) return null;
    // Espaciador para que las carpetas queden alineadas
    if (item.kind === "folder")
      return <span className={`w-5 h-5 shrink-0 ${className}`} aria-hidden />;
    const checked = selectedIds.has(item.id);
    return (
      <SelectBox
        checked={checked}
        onToggle={(e) => toggleSelect(item.id, e)}
        label={`Seleccionar ${item.name}`}
        className={`${
          checked || selectionActive
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        } ${className}`}
      />
    );
  };

  const renderActions = (item: ExplorerItem) => {
    if (!isAuthenticated || item.kind === "folder") return null;
    return (
      <div className={`flex items-center gap-1 transition-opacity shrink-0 ${HOVER_REVEAL}`}>
        {item.kind === "file" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingDocument(item.raw);
            }}
            className="p-1.5 cursor-pointer rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors "
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => handleDeleteFile(e, item.id)}
          className="p-1.5 cursor-pointer rounded-md text-zinc-400 hover:text-white hover:bg-red-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const vehiclesSection = category.vehicles && category.vehicles.length > 0 && (
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
            onDelete={() => handleDeleteVehicle(vehicle)}
          />
        ))}
      </div>
    </div>
  );

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
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

        <div className="flex flex-wrap items-center gap-3">
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
              {isZipping ? "Comprimiendo..." : "Descargar álbum (.zip)"}
            </span>
          </button>
        )}
        {isAuthenticated && (
          <Link
            to={`${UPLOAD_ROUTE}?category=${category.id}`}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Upload className="w-5 h-5" /> Subir aquí
          </Link>
        )}
        </div>
      </div>

      {/* BARRA DE VISTA (como la pestaña "Vista" del explorador) */}
      {explorerItems.length > 0 && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 mb-8 ${
            selectionActive
              ? "sticky top-0 z-30 -mx-3 px-3 py-3 bg-black/85 backdrop-blur border-b border-zinc-800"
              : ""
          }`}
        >
          {selectionActive ? (
            <div className="flex flex-wrap items-center gap-2">
              <SelectBox
                checked={allSelected}
                indeterminate={someSelected}
                onToggle={toggleSelectAll}
                label={allSelected ? "Quitar selección" : "Seleccionar todo"}
              />
              <span className="text-sm text-white font-medium mr-1">
                {selectedIds.size}{" "}
                {selectedIds.size === 1 ? "seleccionado" : "seleccionados"}
              </span>
              <button
                onClick={downloadSelected}
                disabled={selectedIds.size === 0 || isDownloadingSelection}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDownloadingSelection ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloadingSelection ? "Preparando..." : "Descargar"}
              </button>
              <button
                onClick={deleteSelected}
                disabled={selectedIds.size === 0 || isBulkDeleting}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isBulkDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isBulkDeleting ? "Eliminando..." : "Eliminar"}
              </button>
              <button
                onClick={clearSelection}
                className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Cancelar selección (Esc)"
                aria-label="Cancelar selección"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-zinc-500">
                {explorerItems.length}{" "}
                {explorerItems.length === 1 ? "elemento" : "elementos"}
              </p>
              {isAuthenticated && selectableOrder.length > 0 && (
                <button
                  onClick={() => setSelectMode(true)}
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-2 py-1 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" /> Seleccionar
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Ordenar (en Detalles se ordena con los encabezados) */}
            {(viewMode === "tiles" || viewMode === "list") && (
              <div className="flex items-center gap-1">
                <select
                  value={sort.key}
                  onChange={(e) => toggleSort(e.target.value as SortKey)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500"
                  aria-label="Ordenar por"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      Ordenar por {o.label.toLowerCase()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => toggleSort(sort.key)}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={sort.dir === "asc" ? "Ascendente" : "Descendente"}
                >
                  {sort.dir === "asc" ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            <div
              className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg"
              role="group"
              aria-label="Cambiar vista"
            >
              {VIEW_MODES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => changeViewMode(id)}
                  title={label}
                  aria-label={label}
                  aria-pressed={viewMode === id}
                  className={`p-2 rounded-md transition-colors focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 ${
                    viewMode === id
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === "icons" ? (
        <>
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

          {vehiclesSection}

          {/* 2. GALERÍA DE FOTOS */}
          {images.length > 0 && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Galería de Imágenes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, index) => {
                  const checked = selectedIds.has(img.id);
                  return (
                  <div
                    key={img.id}
                    onClick={(e) =>
                      selectOrOpen(img.id, e, () => setViewerData({ list: images, index }))
                    }
                    className={`group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border transition-all block cursor-pointer ${
                      checked
                        ? "border-red-500 ring-2 ring-red-500"
                        : "border-zinc-800 hover:border-red-500"
                    }`}
                  >
                    <img
                      src={img.fileUrl}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {!selectionActive && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium px-3 py-1 bg-red-600 rounded-full">
                          Ver foto
                        </span>
                      </div>
                    )}
                    {checked && (
                      <div className="absolute inset-0 bg-red-600/20 pointer-events-none" />
                    )}
                    {isAuthenticated && (
                      <SelectBox
                        checked={checked}
                        onToggle={(e) => toggleSelect(img.id, e)}
                        label={`Seleccionar ${img.title || "imagen"}`}
                        className={`absolute top-2 left-2 z-10 ${
                          checked || selectionActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    )}
                    {isAuthenticated && (
                      <button
                        onClick={(e) => handleDeleteFile(e, img.id)}
                        className={`absolute top-2 right-2 p-2 bg-black/70 cursor-pointer hover:bg-red-600 text-white rounded-lg transition-colors z-10 ${HOVER_REVEAL}`}
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  );
                })}
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
                {files.map((doc, index) => {
                  const checked = selectedIds.has(doc.id);
                  return (
                  <div
                    key={doc.id}
                    // Captura: en modo selección el clic selecciona en vez de abrir
                    onClickCapture={(e) => {
                      if (
                        isAuthenticated &&
                        (selectionActive || e.ctrlKey || e.metaKey || e.shiftKey)
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(doc.id, e);
                      }
                    }}
                    className={`group/sel relative h-full rounded-xl transition-shadow ${
                      checked ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                  {isAuthenticated && (
                    <SelectBox
                      checked={checked}
                      onToggle={(e) => toggleSelect(doc.id, e)}
                      label={`Seleccionar ${doc.title || "documento"}`}
                      className={`absolute top-3 left-3 z-20 ${
                        checked || selectionActive
                          ? "opacity-100"
                          : "opacity-0 group-hover/sel:opacity-100"
                      }`}
                    />
                  )}
                  <DocumentCard
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
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {vehiclesSection}

          {/* MOSAICOS */}
          {viewMode === "tiles" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedItems.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  {...itemProps(item)}
                  className={`group flex items-center gap-3 p-3 border rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    selectedIds.has(item.id) && item.kind !== "folder"
                      ? "bg-red-600/10 border-red-500"
                      : "bg-[#0f0f0f] border-zinc-800 hover:border-red-500/50 hover:bg-zinc-900/60"
                  }`}
                >
                  {renderSelectBox(item)}
                  <ItemThumb item={item} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-zinc-500 text-xs truncate">{item.typeLabel}</p>
                    {item.kind !== "folder" && (
                      <p className="text-zinc-600 text-xs">{formatSize(item.size)}</p>
                    )}
                  </div>
                  {renderActions(item)}
                </div>
              ))}
            </div>
          )}

          {/* LISTA */}
          {viewMode === "list" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-0.5">
              {sortedItems.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  {...itemProps(item)}
                  className={`group flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    selectedIds.has(item.id) && item.kind !== "folder"
                      ? "bg-red-600/15"
                      : "hover:bg-zinc-900"
                  }`}
                >
                  {renderSelectBox(item)}
                  <ItemThumb item={item} size="sm" />
                  <span className="text-zinc-200 text-sm truncate flex-1" title={item.name}>
                    {item.name}
                  </span>
                  {renderActions(item)}
                </div>
              ))}
            </div>
          )}

          {/* DETALLES */}
          {viewMode === "details" && (
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#0f0f0f]">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800 text-zinc-500">
                  <tr>
                    {isAuthenticated && (
                      <th className="w-10 pl-4 py-3">
                        {selectableOrder.length > 0 && (
                          <SelectBox
                            checked={allSelected}
                            indeterminate={someSelected}
                            onToggle={toggleSelectAll}
                            label={allSelected ? "Quitar selección" : "Seleccionar todo"}
                          />
                        )}
                      </th>
                    )}
                    {SORT_OPTIONS.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 py-3 text-left font-medium ${
                          col.key === "type" || col.key === "size"
                            ? "hidden md:table-cell"
                            : ""
                        } ${col.key === "size" ? "w-28" : ""}`}
                        aria-sort={
                          sort.key === col.key
                            ? sort.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        >
                          {col.label}
                          {sort.key === col.key &&
                            (sort.dir === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            ))}
                        </button>
                      </th>
                    ))}
                    <th className="w-24" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr
                      key={`${item.kind}-${item.id}`}
                      {...itemProps(item)}
                      className={`group border-b border-zinc-900 last:border-0 cursor-pointer focus:outline-none focus-visible:bg-zinc-900 ${
                        selectedIds.has(item.id) && item.kind !== "folder"
                          ? "bg-red-600/10"
                          : "hover:bg-zinc-900/70"
                      }`}
                    >
                      {isAuthenticated && (
                        <td className="w-10 pl-4 py-2">{renderSelectBox(item)}</td>
                      )}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <ItemThumb item={item} size="sm" />
                          <span className="text-zinc-200 truncate max-w-md" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-zinc-400 whitespace-nowrap">
                        {formatDate(item.date, true)}
                      </td>
                      <td className="px-4 py-2 text-zinc-400 whitespace-nowrap hidden md:table-cell">
                        {item.typeLabel}
                      </td>
                      <td className="px-4 py-2 text-zinc-400 whitespace-nowrap hidden md:table-cell tabular-nums">
                        {item.kind === "folder" ? "" : formatSize(item.size)}
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex justify-end">{renderActions(item)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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
          {isAuthenticated && (
            <Link
              to={`${UPLOAD_ROUTE}?category=${category.id}`}
              className="inline-flex items-center gap-2 mt-6 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" /> Subir archivos a esta carpeta
            </Link>
          )}
        </div>
      )}
      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          categoryDocuments={documents}
          onClose={() => setEditingVehicle(null)}
          onSuccess={() => {
            setEditingVehicle(null);
            toast.success("Vehículo actualizado");
            loadData(true);
          }}
        />
      )}
      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSuccess={() => {
            setEditingDocument(null);
            toast.success("Documento actualizado");
            loadData(true);
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