import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] font-sans selection:bg-red-600 selection:text-white overflow-hidden">
      
      {/* Overlay oscuro para móviles: se muestra cuando el menú está abierto */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Pasamos el estado al Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* min-w-0 evita que el contenido empuje el layout en pantallas pequeñas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};