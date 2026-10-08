import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name?: string | null;
  className?: string;
  fallback?: keyof typeof LucideIcons;
}

export const DynamicIcon = ({ name, className = "w-4 h-4", fallback = "Folder" }: DynamicIconProps) => {
  const IconComponent = name && (LucideIcons as any)[name] 
    ? (LucideIcons as any)[name] 
    : (LucideIcons as any)[fallback];

  return <IconComponent className={className} />;
};