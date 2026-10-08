import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CategoryCard } from "@/modules/knowledge/components/CategoryCard";
import { getHistory, type HistoryItem } from "@/core/history";
import { Clock } from "lucide-react";
import {
  getSidebarMenu,
} from "@/modules/knowledge/services/knowledge.service";
import { DynamicIcon } from "@/shared/components/ui/DynamicIcon";
import { FileViewerModal } from "@/shared/components/ui/FileViewerModal";

export const DashboardPage = () => {
  const [rootCategories, setRootCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerData, setViewerData] = useState<{
    list: any[];
    index: number;
  } | null>(null);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  useEffect(() => {
    setRecentHistory(getHistory());
    const fetchData = async () => {
      try {
        // getSidebarMenu nos trae el árbol. El primer nivel del arreglo son las Carpetas Raíz.
        const tree = await getSidebarMenu();

        setRootCategories(tree);
      } catch (error) {
        console.error("Error cargando el Dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {!isLoading && recentHistory.length > 0 && (
        <div className="mb-12">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Visto Recientemente
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 pb-2">
            {recentHistory.map((item) => (
              <Link
                key={item.id}
                to={item.url}
                className="flex items-center gap-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/50 rounded-xl p-3 min-w-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-red-500 transition-colors shrink-0">
                  <DynamicIcon
                    name={item.icon}
                    fallback="Folder"
                    className="w-5 h-5"
                  />
                </div>
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white truncate">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="text-center text-zinc-500 py-10">
          Cargando tu conocimiento...
        </div>
      ) : (
        <>
          {/* 2. SECCIÓN DE CATEGORÍAS RAÍZ */}
          <div className="mb-12">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">
              ¿Qué necesitas consultar hoy?
            </h3>

            {rootCategories.length === 0 ? (
              <div className="text-zinc-500 text-sm">
                No hay carpetas principales creadas aún.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {rootCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className="block h-full"
                  >
                    <CategoryCard
                      title={cat.name}
                      description={cat.description || "Explorar documentos"}
                      // Usamos el DynamicIcon leyendo el ícono de la BD
                      icon={
                        <DynamicIcon
                          name={cat.icon}
                          fallback="Folder"
                          className="w-8 h-8"
                        />
                      }
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
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
