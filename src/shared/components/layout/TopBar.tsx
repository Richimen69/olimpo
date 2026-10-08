import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bookmark, FileText, Loader2, X, Menu } from 'lucide-react';
import { searchKnowledge } from '@/modules/knowledge/services/knowledge.service';
import { DynamicIcon } from '@/shared/components/ui/DynamicIcon';
import { getBookmarks, type BookmarkItem, toggleBookmark } from '@/core/bookmarks';

export const TopBar = ({ onOpenSidebar }: { onOpenSidebar?: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ categories: any[], documents: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<BookmarkItem[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchKnowledge(query);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Error en búsqueda:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  const openDrawer = () => {
    setSavedItems(getBookmarks());
    setIsDrawerOpen(true);
  };

  const handleRemoveBookmark = (item: BookmarkItem) => {
    toggleBookmark(item);
    setSavedItems(getBookmarks());
  };

  return (
    <>
      <header className="h-20 px-4 md:px-8 flex items-center gap-3 md:gap-6 justify-between bg-[#0a0a0a] border-b border-zinc-800/50 relative z-30">
        
        {/* BOTÓN DE MENÚ HAMBURGUESA (Solo en móvil) */}
        <button 
          onClick={onOpenSidebar} 
          className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* BUSCADOR GLOBAL */}
        <div className="flex-1 max-w-2xl relative" ref={searchRef}>
          <div className={`relative flex items-center w-full h-10 md:h-12 rounded-full bg-zinc-900/50 border px-4 transition-colors ${isOpen ? 'border-red-500' : 'border-zinc-800 focus-within:border-zinc-600'}`}>
            {isSearching ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-red-500 animate-spin mr-2 md:mr-3 shrink-0" /> : <Search className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 mr-2 md:mr-3 shrink-0" />}
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => { if (results) setIsOpen(true); }} placeholder="Buscar..." className="w-full bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-500 text-sm" />
            {query && <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white p-1 cursor-pointer">✕</button>}
          </div>

          {isOpen && results && (
            <div className="absolute top-14 left-0 w-full bg-[#0f0f0f] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
              {results.categories.length === 0 && results.documents.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">No se encontraron resultados para "{query}"</div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar py-2">
                  {results.categories.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-1 text-xs font-bold text-zinc-600 uppercase tracking-wider">Carpetas</div>
                      {results.categories.map((cat: any) => (
                        <Link key={cat.id} to={`/category/${cat.id}`} onClick={handleResultClick} className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-900 transition-colors group">
                          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-red-500"><DynamicIcon name={cat.icon} fallback="Folder" className="w-4 h-4" /></div>
                          <span className="text-sm text-zinc-300 group-hover:text-white">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.documents.length > 0 && (
                    <div>
                      <div className="px-4 py-1 text-xs font-bold text-zinc-600 uppercase tracking-wider">Documentos</div>
                      {results.documents.map((doc: any) => (
                        <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer" onClick={handleResultClick} className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-900 transition-colors group">
                          <div className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center text-red-500"><FileText className="w-4 h-4" /></div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm text-zinc-300 group-hover:text-white truncate block">{doc.title}</span>
                            <span className="text-xs text-zinc-500 truncate block">{doc.category?.name || 'Sin carpeta'}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACCIONES DERECHA */}
        <div className="flex items-center gap-2 md:gap-6 text-sm text-zinc-400 font-medium">
          <button onClick={openDrawer} className="cursor-pointer hover:text-white transition-colors flex items-center gap-2">
            <Bookmark className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden md:inline">Guardados</span>
          </button>
        </div>
      </header>

      {/* DRAWER DE GUARDADOS */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className={`fixed top-0 right-0 w-full sm:w-96 h-screen bg-[#0f0f0f] border-l border-zinc-800 z-50 flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-red-500 fill-red-500" /> Documentos Guardados
          </h2>
          <button onClick={() => setIsDrawerOpen(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {savedItems.length === 0 ? (
            <div className="text-center text-zinc-500 mt-10">
              <Bookmark className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p>No tienes documentos guardados.</p>
              <p className="text-sm mt-1">Haz clic en la estrella de un documento para guardarlo aquí.</p>
            </div>
          ) : (
            savedItems.map((item) => (
              <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-4 group">
                <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center text-red-500 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-red-500 transition-colors truncate block">
                    {item.title}
                  </a>
                  <p className="text-xs text-zinc-500 truncate">{item.categoryName}</p>
                </div>
                <button 
                  onClick={() => handleRemoveBookmark(item)}
                  className="text-zinc-600 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  title="Quitar de guardados"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};