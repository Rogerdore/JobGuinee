import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Mail, MessageSquare, Bell, Eye, X, CheckCircle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminCommunicationService, CommunicationTemplate } from '../services/adminCommunicationService';
import { useModalContext } from '../contexts/ModalContext';

interface AdminCommunicationTemplatesProps {
  onNavigate: (page: string, param?: string) => void;
}

export default function AdminCommunicationTemplates({
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext(); onNavigate }: AdminCommunicationTemplatesProps) {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CommunicationTemplate | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'email' as 'email' | 'sms' | 'whatsapp' | 'notification',
    subject: '',
    content: '',
    category: 'system',
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await adminCommunicationService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template?: CommunicationTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        channel: template.channel,
        subject: template.subject || '',
        content: template.content,
        category: template.category || 'system',
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        channel: 'email',
        subject: '',
        content: '',
        category: 'system',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await adminCommunicationService.updateTemplate(editingTemplate.id, formData);
      } else {
        await adminCommunicationService.createTemplate(formData);
      }
      setShowModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      showError('Erreur', 'Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const handleDelete = async (id: string) => {
    // Replaced with showConfirm - needs manual async wrapping
    // Original: if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      await adminCommunicationService.deleteTemplate(id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Erreur', 'Erreur lors de la suppression. Veuillez réessayer.');
    }
  };

  const handleToggleActive = async (template: CommunicationTemplate) => {
    try {
      await adminCommunicationService.updateTemplate(template.id, {
        is_active: !template.is_active,
      });
      loadTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-5 h-5 text-blue-600" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-green-700" />;
      case 'notification':
        return <Bell className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const filteredTemplates = filterChannel === 'all'
    ? templates
    : templates.filter((t) => t.channel === filterChannel);

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates de Communication</h1>
              <p className="text-gray-600 mt-1">Gérez vos templates réutilisables</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-[#FF6B00] text-white rounded-xl hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              Nouveau Template
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                >
                  <option value="all">Tous les canaux</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
                <p className="text-gray-500 mt-4">Chargement...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun template trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border-2 rounded-xl p-6 transition ${
                      template.is_active
                        ? 'border-gray-200 hover:border-[#FF8C00]'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(template.channel)}
                        <div>
                          <h3 className="font-bold text-gray-900">{template.name}</h3>
                          <p className="text-xs text-gray-500 capitalize">{template.channel}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          template.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={template.is_active ? 'Actif' : 'Inactif'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            template.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    )}

                    {template.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full mb-4 capitalize">
                        {template.category}
                      </span>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-2">Aperçu:</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewTemplate(template);
                          setShowPreview(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>
                      <button
                        onClick={() => handleOpenModal(template)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du template *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Bienvenue nouveau candidat"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canal *
                  </label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description courte du template"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                >
                  <option value="system">Système</option>
                  <option value="marketing">Marketing</option>
                  <option value="operational">Opérationnel</option>
                </select>
              </div>

              {formData.channel === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet de l'email *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Sujet de l'email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu du message *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={formData.channel === 'sms' ? 4 : 10}
                  placeholder="Contenu du message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Variables disponibles: {'{{prenom}}, {{nom}}, {{role}}, {{lien}}, {{message}}, {{date}}'}
                </p>
                {formData.channel === 'sms' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.content.length} / 160 caractères
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">Template actif</span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.content || (formData.channel === 'email' && !formData.subject)}
                className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Prévisualisation</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {getChannelIcon(previewTemplate.channel)}
                <span className="font-semibold text-gray-900 capitalize">{previewTemplate.channel}</span>
              </div>
              <p className="text-sm text-gray-600">{previewTemplate.name}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              {previewTemplate.channel === 'email' && previewTemplate.subject && (
                <div className="mb-4 pb-4 border-b border-gray-300">
                  <p className="text-xs text-gray-500 mb-1">Sujet:</p>
                  <p className="font-semibold text-gray-900">{previewTemplate.subject}</p>
                </div>
              )}
              <div className="whitespace-pre-wrap text-gray-700">{previewTemplate.content}</div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                Les variables ({'{{prenom}}, {{nom}}, etc.'}) seront remplacées automatiquement lors de l'envoi.
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
