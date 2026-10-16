import { useState } from "react";
import { X, Loader2, FileText, CheckSquare, Square } from "lucide-react";
import { updateVehicle } from "../services/knowledge.service";

interface EditVehicleModalProps {
  vehicle: any;
  categoryDocuments: any[]; // Todos los documentos de la carpeta
  onClose: () => void;
  onSuccess: () => void; // Para recargar la página al terminar
}

export const EditVehicleModal = ({
  vehicle,
  onClose,
  onSuccess,
}: EditVehicleModalProps) => {
  const [name, setName] = useState(vehicle.name);
  const [engine, setEngine] = useState(vehicle.engine || "");
  const [power, setPower] = useState(vehicle.power || "");
  const [torque, setTorque] = useState(vehicle.torque || "");
  const [traction, setTraction] = useState(vehicle.traction || "");
  const [urlImg, setUrlImg] = useState(vehicle.coverUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateVehicle(vehicle.id, {
        name,
        engine,
        power,
        traction,
        torque,
        coverUrl: urlImg,
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
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Motorización
              </label>
              <input
                type="text"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Potencia
              </label>
              <input
                type="text"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Torque
              </label>
              <input
                type="text"
                value={torque}
                onChange={(e) => setTorque(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Tracción
              </label>
              <input
                type="text"
                value={traction}
                onChange={(e) => setTraction(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Imagen de Portada
              </label>
              <input
                type="text"
                value={urlImg}
                onChange={(e) => setUrlImg(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-red-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <img
                src={urlImg}
                alt="Portada"
                className="w-full object-cover rounded-lg"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors mr-4 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
