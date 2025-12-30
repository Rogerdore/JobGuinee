import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Plus, Edit2, Trash2, Check, X, Save, Eye, EyeOff, Copy } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  template_type: 'standard' | 'short' | 'formal' | 'custom';
  subject_template: string;
  body_template: string;
  is_active: boolean;
  is_default: boolean;
  available_variables: string[];
  created_at: string;
  updated_at: string;
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'custom' as const,
    subject_template: '',
    body_template: '',
    is_active: false
  });

  const availableVariables = [
    { name: 'candidate_name', label: 'Nom du candidat', example: 'Mamadou Diallo' },
    { name: 'candidate_email', label: 'Email du candidat', example: 'mamadou@example.com' },
    { name: 'candidate_phone', label: 'Téléphone du candidat', example: '+224 622 00 00 00' },
    { name: 'job_title', label: 'Titre du poste', example: 'Développeur Full Stack' },
    { name: 'company_name', label: 'Nom de l\'entreprise', example: 'TechCorp Guinée' },
    { name: 'recruiter_name', label: 'Nom du recruteur', example: 'Aissatou Barry' },
    { name: 'profile_url', label: 'Lien profil public', example: 'https://jobguinee.com/profile/...' },
    { name: 'platform_url', label: 'URL plateforme', example: 'https://jobguinee.com' },
    { name: 'custom_message', label: 'Message personnalisé', example: 'Fort de 5 ans d\'expérience...' },
    { name: 'has_cv', label: 'A un CV', example: 'true/false' },
    { name: 'has_cover_letter', label: 'A une lettre', example: 'true/false' },
    { name: 'has_other_documents', label: 'A d\'autres documents', example: 'true/false' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('external_application_email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('external_application_email_templates')
          .update({
            name: formData.name,
            description: formData.description,
            subject_template: formData.subject_template,
            body_template: formData.body_template,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('external_application_email_templates')
          .insert({
            ...formData,
            available_variables: availableVariables.map(v => v.name),
            is_default: false
          });

        if (error) throw error;
      }

      setFormData({
        name: '',
        description: '',
        template_type: 'custom',
        subject_template: '',
        body_template: '',
        is_active: false
      });
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Erreur lors de la sauvegarde du template');
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      subject_template: template.subject_template,
      body_template: template.body_template,
      is_active: template.is_active
    });
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      alert('Impossible de supprimer un template système');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      const { error } = await supabase
        .from('external_application_email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (template: EmailTemplate) => {
    try {
      if (!template.is_active) {
        await supabase
          .from('external_application_email_templates')
          .update({ is_active: false })
          .neq('id', template.id);
      }

      const { error } = await supabase
        .from('external_application_email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    alert(`Variable {{${variable}}} copiée !`);
  };

  const generatePreview = (template: EmailTemplate): string => {
    let preview = template.body_template;

    const examples = {
      candidate_name: 'Mamadou Diallo',
      candidate_email: 'mamadou@example.com',
      candidate_phone: '+224 622 00 00 00',
      job_title: 'Développeur Full Stack',
      company_name: 'TechCorp Guinée',
      recruiter_name: 'Aissatou Barry',
      profile_url: 'https://jobguinee.com/profile/abc123',
      platform_url: 'https://jobguinee.com',
      custom_message: 'Fort de 5 ans d\'expérience en développement web, je souhaite mettre mes compétences au service de votre entreprise.'
    };

    Object.entries(examples).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, value);
    });

    preview = preview.replace(/{{#if recruiter_name}}(.*?){{\/if}}/gs, '$1');
    preview = preview.replace(/{{#if custom_message}}(.*?){{\/if}}/gs, '$1');
    preview = preview.replace(/{{#if has_cv}}(.*?){{\/if}}/gs, '$1');
    preview = preview.replace(/{{#if has_cover_letter}}(.*?){{\/if}}/gs, '$1');
    preview = preview.replace(/{{#if has_other_documents}}/g, '');
    preview = preview.replace(/{{\/if}}/g, '');

    return preview;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates d'Emails - Candidatures Externes</h1>
        <p className="text-gray-600">
          Gérez les templates d'emails envoyés automatiquement lors des candidatures externes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du template
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de template
                </label>
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={editingTemplate?.is_default}
                >
                  <option value="standard">Standard</option>
                  <option value="short">Court</option>
                  <option value="formal">Formel</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objet de l'email
                </label>
                <input
                  type="text"
                  value={formData.subject_template}
                  onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  required
                  placeholder="Candidature – {{job_title}} | {{candidate_name}}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Corps de l'email
                </label>
                <textarea
                  value={formData.body_template}
                  onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  rows={15}
                  required
                  placeholder="Bonjour,&#10;&#10;Je vous adresse ma candidature pour le poste de {{job_title}}..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Activer ce template par défaut
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingTemplate ? 'Mettre à jour' : 'Créer'}
                </button>
                {editingTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setFormData({
                        name: '',
                        description: '',
                        template_type: 'custom',
                        subject_template: '',
                        body_template: '',
                        is_active: false
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Templates existants</h2>

            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.is_default && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Système
                          </span>
                        )}
                        {template.is_active && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Actif
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-600">{template.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {template.template_type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPreview(showPreview === template.id ? null : template.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="Prévisualiser"
                      >
                        {showPreview === template.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(template)}
                        className={`p-2 rounded ${
                          template.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={template.is_active ? 'Désactiver' : 'Activer'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id, template.is_default)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={template.is_default}
                        title={template.is_default ? 'Template système (non supprimable)' : 'Supprimer'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {showPreview === template.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">OBJET:</p>
                        <p className="text-sm font-semibold">
                          {template.subject_template
                            .replace('{{job_title}}', 'Développeur Full Stack')
                            .replace('{{candidate_name}}', 'Mamadou Diallo')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">APERÇU:</p>
                        <pre className="text-xs whitespace-pre-wrap font-sans text-gray-700">
                          {generatePreview(template)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sticky top-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Variables disponibles
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Cliquez pour copier une variable dans votre presse-papier
            </p>
            <div className="space-y-2">
              {availableVariables.map((variable) => (
                <button
                  key={variable.name}
                  onClick={() => copyVariable(variable.name)}
                  className="w-full text-left p-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <code className="text-sm font-mono text-blue-600">
                        {`{{${variable.name}}}`}
                      </code>
                      <p className="text-xs text-gray-600 mt-0.5">{variable.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Ex: {variable.example}</p>
                    </div>
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-3 bg-white rounded border border-blue-200">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Conditions</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <code className="text-blue-600">{`{{#if variable}}`}</code>
                  <p className="text-gray-600 mt-1">Affiche le contenu si la variable existe</p>
                </div>
                <div className="mt-2">
                  <code className="text-blue-600">{`{{/if}}`}</code>
                  <p className="text-gray-600 mt-1">Ferme la condition</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
