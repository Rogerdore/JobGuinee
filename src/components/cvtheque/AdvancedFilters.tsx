import { Filter, X } from 'lucide-react';
import { useState } from 'react';

export interface FilterValues {
  sector?: string;
  location?: string;
  education_level?: string;
  experience_min?: number;
  experience_max?: number;
  contract_type?: string;
  availability?: string;
  languages?: string[];
  mobility?: string;
  verified_only?: boolean;
  gender?: string;
  salary_min?: number;
  salary_max?: number;
  date_available?: string;
}

interface AdvancedFiltersProps {
  onApply: (filters: FilterValues) => void;
  onClear: () => void;
}

export default function AdvancedFilters({ onApply, onClear }: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  const sectors = [
    'Mines', 'RH', 'Finance', 'Sécurité', 'Transport', 'BTP',
    'Logistique', 'Informatique', 'Santé', 'Éducation', 'Agriculture'
  ];

  const locations = [
    'Conakry', 'Boké', 'Kamsar', 'Kankan', 'Kindia', 'Labé',
    'Mamou', 'Nzérékoré', 'Siguiri', 'Fria'
  ];

  const educationLevels = [
    'BEPC', 'Baccalauréat', 'BTS/DUT', 'Licence', 'Master', 'Doctorat'
  ];

  const contractTypes = ['CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'];

  const handleApply = () => {
    onApply(filters);
    setShowFilters(false);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const activeFilterCount = Object.values(filters).filter(v =>
    v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-blue-900" />
          <span className="font-semibold text-gray-900">Filtres avancés</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-900 text-white text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <X className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-0' : 'rotate-45'}`} />
      </button>

      {showFilters && (
        <div className="px-6 py-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
              <select
                value={filters.sector || ''}
                onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les secteurs</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
              <select
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les villes</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Niveau d'études</label>
              <select
                value={filters.education_level || ''}
                onChange={(e) => setFilters({ ...filters, education_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous niveaux</option>
                {educationLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de contrat</label>
              <select
                value={filters.contract_type || ''}
                onChange={(e) => setFilters({ ...filters, contract_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous types</option>
                {contractTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobilité</label>
              <select
                value={filters.mobility || ''}
                onChange={(e) => setFilters({ ...filters, mobility: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                <option value="Nationale">Nationale</option>
                <option value="Internationale">Internationale</option>
                <option value="Régionale">Régionale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expérience (années)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.experience_min || ''}
                  onChange={(e) => setFilters({ ...filters, experience_min: parseInt(e.target.value) || undefined })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.experience_max || ''}
                  onChange={(e) => setFilters({ ...filters, experience_max: parseInt(e.target.value) || undefined })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
              <select
                value={filters.gender || ''}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponibilité
              </label>
              <select
                value={filters.date_available || ''}
                onChange={(e) => setFilters({ ...filters, date_available: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                <option value="immediate">Immédiate</option>
                <option value="1_month">Dans 1 mois</option>
                <option value="3_months">Dans 3 mois</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prétentions salariales (GNF/mois)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.salary_min || ''}
                onChange={(e) => setFilters({ ...filters, salary_min: parseInt(e.target.value) || undefined })}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100000"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.salary_max || ''}
                onChange={(e) => setFilters({ ...filters, salary_max: parseInt(e.target.value) || undefined })}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100000"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified_only || false}
                onChange={(e) => setFilters({ ...filters, verified_only: e.target.checked })}
                className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Profils vérifiés uniquement</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Réinitialiser
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
