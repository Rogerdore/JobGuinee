import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, History, Trash2, Eye, Save, X, Code, Sparkles, Crown, ArrowLeft } from 'lucide-react';
import { IAConfigService, IAServiceTemplate } from '../services/iaConfigService';

interface TemplateEditorProps {
  template: IAServiceTemplate | null;
  onClose: () => void;
  onSave: () => void;
  isNew?: boolean;
}

function TemplateEditor({ template, onClose, onSave, isNew = false }: TemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<IAServiceTemplate>>({
    service_code: '',
    template_name: '',
    template_description: '',
    template_structure: '',
    format: 'html',
    is_default: false,
    is_active: true,
    is_premium: false,
    min_credits_required: 0,
    display_order: 0
  });
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState('');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (template && !isNew) {
      setFormData(template);
    }
  }, [template, isNew]);

  const handleSave = async () => {
    if (!formData.service_code || !formData.template_name || !formData.template_structure) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (isNew) {
        result = await IAConfigService.createTemplate(formData);
      } else {
        result = await IAConfigService.updateTemplate(
          template!.id,
          formData,
          changeReason || 'Modification template'
        );
      }

      if (result.success) {
        alert(isNew ? 'Template créé avec succès!' : 'Template mis à jour!');
        onSave();
        onClose();
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!previewData || !formData.template_structure) {
      alert('Entrez des données JSON dans le champ Preview Data');
      return;
    }

    try {
      const data = JSON.parse(previewData);
      const result = IAConfigService.applyTemplate(data, formData.template_structure);
      setPreview(result);
      setShowPreview(true);
    } catch (error) {
      alert('Erreur JSON ou template invalide: ' + error);
    }
  };

  const services = [
    { code: 'ai_cv_generation', label: 'Génération CV' },
    { code: 'ai_cover_letter', label: 'Lettre de Motivation' },
    { code: 'ai_coach', label: 'Coach Entretien' },
    { code: 'ai_matching', label: 'Matching' },
    { code: 'ai_career_plan', label: 'Plan de Carrière' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {isNew ? 'Nouveau Template' : 'Modifier Template'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service IA *
              </label>
              <select
                value={formData.service_code}
                onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                disabled={!isNew}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Sélectionner...</option>
                {services.map(s => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Template *
              </label>
              <input
                type="text"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="CV Moderne Professionnel"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.template_description || ''}
              onChange={(e) => setFormData({ ...formData, template_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Template HTML moderne avec design élégant"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format *
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
                <option value="text">Text</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordre d'affichage
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crédits requis (si premium)
              </label>
              <input
                type="number"
                value={formData.min_credits_required}
                onChange={(e) => setFormData({ ...formData, min_credits_required: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!formData.is_premium}
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Template par défaut</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Actif</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                Premium
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Structure du Template * (syntaxe: {`{{field}}, {{#each array}}...{{/each}}`})
            </label>
            <textarea
              value={formData.template_structure}
              onChange={(e) => setFormData({ ...formData, template_structure: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows={12}
              placeholder={`<div>
  <h1>{{nom}}</h1>
  <p>{{titre}}</p>
  {{#each experiences}}
    <h3>{{poste}} - {{entreprise}}</h3>
  {{/each}}
</div>`}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Preview Data (JSON pour tester)
              </label>
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Prévisualiser
              </button>
            </div>
            <textarea
              value={previewData}
              onChange={(e) => setPreviewData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows={4}
              placeholder={`{"nom": "Jean Dupont", "titre": "Développeur", "experiences": [{"poste": "Dev", "entreprise": "TechCo"}]}`}
            />
          </div>

          {showPreview && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Aperçu:</h3>
              <div className="bg-white p-4 rounded border">
                {formData.format === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: preview }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">{preview}</pre>
                )}
              </div>
            </div>
          )}

          {!isNew && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la modification
              </label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Amélioration du design, ajout de sections..."
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface HistoryModalProps {
  templateId: string;
  onClose: () => void;
}

function HistoryModal({ templateId, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [templateId]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await IAConfigService.getTemplateHistory(templateId);
    setHistory(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Historique des Versions</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-center text-gray-500">Chargement...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500">Aucun historique</p>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Version {history.length - index}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {item.change_reason || 'Modification'}
                    </span>
                  </div>

                  {item.new_format !== item.old_format && (
                    <p className="text-sm text-blue-600 mb-2">
                      Format changé: {item.old_format} → {item.new_format}
                    </p>
                  )}

                  {item.old_structure !== item.new_structure && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-700 font-medium">
                        Voir les changements
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-red-600 font-medium">Ancienne structure:</p>
                          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                            {item.old_structure?.substring(0, 200)}...
                          </pre>
                        </div>
                        <div>
                          <p className="text-green-600 font-medium">Nouvelle structure:</p>
                          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                            {item.new_structure?.substring(0, 200)}...
                          </pre>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  onNavigate: (page: string) => void;
}

export default function AdminIATemplates({ onNavigate }: PageProps) {
  const [templates, setTemplates] = useState<IAServiceTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<IAServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IAServiceTemplate | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTemplateId, setHistoryTemplateId] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, filterService, filterFormat]);

  const loadTemplates = async () => {
    setLoading(true);
    const allTemplates: IAServiceTemplate[] = [];

    const services = ['ai_cv_generation', 'ai_cover_letter', 'ai_coach', 'ai_matching', 'ai_career_plan'];

    for (const service of services) {
      const data = await IAConfigService.getTemplates(service, false);
      allTemplates.push(...data);
    }

    setTemplates(allTemplates);
    setLoading(false);
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.template_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterService) {
      filtered = filtered.filter(t => t.service_code === filterService);
    }

    if (filterFormat) {
      filtered = filtered.filter(t => t.format === filterFormat);
    }

    setFilteredTemplates(filtered);
  };

  const handleEdit = (template: IAServiceTemplate) => {
    setSelectedTemplate(template);
    setIsNewTemplate(false);
    setShowEditor(true);
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setIsNewTemplate(true);
    setShowEditor(true);
  };

  const handleDelete = async (template: IAServiceTemplate) => {
    if (!confirm(`Supprimer le template "${template.template_name}" ?`)) return;

    const success = await IAConfigService.deleteTemplate(template.id);
    if (success) {
      alert('Template supprimé');
      loadTemplates();
    } else {
      alert('Erreur lors de la suppression');
    }
  };

  const handleShowHistory = (template: IAServiceTemplate) => {
    setHistoryTemplateId(template.id);
    setShowHistory(true);
  };

  const services = [
    { code: 'ai_cv_generation', label: 'Génération CV' },
    { code: 'ai_cover_letter', label: 'Lettre de Motivation' },
    { code: 'ai_coach', label: 'Coach Entretien' },
    { code: 'ai_matching', label: 'Matching' },
    { code: 'ai_career_plan', label: 'Plan de Carrière' }
  ];

  return (
    <div className="p-6">
      <button
        onClick={() => onNavigate('home')}
        className="mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Retour à l'accueil
      </button>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-purple-600" />
              Templates IA
            </h1>
            <p className="text-gray-600 mt-1">
              Gérer les modèles de documents pour chaque service IA
            </p>
          </div>
          <button
            onClick={handleNew}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau Template
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tous les services</option>
            {services.map(s => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>

          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tous les formats</option>
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
            <option value="text">Text</option>
            <option value="json">JSON</option>
          </select>

          <div className="text-right">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredTemplates.length}</span> template(s)
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {template.template_name}
                    </h3>
                    {template.is_premium && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium ({template.min_credits_required} crédits)
                      </span>
                    )}
                    {template.is_default && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Par défaut
                      </span>
                    )}
                    {!template.is_active && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Inactif
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-2">
                    {template.template_description || 'Pas de description'}
                  </p>

                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>
                      Service: <strong>{services.find(s => s.code === template.service_code)?.label}</strong>
                    </span>
                    <span>
                      Format: <strong className="uppercase">{template.format}</strong>
                    </span>
                    <span>
                      Ordre: <strong>{template.display_order}</strong>
                    </span>
                    <span>
                      Créé: {new Date(template.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Modifier"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShowHistory(template)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="Historique"
                  >
                    <History className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun template trouvé</p>
            </div>
          )}
        </div>
      )}

      {showEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => setShowEditor(false)}
          onSave={loadTemplates}
          isNew={isNewTemplate}
        />
      )}

      {showHistory && (
        <HistoryModal
          templateId={historyTemplateId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
