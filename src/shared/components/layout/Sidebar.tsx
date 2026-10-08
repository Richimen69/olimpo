import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ChevronRight,
  User,
  UploadCloud,
  FolderPlus,
  LogOut,
  X,
} from "lucide-react";
import { getSidebarMenu } from "@/modules/knowledge/services/knowledge.service";
import { DynamicIcon } from "@/shared/components/ui/DynamicIcon";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";

const CategoryNode = ({
  category,
  level = 0,
}: {
  category: any;
  level?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const hasChildren = category.children && category.children.length > 0;
  const isActive = location.pathname === `/category/${category.id}`;

  return (
    <div className="mb-1">
      <div
        className={`flex items-center justify-between rounded-lg transition-colors group ${isActive ? "bg-zinc-900" : "hover:bg-zinc-900"}`}
      >
        <Link
          to={`/category/${category.id}`}
          onClick={() => setIsExpanded(true)}
          className={`flex-1 flex items-center gap-3 py-2.5 text-sm transition-colors ${isActive ? "text-white" : "text-zinc-400 hover:text-white"}`}
          style={{ paddingLeft: `${1 + level * 1}rem` }}
        >
          <span
            className={`${isActive ? "text-red-500" : "text-zinc-500 group-hover:text-red-500"} transition-colors`}
          >
            <DynamicIcon
              name={category.icon}
              fallback={hasChildren ? "Folder" : "FileText"}
              className="w-4 h-4"
            />
          </span>
          <span className="truncate font-medium">{category.name}</span>
        </Link>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="p-2.5 text-zinc-500 hover:text-white cursor-pointer"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${
                isExpanded ? "rotate-90" : "rotate-0"
              }`}
            />
          </button>
        )}
      </div>

      {/* Contenedor animado */}
      {hasChildren && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-1 space-y-1">
              {category.children.map((child: any) => (
                <CategoryNode
                  key={child.id}
                  category={child}
                  level={level + 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({
  isOpen,
  setIsOpen,
}: {
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
}) => {
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const location = useLocation();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getSidebarMenu();
        setMenuTree(data);
      } catch (error) {
        console.error("Error cargando el menú:", error);
      }
    };
    fetchMenu();
  }, []);

  // Cierra el sidebar en móviles automáticamente cada vez que cambias de página
  useEffect(() => {
    if (setIsOpen && window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [location.pathname, setIsOpen]);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-auto bg-[#0a0a0a] border-r border-zinc-800 flex flex-col text-zinc-300 
        transform transition-transform duration-500 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Contenedor del logo con un borde sutil */}
          <div className="p-1.5 bg-zinc-900/80 rounded-xl border border-zinc-800 shadow-inner">
            <img src="/logo_b.svg" alt="Logo" className="w-7 h-7" />
          </div>

          {/* Texto apilado */}
          <div className="flex flex-col justify-center">
            <span className="font-bold text-white tracking-[0.15em] text-lg leading-none">
              OLIMPO
            </span>
            <span className="text-[9px] text-red-500 font-bold tracking-[0.3em] mt-1">
              TOYOTA
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen?.(false)}
          className="md:hidden text-zinc-500 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-2 overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar">
        <div className="px-2">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors mb-4 ${location.pathname === "/" ? "bg-red-600/20 text-white border-l-2 border-red-600" : "hover:bg-zinc-900 text-zinc-400 hover:text-white"}`}
          >
            <Home className="w-5 h-5" /> Inicio
          </Link>
        </div>

        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-4 mt-6">
          Sitios
        </div>

        <div className="px-2">
          {menuTree.map((category) => (
            <CategoryNode key={category.id} category={category} />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-2 bg-[#0a0a0a]">
        {isAuthenticated && user ? (
          <>
            <Link
              to="/admin/upload"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname === "/admin/upload" ? "bg-zinc-800 text-white" : "hover:bg-zinc-900 text-zinc-400 hover:text-white"}`}
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Subir Documento</span>
            </Link>

            <Link
              to="/admin/categories"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname === "/admin/categories" ? "bg-zinc-800 text-white" : "hover:bg-zinc-900 text-zinc-400 hover:text-white"}`}
            >
              <FolderPlus className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Categorías</span>
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer mt-2 group"
              title="Cerrar sesión"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 bg-zinc-800 group-hover:bg-red-500/20 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-red-500 transition-colors shrink-0">
                  <User className="w-4 h-4 group-hover:hidden" />
                  <LogOut className="w-4 h-4 hidden group-hover:block ml-0.5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-500 truncate group-hover:text-red-400/70 transition-colors">
                    {user.area?.name ? user.area.name : "Administrador"}
                  </p>
                </div>
              </div>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 group-hover:bg-red-500/20 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-red-500 transition-colors shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Acceso</p>
                <p className="text-xs text-zinc-500">Gerentes</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
};
