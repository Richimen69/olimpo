const BOOKMARKS_KEY = 'toyota_knowledge_bookmarks';

export interface BookmarkItem {
  id: string;
  title: string;
  categoryName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  fileType: string;
}

export const getBookmarks = (): BookmarkItem[] => {
  try {
    const existing = localStorage.getItem(BOOKMARKS_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
};

export const toggleBookmark = (item: BookmarkItem): boolean => {
  let bookmarks = getBookmarks();
  const exists = bookmarks.find(b => b.id === item.id);
  
  if (exists) {
    bookmarks = bookmarks.filter(b => b.id !== item.id); // Lo quitamos
  } else {
    bookmarks.unshift(item); // Lo agregamos al principio
  }
  
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return !exists; // Devuelve true si se guardó, false si se eliminó
};

export const isBookmarked = (id: string): boolean => {
  const bookmarks = getBookmarks();
  return !!bookmarks.find(b => b.id === id);
};