import type { ReactNode } from "react";

interface CategoryCardProps {
  title: string;
  description?: string;
  icon: ReactNode;
}

// Es un <div>: el elemento interactivo es el <Link> que la envuelve.
// (Un <button> dentro de un <Link> es HTML inválido y confunde a los lectores de pantalla.)
export const CategoryCard = ({ title, description, icon }: CategoryCardProps) => {
  return (
    <div className="cursor-pointer flex flex-col items-center justify-center p-6 h-full rounded-xl bg-[#0f0f0f] border border-zinc-800 hover:border-red-600/50 hover:bg-zinc-900 transition-all group text-center">
      <div className="mb-4 text-red-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h4 className="text-white font-bold text-sm uppercase tracking-wide">{title}</h4>
      {description && (
        <p className="text-zinc-500 text-xs leading-relaxed mt-2 line-clamp-3">{description}</p>
      )}
    </div>
  );
};