import { useState, useEffect } from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';

interface Education {
  degree: string;
  field: string;
  institution: string;
  year: string;
}

interface EducationFieldsImprovedProps {
  educations: Education[];
  onChange: (educations: Education[]) => void;
}

const COMMON_FIELDS = [
  'Gestion des Ressources Humaines',
  'Finance et Comptabilité',
  'Informatique et Technologies',
  'Génie Minier',
  'Génie Civil',
  'Administration des Affaires',
  'Marketing et Communication',
  'Droit',
  'Économie',
  'Santé et Médecine',
  'Éducation et Pédagogie',
  'Agriculture et Agronomie',
  'Transport et Logistique',
  'Hôtellerie et Tourisme',
  'Autre',
];

export default function EducationFieldsImproved({ educations, onChange }: EducationFieldsImprovedProps) {
  const [edus, setEdus] = useState<Education[]>(educations);

  useEffect(() => {
    if (JSON.stringify(educations) !== JSON.stringify(edus)) {
      if (educations.length > 0 || edus.length === 0) {
        setEdus(educations);
      }
    }
  }, [educations]);

  useEffect(() => {
    onChange(edus);
  }, [edus, onChange]);

  const addEducation = () => {
    const newEdu: Education = {
      degree: '',
      field: '',
      institution: '',
      year: ''
    };
    setEdus([...edus, newEdu]);
  };

  const removeEducation = (index: number) => {
    setEdus(edus.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...edus];
    updated[index] = { ...updated[index], [field]: value };
    setEdus(updated);
  };

  const YEARS = Array.from({ length: 60 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-4">
      {edus.map((edu, index) => (
        <div key={index} className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">Formation #{index + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => removeEducation(index)}
              className="text-red-500 hover:text-red-700 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Diplôme obtenu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={edu.degree}
              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
              placeholder="Ex: Licence en Gestion des Ressources Humaines"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Domaine d'étude <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list={`field-suggestions-${index}`}
                value={edu.field}
                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                placeholder="Ex: Gestion des Ressources Humaines"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <datalist id={`field-suggestions-${index}`}>
                {COMMON_FIELDS.map((field) => (
                  <option key={field} value={field} />
                ))}
              </datalist>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sélectionnez un domaine dans la liste ou saisissez le vôtre
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Établissement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                placeholder="Ex: Université de Conakry"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Année d'obtention <span className="text-red-500">*</span>
              </label>
              <select
                value={edu.year}
                onChange={(e) => updateEducation(index, 'year', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner...</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEducation}
        className="w-full px-4 py-3 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-purple-600 hover:bg-purple-50 transition flex items-center justify-center gap-2 font-semibold"
      >
        <Plus className="w-5 h-5" />
        Ajouter une formation
      </button>

      {edus.length === 0 && (
        <p className="text-sm text-red-600 text-center py-2">
          Au moins une formation est requise
        </p>
      )}
    </div>
  );
}
