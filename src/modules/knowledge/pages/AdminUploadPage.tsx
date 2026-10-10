import { useState, useEffect } from "react";
import {
  UploadCloud,
  File as FileIcon,
  X,
  Loader2,
  Image as ImageIcon,
  CarFront,
  FileText,
  Link as LinkIcon,
  Star,
} from "lucide-react";
import {
  getUploadUrl,
  createDocument,
  getSidebarMenu,
  createVehicle,
  getVehicles,
  updateCategory,
} from "@/modules/knowledge/services/knowledge.service";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";

const flattenTree = (nodes: any[], level = 0): any[] => {
  let result: any[] = [];
  if (!Array.isArray(nodes)) return result; // Protección extra
  nodes.forEach((node) => {
    result.push({ ...node, level });
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, level + 1));
    }
  });
  return result;
};

export const AdminUploadPage = () => {
  const [uploadMode, setUploadMode] = useState<"document" | "vehicle">(
    "document",
  );
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const user = useAuthStore((state) => state.user);
  // ESTADOS: DOCUMENTOS SUELTOS
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ESTADOS: VEHÍCULO
  const [vName, setVName] = useState("");
  const [vEngine, setVEngine] = useState("");
  const [vPower, setVPower] = useState("");
  const [vTorque, setVTorque] = useState("");
  const [vTraction, setVTraction] = useState("");
  const [vCategoryId, setVCategoryId] = useState("");
  const [vCoverUrl, setVCoverUrl] = useState("");
  const [vCoverFile, setVCoverFile] = useState<File | null>(null);
  const [vDocs, setVDocs] = useState<File[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // 1. Cargamos las categorías (Aislado para que no falle)
      try {
        const tree = await getSidebarMenu();
        setFlatCategories(flattenTree(tree));
      } catch (error) {
        console.error("Error cargando carpetas:", error);
      }

      // 2. Cargamos los vehículos (Aislado)
      try {
        const vehs = await getVehicles();
        if (Array.isArray(vehs)) setVehicles(vehs);
      } catch (error) {
        console.error("Error cargando vehículos:", error);
      }
    };
    loadData();
  }, []);

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || files.length === 0)
      return alert("Selecciona una carpeta y al menos un archivo.");

    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (!user || !user.id)
      return alert("Error de sesión. Inicia sesión nuevamente.");
    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Subiendo ${i + 1} de ${files.length}...`);

        let docTitle = title
          ? files.length > 1
            ? `${title} - ${i + 1}`
            : title
          : file.name;

        const { presignedUrl, fileKey, publicUrl } = await getUploadUrl(
          file.name,
          file.type,
        );
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(`Error al subir: ${file.name}`);

        await createDocument({
          title: docTitle,
          fileUrl: publicUrl,
          fileKey,
          fileType: file.type,
          fileSize: file.size,
          categoryId,
          vehicleId: selectedVehicleId || null,
          uploaderId: authUser.id,
        });

        if (coverIndex === i) {
          await updateCategory(categoryId, { coverUrl: publicUrl });
        }
      }
      alert("¡Archivos subidos con éxito!");
      setTitle("");
      setCategoryId("");
      setSelectedVehicleId("");
      setFiles([]);
      setCoverIndex(null);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName || !vCategoryId)
      return alert("El nombre y la carpeta son obligatorios.");

    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (!authUser.id) return alert("Error de sesión.");

    try {
      setIsUploading(true);
      setUploadProgress("Creando vehículo...");

      let finalCoverUrl = vCoverUrl || null;
      if (vCoverFile) {
        setUploadProgress("Subiendo foto de portada...");
        const { presignedUrl, publicUrl } = await getUploadUrl(
          vCoverFile.name,
          vCoverFile.type,
        );
        await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": vCoverFile.type },
          body: vCoverFile,
        });
        finalCoverUrl = publicUrl;
      }

      const newVehicle = await createVehicle({
        name: vName,
        engine: vEngine,
        power: vPower,
        traction: vTraction,
        torque: vTorque,
        categoryId: vCategoryId,
        coverUrl: finalCoverUrl,
      });

      if (vDocs.length > 0) {
        for (let i = 0; i < vDocs.length; i++) {
          const file = vDocs[i];
          setUploadProgress(
            `Subiendo documento ${i + 1} de ${vDocs.length}...`,
          );
          const { presignedUrl, fileKey, publicUrl } = await getUploadUrl(
            file.name,
            file.type,
          );
          await fetch(presignedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          await createDocument({
            title: file.name,
            fileUrl: publicUrl,
            fileKey,
            fileType: file.type,
            fileSize: file.size,
            categoryId: vCategoryId,
            vehicleId: newVehicle.id,
            uploaderId: authUser.id,
          });
        }
      }

      alert("¡Vehículo creado con éxito!");
      setVName("");
      setVEngine("");
      setVPower("");
      setVTorque("");
      setVTraction("");
      setVCategoryId("");
      setVCoverUrl("");
      setVCoverFile(null);
      setVDocs([]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Añadir Contenido</h1>
        <p className="text-zinc-400">
          Sube documentos sueltos o registra un nuevo modelo en el catálogo.
        </p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-px">
        <button
          onClick={() => setUploadMode("document")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 cursor-pointer ${uploadMode === "document" ? "border-red-500 text-red-500" : "border-transparent text-zinc-500 hover:text-white"}`}
        >
          <FileText className="w-4 h-4" /> Documentos Sueltos
        </button>
        <button
          onClick={() => setUploadMode("vehicle")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 cursor-pointer ${uploadMode === "vehicle" ? "border-red-500 text-red-500" : "border-transparent text-zinc-500 hover:text-white"}`}
        >
          <CarFront className="w-4 h-4" /> Nuevo Vehículo (Catálogo)
        </button>
      </div>

      {uploadMode === "document" && (
        <form
          onSubmit={handleDocumentSubmit}
          className="space-y-6 bg-[#0f0f0f] p-8 rounded-2xl border border-zinc-800 animate-fade-in"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Título base (Opcional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Fotos Corolla"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none"
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Carpeta de destino *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none cursor-pointer"
                disabled={isUploading}
              >
                <option value="">Selecciona una carpeta...</option>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {"\u00A0\u00A0".repeat(cat.level)}{" "}
                    {cat.level > 0 ? "└ " : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Vincular a Vehículo (Opcional)
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none cursor-pointer"
                disabled={isUploading}
              >
                <option value="">Ninguno (Archivo suelto)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Archivos
            </label>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files)
                  setFiles((prev) => [
                    ...prev,
                    ...Array.from(e.dataTransfer.files),
                  ]);
              }}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group mb-4 ${isDragging ? "border-red-500 bg-red-500/10" : "border-zinc-700 hover:bg-zinc-900/50 hover:border-red-500/50"}`}
            >
              <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-red-500 mb-2" />
              <p className="text-zinc-300 font-medium">
                Haz clic o arrastra tus archivos aquí
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files)
                    setFiles((prev) => [
                      ...prev,
                      ...Array.from(e.target.files!),
                    ]);
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.mp4,image/*"
              />
            </label>

            {files.length > 0 && (
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
                {files.map((file, index) => {
                  // NUEVO: Validación robusta para saber si es imagen (por MIME type o por extensión)
                  const isImage =
                    file.type.startsWith("image/") ||
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between bg-zinc-900 rounded-lg p-3 border transition-colors ${coverIndex === index ? "border-red-500 bg-red-500/5" : "border-zinc-800/50"}`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        {isImage ? (
                          <ImageIcon className="w-5 h-5 text-zinc-400 shrink-0" />
                        ) : (
                          <FileIcon className="w-5 h-5 text-zinc-400 shrink-0" />
                        )}
                        <span className="text-white text-sm truncate">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* BOTÓN DE ESTRELLA (Ahora usa la validación robusta) */}
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => setCoverIndex(index)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${coverIndex === index ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"}`}
                          >
                            <Star
                              className={`w-3 h-3 ${coverIndex === index ? "fill-white" : ""}`}
                            />
                            {coverIndex === index
                              ? "Portada"
                              : "Usar de portada"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                          className="text-zinc-500 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isUploading || files.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> {uploadProgress}
                </>
              ) : (
                "Subir Documentos"
              )}
            </button>
          </div>
        </form>
      )}

      {/* FORMULARIO 2: NUEVO VEHÍCULO */}
      {uploadMode === "vehicle" && (
        <form
          onSubmit={handleVehicleSubmit}
          className="space-y-6 bg-[#0f0f0f] p-8 rounded-2xl border border-zinc-800 animate-fade-in"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Nombre del Vehículo *
              </label>
              <input
                type="text"
                required
                value={vName}
                onChange={(e) => setVName(e.target.value)}
                placeholder="Ej. Toyota GR Yaris Rally2 2025"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Carpeta de destino *
              </label>
              <select
                required
                value={vCategoryId}
                onChange={(e) => setVCategoryId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none cursor-pointer"
                disabled={isUploading}
              >
                <option value="">Selecciona una carpeta...</option>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {"\u00A0\u00A0".repeat(cat.level)}{" "}
                    {cat.level > 0 ? "└ " : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Motorización
              </label>
              <input
                type="text"
                value={vEngine}
                onChange={(e) => setVEngine(e.target.value)}
                placeholder="Ej. 1.6L Turbo G16E-GTS"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Potencia Máxima
              </label>
              <input
                type="text"
                value={vPower}
                onChange={(e) => setVPower(e.target.value)}
                placeholder="Ej. 280 HP @ 6,500 rpm"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Torque
              </label>
              <input
                type="text"
                value={vTorque}
                onChange={(e) => setVTorque(e.target.value)}
                placeholder="Ej. 350 Nm @ 1,500 rpm"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Tracción
              </label>
              <input
                type="text"
                value={vTraction}
                onChange={(e) => setVTraction(e.target.value)}
                placeholder="Ej. Integral AWD GR-FOUR"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none"
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800 pt-6">
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-medium text-zinc-300">
                Foto de Portada
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="w-4 h-4 text-zinc-500" />
                </div>
                <input
                  type="url"
                  value={vCoverUrl}
                  onChange={(e) => {
                    setVCoverUrl(e.target.value);
                    setVCoverFile(null);
                  }}
                  placeholder="Pegar URL de la imagen..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-red-600 outline-none text-sm"
                  disabled={isUploading}
                />
              </div>
              <div className="text-center text-xs text-zinc-600 font-medium uppercase">
                O subir archivo
              </div>
              <label
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-24 ${vCoverFile ? "border-red-500 bg-red-500/10" : "border-zinc-700 hover:border-red-500 bg-zinc-900/30"}`}
              >
                {vCoverFile ? (
                  <div className="text-red-500 font-medium text-sm flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> {vCoverFile.name}
                  </div>
                ) : (
                  <span className="text-zinc-400 text-sm flex items-center gap-2">
                    <UploadCloud className="w-5 h-5" /> Clic para subir foto
                  </span>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setVCoverFile(e.target.files[0]);
                      setVCoverUrl("");
                    }
                  }}
                  accept="image/*"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Documentos Vinculados (PDFs, etc)
              </label>
              <label className="border-2 border-dashed border-zinc-700 hover:border-red-500 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-zinc-900/30 h-41">
                <FileIcon className="w-6 h-6 text-zinc-500 mb-2" />
                <span className="text-zinc-400 text-sm">
                  {vDocs.length > 0
                    ? `${vDocs.length} archivos seleccionados`
                    : "Clic para adjuntar PDFs"}
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) setVDocs(Array.from(e.target.files));
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> {uploadProgress}
                </>
              ) : (
                "Crear Vehículo en Catálogo"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
