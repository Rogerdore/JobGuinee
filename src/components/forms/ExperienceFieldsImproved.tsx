import { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase, Calendar } from 'lucide-react';

interface Experience {
  position: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  description: string;
  duration?: string;
}

interface ExperienceFieldsImprovedProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const YEARS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());

function calculateDuration(startMonth: string, startYear: string, endMonth: string, endYear: string, isCurrent: boolean): string {
  if (!startMonth || !startYear) return '';

  const start = new Date(parseInt(startYear), MONTHS.indexOf(startMonth), 1);
  const end = isCurrent
    ? new Date()
    : new Date(parseInt(endYear || startYear), MONTHS.indexOf(endMonth || startMonth), 1);

  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();
  months = Math.max(0, months + 1);

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} mois`;
  } else if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  } else {
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  }
}

export function calculateTotalExperience(experiences: Experience[]): string {
  let totalMonths = 0;

  experiences.forEach(exp => {
    if (!exp.startMonth || !exp.startYear) return;

    const start = new Date(parseInt(exp.startYear), MONTHS.indexOf(exp.startMonth), 1);
    const end = exp.current
      ? new Date()
      : new Date(parseInt(exp.endYear || exp.startYear), MONTHS.indexOf(exp.endMonth || exp.startMonth), 1);

    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    months = Math.max(0, months + 1);

    totalMonths += months;
  });

  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  if (years === 0 && remainingMonths === 0) {
    return '0 mois';
  } else if (years === 0) {
    return `${remainingMonths} mois`;
  } else if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  } else {
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  }
}

export default function ExperienceFieldsImproved({ experiences, onChange }: ExperienceFieldsImprovedProps) {
  const [exps, setExps] = useState<Experience[]>(experiences);

  useEffect(() => {
    if (experiences.length > 0 && exps.length === 0) {
      setExps(experiences);
    }
  }, [experiences, exps.length]);

  useEffect(() => {
    onChange(exps);
  }, [exps, onChange]);

  const addExperience = () => {
    const newExp: Experience = {
      position: '',
      company: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      current: false,
      description: '',
      duration: ''
    };
    setExps([...exps, newExp]);
  };

  const removeExperience = (index: number) => {
    setExps(exps.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...exps];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'current' && value === true) {
      updated[index].endMonth = '';
      updated[index].endYear = '';
    }

    updated[index].duration = calculateDuration(
      updated[index].startMonth,
      updated[index].startYear,
      updated[index].endMonth,
      updated[index].endYear,
      updated[index].current
    );

    setExps(updated);
  };

  const totalExp = calculateTotalExperience(exps);

  return (
    <div className="space-y-4">
      {exps.map((exp, index) => (
        <div key={index} className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">Expérience #{index + 1}</span>
                {exp.duration && (
                  <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                    {exp.duration}
                  </span>
                )}
              </div>
              {(exp.startMonth && exp.startYear) && (
                <div className="flex items-center gap-1 text-xs text-gray-600 ml-7">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {exp.startMonth} {exp.startYear} - {exp.current ? "Aujourd'hui" : exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : '...'}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeExperience(index)}
              className="text-red-500 hover:text-red-700 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Poste occupé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exp.position}
                onChange={(e) => updateExperience(index, 'position', e.target.value)}
                placeholder="Ex: Chargé RH"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Entreprise <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                placeholder="Ex: UMS Mining"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Période</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mois début</label>
                <select
                  value={exp.startMonth}
                  onChange={(e) => updateExperience(index, 'startMonth', e.target.value)}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {MONTHS.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Année début</label>
                <select
                  value={exp.startYear}
                  onChange={(e) => updateExperience(index, 'startYear', e.target.value)}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Mois fin</label>
                <select
                  value={exp.endMonth}
                  onChange={(e) => updateExperience(index, 'endMonth', e.target.value)}
                  disabled={exp.current}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-</option>
                  {MONTHS.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Année fin</label>
                <select
                  value={exp.endYear}
                  onChange={(e) => updateExperience(index, 'endYear', e.target.value)}
                  disabled={exp.current}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Jusqu'à maintenant</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Missions principales
            </label>
            <textarea
              value={exp.description}
              onChange={(e) => updateExperience(index, 'description', e.target.value)}
              placeholder="Décrivez vos responsabilités et réalisations..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addExperience}
        className="w-full px-4 py-3 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-semibold"
      >
        <Plus className="w-5 h-5" />
        Ajouter une expérience
      </button>

      {exps.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-600" />
            <span className="font-bold text-gray-800">
              Expérience totale: <span className="text-green-600">{totalExp}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
