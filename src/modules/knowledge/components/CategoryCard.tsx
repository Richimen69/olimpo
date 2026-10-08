import type { ReactNode } from 'react';

interface CategoryCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export const CategoryCard = ({ title, description, icon }: CategoryCardProps) => {
  return (
    <button className="cursor-pointer flex flex-col items-center justify-center p-6 h-full rounded-xl bg-[#0f0f0f] border border-zinc-800 hover:border-red-600/50 hover:bg-zinc-900 transition-all group text-center">
      <div className="mb-4 text-red-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-wide">
        {title}
      </h4>
      <p className="text-zinc-500 text-xs leading-relaxed">
        {description}
      </p>
    </button>
  );
};