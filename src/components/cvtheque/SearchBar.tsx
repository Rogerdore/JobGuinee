import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, onClear, loading, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    onClear?.();
  };

  const exampleSearches = [
    'Comptable OHADA Conakry',
    'Responsable RH bilingue',
    'Ingénieur Électricité Boké',
    'Chauffeur Poids Lourds',
    'Secrétaire de Direction',
  ];

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-white/20 rounded-xl">
          <Search className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Recherche Avancée de Talents</h2>
          <p className="text-blue-100">Trouvez le profil idéal parmi notre base de talents qualifiés</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Comptable, Ingénieur mines, Responsable RH, développeur..."
            className="w-full px-6 py-4 pr-48 text-lg border-2 border-white/30 rounded-xl focus:ring-4 focus:ring-white/50 focus:border-white bg-white/10 text-white placeholder-white/60"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-1"
                title="Effacer la recherche"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 disabled:bg-gray-300 disabled:text-gray-500 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Rechercher
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="text-white/80 text-sm">Exemples :</span>
        {exampleSearches.map((example, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(example);
              onSearch(example);
            }}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
