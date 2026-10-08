import { useState, useEffect } from 'react';
import { X, Loader2, Folder, CarFront } from 'lucide-react';
import { updateDocument, getSidebarMenu, getVehicles } from '../services/knowledge.service';

const flattenTree = (nodes: any[], level = 0): any[] => {
  let result: any[] = [];
  if (!Array.isArray(nodes)) return result;
  nodes.forEach(node => {
    result.push({ ...node, level });
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, level + 1));
    }
  });
  return result;
};

interface EditDocumentModalProps {
  document: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditDocumentModal = ({ document, onClose, onSuccess }: EditDocumentModalProps) => {
  const [title, setTitle] = useState(document.title || '');
  const [categoryId, setCategoryId] = useState(document.categoryId || '');
  const [vehicleId, setVehicleId] = useState(document.vehicleId || ''); // NUEVO: Estado para el vehículo
  
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]); // NUEVO: Estado para guardar los vehículos
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargamos carpetas y vehículos al abrir el modal
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tree, vehs] = await Promise.all([
          getSidebarMenu(),
          getVehicles() // Obtenemos todos los vehículos
        ]);
        
        setFlatCategories(flattenTree(tree));
        if (Array.isArray(vehs)) setVehicles(vehs);
        
      } catch (error) {
        console.error("Error cargando datos del modal:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Enviamos el title, categoryId y vehicleId
      await updateDocument(document.id, { 
        title, 
        categoryId, 
        vehicleId: vehicleId || null // Si está vacío, se envía null para desvincularlo
      });
      onSuccess();
    } catch (error) {
      alert("Error al actualizar el documento");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-fade-in">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Editar Documento</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Título del archivo</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none" 
              required 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2">
              <Folder className="w-4 h-4" /> Mover a la carpeta
            </label>
            <select 
              required 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)} 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none cursor-pointer" 
              disabled={isSaving || isLoadingData}
            >
              <option value="">Selecciona una carpeta...</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {"\u00A0\u00A0".repeat(cat.level)} {cat.level > 0 ? '└ ' : ''}{cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* NUEVO: Selector de Vehículo */}
          <div>
            <label className="text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2">
              <CarFront className="w-4 h-4" /> Vincular a Vehículo (Opcional)
            </label>
            <select 
              value={vehicleId} 
              onChange={(e) => setVehicleId(e.target.value)} 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none cursor-pointer" 
              disabled={isSaving || isLoadingData}
            >
              <option value="">Ninguno (Archivo suelto)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-zinc-800/50">
            <button 
              onClick={onClose} 
              type="button" 
              className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving || isLoadingData} 
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};