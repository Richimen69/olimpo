import { useState } from 'react';
import { X, Loader2, FileText, CheckSquare, Square } from 'lucide-react';
import { updateVehicle } from '../services/knowledge.service';



interface EditVehicleModalProps {
  vehicle: any;
  categoryDocuments: any[]; // Todos los documentos de la carpeta
  onClose: () => void;
  onSuccess: () => void; // Para recargar la página al terminar
}

export const EditVehicleModal = ({ vehicle, categoryDocuments, onClose, onSuccess }: EditVehicleModalProps) => {
  const [name, setName] = useState(vehicle.name);
  const [engine, setEngine] = useState(vehicle.engine || '');
  const [power, setPower] = useState(vehicle.power || '');
  const [traction, setTraction] = useState(vehicle.traction || '');
 
  
  // Guardamos los IDs de los documentos que están vinculados actualmente
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
    vehicle.documents?.map((d: any) => d.id) || []
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const toggleDocument = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateVehicle(vehicle.id, {
        name, engine, power, traction, documentIds: selectedDocIds
      });
      onSuccess();
    } catch (error) {
      alert("Error al actualizar el vehículo");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Editar Vehículo</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Motorización</label>
              <input type="text" value={engine} onChange={(e) => setEngine(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Potencia</label>
              <input type="text" value={power} onChange={(e) => setPower(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Tracción</label>
              <input type="text" value={traction} onChange={(e) => setTraction(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none" />
            </div>
          </div>

          {/* LISTA DE DOCUMENTOS PARA VINCULAR */}
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-3">Vincular Documentos</h3>
            <p className="text-xs text-zinc-500 mb-4">Selecciona los archivos de esta carpeta que pertenecen a este vehículo.</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {categoryDocuments.length === 0 ? (
                <p className="text-sm text-zinc-600 italic">No hay documentos en esta carpeta.</p>
              ) : (
                categoryDocuments.map(doc => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => toggleDocument(doc.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-red-500/10 border-red-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'}`}
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5 text-red-500 shrink-0" /> : <Square className="w-5 h-5 text-zinc-600 shrink-0" />}
                      <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className={`text-sm truncate ${isSelected ? 'text-white font-medium' : 'text-zinc-400'}`}>{doc.title}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button onClick={onClose} type="button" className="px-6 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors mr-4 cursor-pointer">Cancelar</button>
          <button onClick={handleSubmit} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
          </button>
        </div>

      </div>
    </div>
  );
};