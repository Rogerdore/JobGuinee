import { ArrowRight, Briefcase, FileText, BookOpen } from 'lucide-react';

interface RelatedItem {
  id: string;
  title: string;
  type: 'job' | 'blog' | 'formation';
  description?: string;
  image?: string;
}

interface RelatedContentProps {
  items: RelatedItem[];
  title?: string;
  onNavigate: (type: string, id: string) => void;
}

export default function RelatedContent({ items, title = 'Contenus similaires', onNavigate }: RelatedContentProps) {
  if (!items || items.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'job':
        return Briefcase;
      case 'blog':
        return FileText;
      case 'formation':
        return BookOpen;
      default:
        return ArrowRight;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'job':
        return 'Offre d\'emploi';
      case 'blog':
        return 'Article';
      case 'formation':
        return 'Formation';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="w-1 h-6 bg-[#FF8C00] mr-3 rounded"></span>
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0, 6).map((item) => {
          const Icon = getIcon(item.type);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.type === 'job') {
                  onNavigate('job-detail', item.id);
                } else if (item.type === 'blog') {
                  onNavigate('blog', item.id);
                } else if (item.type === 'formation') {
                  onNavigate('formations', item.id);
                }
              }}
              className="group p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl hover:border-[#FF8C00] hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-gradient-to-br from-[#FF8C00]/10 to-orange-100 rounded-lg group-hover:from-[#FF8C00] group-hover:to-orange-600 transition">
                  <Icon className="w-5 h-5 text-[#FF8C00] group-hover:text-white transition" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1 font-medium">
                    {getTypeLabel(item.type)}
                  </div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-[#0E2F56] transition line-clamp-2 mb-1">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center text-[#FF8C00] text-sm font-medium mt-2 opacity-0 group-hover:opacity-100 transition">
                    Voir plus
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
