import { useState, useEffect } from 'react';
import { Folder, Pencil, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { getSidebarMenu, createCategory, updateCategory, deleteCategory } from '../services/knowledge.service';
import { DynamicIcon } from '@/shared/components/ui/DynamicIcon';

const AVAILABLE_ICONS = [
  { name: "Folder", label: "Carpeta Genérica" },
  { name: "CarFront", label: "Autos Nuevos" },
  { name: "Wrench", label: "Herramientas" },
  { name: "Image", label: "Fotografías" },
  { name: "Tag", label: "Precios" },
  { name: "FileText", label: "Fichas Técnicas" },
  { name: "Car", label: "Modelo Específico" },
  { name: "Video", label: "Video / Multimedia" },
  { name: "BookOpen", label: "Libro / Manual" },
];

// Función para aplanar el árbol y ponerle guiones visuales a los hijos
const flattenTree = (nodes: any[], level = 0): any[] => {
  let result: any[] = [];
  nodes.forEach(node => {
    result.push({ ...node, level });
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, level + 1));
    }
  });
  return result;
};

export const AdminCategoriesPage = () => {
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [parentId, setParentId] = useState(''); // NUEVO: Carpeta Padre
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const tree = await getSidebarMenu(); // Traemos el árbol del backend
      setFlatCategories(flattenTree(tree)); // Lo aplanamos para el Select y la Lista
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Folder');
    setParentId(cat.parentId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIcon('Folder');
    setParentId('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta categoría? Se eliminarán también sus sub-carpetas.")) return;
    try {
      await deleteCategory(id);
      loadData();
    } catch (error) {
      alert("Error al eliminar la categoría.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { name, description, icon, parentId: parentId || null };
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }
      handleCancel();
      loadData();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || "No se pudo guardar"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Administrar Categorías</h1>
        <p className="text-zinc-400">Crea tu estructura de carpetas (Ej. Autos Nuevos {'>'} Fichas Técnicas {'>'} Corolla).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO */}
        <div className="lg:col-span-1 bg-[#0f0f0f] rounded-2xl p-6 border border-zinc-800 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-red-500" /> 
              {editingId ? "Editar Carpeta" : "Nueva Carpeta"}
            </h3>
            {editingId && (
              <button onClick={handleCancel} className="text-zinc-500 hover:text-red-500 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nombre</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Corolla 2025" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 focus:outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descripción (Opcional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Fichas y manuales del Corolla" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 focus:outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Ícono</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <DynamicIcon name={icon} fallback="Folder" className="w-5 h-5" />
                </div>
                <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-red-500 focus:outline-none transition-colors appearance-none cursor-pointer">
                  {AVAILABLE_ICONS.map((item) => (
                    <option key={item.name} value={item.name}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* NUEVO: SELECTOR DE CARPETA PADRE */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Carpeta Padre</label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 focus:outline-none transition-colors appearance-none cursor-pointer">
                <option value="">Ninguna (Carpeta Principal)</option>
                {flatCategories.map((cat) => (
                  // Evitamos que una categoría sea padre de sí misma
                  cat.id !== editingId && (
                    <option key={cat.id} value={cat.id}>
                      {"\u00A0\u00A0".repeat(cat.level)} {cat.level > 0 ? '└ ' : ''}{cat.name}
                    </option>
                  )
                ))}
              </select>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 cursor-pointer transition-colors flex items-center justify-center gap-2 mt-2">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "Actualizar Carpeta" : <><Plus className="w-5 h-5" /> Crear Carpeta</>}
            </button>
          </form>
        </div>

        {/* LISTA DE CATEGORÍAS (ÁRBOL) */}
        <div className="lg:col-span-2 bg-[#0f0f0f] rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-lg font-bold text-white mb-4">Estructura Actual</h3>
          <div className="space-y-2">
            {flatCategories.map((cat) => (
              <div 
                key={cat.id} 
                className={`flex items-center gap-4 bg-zinc-900/30 rounded-xl p-3 border transition-colors ${editingId === cat.id ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800/50 hover:border-zinc-700'}`}
                style={{ marginLeft: `${cat.level * 2}rem` }} // Indentación visual
              >
                <div className="w-10 h-10 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <DynamicIcon name={cat.icon} fallback="Folder" className="w-5 h-5" />
                </div>
                
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">{cat.name}</span>
                  {cat.description && <span className="text-xs text-zinc-500 truncate">{cat.description}</span>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleEdit(cat)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {flatCategories.length === 0 && (
              <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No hay carpetas creadas. Empieza creando "Autos Nuevos".
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};