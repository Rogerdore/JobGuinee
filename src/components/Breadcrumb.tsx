import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      <button
        onClick={() => items[0]?.onClick?.()}
        className="flex items-center text-gray-600 hover:text-[#0E2F56] transition"
        aria-label="Retour à l'accueil"
      >
        <Home className="w-4 h-4" />
      </button>

      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          {index === items.length - 1 ? (
            <span className="text-[#0E2F56] font-medium" aria-current="page">
              {item.label}
            </span>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-gray-600 hover:text-[#0E2F56] transition hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-600">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
