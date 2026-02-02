import { useEffect, useState } from 'react';
import {
  Users, CheckCircle, XCircle, Clock, TrendingUp, Mail, Phone,
  Building2, MessageSquare, User, Calendar, Eye, Edit, Save, X,
  ToggleLeft, ToggleRight, Globe, FileText, HelpCircle, Bell
} from 'lucide-react';
import { b2bLeadsService, B2BLead, B2BPageConfig } from '../services/b2bLeadsService';
import { supabase } from '../lib/supabase';

type TabType = 'leads' | 'config' | 'seo';

export default function AdminB2BManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [leads, setLeads] = useState<B2BLead[]>([]);
  const [pageConfig, setPageConfig] = useState<B2BPageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<B2BLead | null>(null);
  const [editingSection, setEditingSection] = useState<B2BPageConfig | null>(null);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [seoSettings, setSeoSettings] = useState({
    title: 'Solutions B2B RH en Guinée | Recrutement, Externalisation & IA – JobGuinée',
    description: 'Solutions RH B2B complètes : externalisation du recrutement, ATS, matching IA, formation et conseil RH pour entreprises et institutions en Guinée et Afrique de l\'Ouest.',
    keywords: 'solutions b2b rh guinée, externalisation recrutement, ATS digital, CVthèque intelligente, formation professionnelle, conseil RH, recrutement minier, recrutement PME, cabinet RH, matching IA recrutement'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    const channel = supabase
      .channel('b2b_leads_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'b2b_leads'
        },
        (payload) => {
          const newLead = payload.new as B2BLead;

          setLeads(prevLeads => [newLead, ...prevLeads]);
          setNewLeadsCount(prev => prev + 1);

          if (Notification.permission === 'granted') {
            new Notification('Nouvelle demande B2B JobGuinée', {
              body: `${newLead.organization_name} - ${newLead.primary_need}`,
              icon: '/favicon.png',
              tag: 'b2b-lead'
            });
          }

          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGG0fPTgjMGHm7A7OihUBELTKXh8bllHAU2jdXzzn0vBSd7yfDglkoOFGG46OumWRQLSKHf8sFuJAUuhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKDf8sFtJAUvhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKDf8sFtJAUvhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKDf8sFtJAUvhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKDf8sFtJAUvhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKDf8sFtJAUvhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKDf8sFtJAUvhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKDf8sFtJAUvhM/z1YU2Bhxqvu7mnlIOD1Cr5O+vZSAHNIzU8tGAMgYebrzt56FRDQtIoN/ywW0kBS+Ez/PVhTYGHGq+7uaeUg4PUKvk769lIAc0jNTy0YAyBh5uvO3noVENC0ig3/LBbSQFL4TP89WFNgYcar7u5p5SDg9Qq+Tvr2UgBzSM1PLRgDIGHm687eehUQ0LSKAAAAAAAAAAAAAAAAAAAA');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'b2b_leads'
        },
        (payload) => {
          const updatedLead = payload.new as B2BLead;
          setLeads(prevLeads =>
            prevLeads.map(lead =>
              lead.id === updatedLead.id ? updatedLead : lead
            )
          );
        }
      )
      .subscribe();

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    if (activeTab === 'leads') {
      const result = await b2bLeadsService.getAllLeads();
      if (result.success && result.data) {
        setLeads(result.data);
      }
    } else {
      const result = await b2bLeadsService.getAllPageConfig();
      if (result.success && result.data) {
        setPageConfig(result.data);
      }
    }
    setIsLoading(false);
  };

  const updateLeadStatus = async (leadId: string, status: B2BLead['status']) => {
    const result = await b2bLeadsService.updateLeadStatus(leadId, status);
    if (result.success) {
      loadData();
    }
  };

  const toggleSectionVisibility = async (sectionName: string, isActive: boolean) => {
    const result = await b2bLeadsService.toggleSectionVisibility(sectionName, !isActive);
    if (result.success) {
      loadData();
    }
  };

  const saveSection = async () => {
    if (!editingSection) return;

    const result = await b2bLeadsService.updatePageConfig(
      editingSection.section_name,
      {
        title: editingSection.title,
        subtitle: editingSection.subtitle,
        content: editingSection.content,
        cta_text: editingSection.cta_text,
        cta_link: editingSection.cta_link
      }
    );

    if (result.success) {
      setEditingSection(null);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      nouveau: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      contacte: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Mail },
      qualifie: { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircle },
      converti: { bg: 'bg-green-100', text: 'text-green-800', icon: TrendingUp },
      perdu: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.nouveau;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      immediate: 'bg-red-100 text-red-800',
      urgent: 'bg-orange-100 text-orange-800',
      normale: 'bg-blue-100 text-blue-800',
      planifie: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[urgency]}`}>
        {urgency}
      </span>
    );
  };

  const stats = {
    total: leads.length,
    nouveau: leads.filter(l => l.status === 'nouveau').length,
    converti: leads.filter(l => l.status === 'converti').length,
    taux_conversion: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converti').length / leads.length) * 100) : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestion B2B Solutions
                </h1>
                {newLeadsCount > 0 && (
                  <span className="relative flex h-10 w-10">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-10 w-10 bg-green-500 items-center justify-center">
                      <span className="text-white font-bold text-sm">{newLeadsCount}</span>
                    </span>
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2">
                Gérez les leads B2B et configurez la page Solutions
                {newLeadsCount > 0 && (
                  <span className="ml-2 text-green-600 font-semibold">
                    • {newLeadsCount} nouvelle{newLeadsCount > 1 ? 's' : ''} demande{newLeadsCount > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            {newLeadsCount > 0 && (
              <button
                onClick={() => setNewLeadsCount(0)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Marquer comme vu
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {activeTab === 'leads' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Leads</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Nouveaux</span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.nouveau}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Convertis</span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.converti}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Taux conversion</span>
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.taux_conversion}%</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-8">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('leads')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === 'leads'
                    ? 'border-[#FF8C00] text-[#FF8C00]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Leads B2B
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === 'config'
                    ? 'border-[#FF8C00] text-[#FF8C00]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit className="w-5 h-5 inline mr-2" />
                Configuration Page
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === 'seo'
                    ? 'border-[#FF8C00] text-[#FF8C00]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Globe className="w-5 h-5 inline mr-2" />
                SEO Avancé
              </button>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent"></div>
              </div>
            ) : (
              <>
                {activeTab === 'leads' && (
                  <div className="space-y-4">
                    {leads.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        Aucun lead B2B pour le moment
                      </div>
                    ) : (
                      leads.map(lead => (
                        <div key={lead.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {lead.organization_name}
                                </h3>
                                {getStatusBadge(lead.status!)}
                                {getUrgencyBadge(lead.urgency)}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {lead.organization_type} • {lead.sector}
                              </p>
                              <p className="text-sm font-medium text-[#0E2F56]">
                                Besoin : {lead.primary_need}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                              className="p-2 hover:bg-white rounded-lg transition"
                            >
                              <Eye className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>

                          {selectedLead?.id === lead.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">Contact:</span>
                                  <span>{lead.contact_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <a href={`mailto:${lead.contact_email}`} className="text-[#0E2F56] hover:underline">
                                    {lead.contact_email}
                                  </a>
                                </div>
                                {lead.contact_phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <a href={`tel:${lead.contact_phone}`} className="text-[#0E2F56] hover:underline">
                                      {lead.contact_phone}
                                    </a>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span>{new Date(lead.created_at!).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>

                              {lead.message && (
                                <div className="bg-white rounded-lg p-4">
                                  <div className="flex items-start gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <span className="text-sm font-medium text-gray-700">Message:</span>
                                  </div>
                                  <p className="text-sm text-gray-600 pl-6">{lead.message}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => updateLeadStatus(lead.id!, 'contacte')}
                                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                  Marquer contacté
                                </button>
                                <button
                                  onClick={() => updateLeadStatus(lead.id!, 'qualifie')}
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                  Marquer qualifié
                                </button>
                                <button
                                  onClick={() => updateLeadStatus(lead.id!, 'converti')}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                  Marquer converti
                                </button>
                                <button
                                  onClick={() => updateLeadStatus(lead.id!, 'perdu')}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                  Marquer perdu
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'config' && (
                  <div className="space-y-6">
                    {pageConfig.map(section => (
                      <div key={section.id} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">
                              {section.section_name}
                            </h3>
                            <button
                              onClick={() => toggleSectionVisibility(section.section_name, section.is_active)}
                              className="p-1 hover:bg-white rounded transition"
                            >
                              {section.is_active ? (
                                <ToggleRight className="w-6 h-6 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-gray-400" />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => setEditingSection(editingSection?.id === section.id ? null : section)}
                            className="p-2 hover:bg-white rounded-lg transition"
                          >
                            {editingSection?.id === section.id ? (
                              <X className="w-5 h-5 text-gray-600" />
                            ) : (
                              <Edit className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>

                        {editingSection?.id === section.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                              <input
                                type="text"
                                value={editingSection.title || ''}
                                onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                              <input
                                type="text"
                                value={editingSection.subtitle || ''}
                                onChange={e => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                              />
                            </div>
                            <button
                              onClick={saveSection}
                              className="px-6 py-2 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Enregistrer
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Titre:</span> {section.title}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Sous-titre:</span> {section.subtitle}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Ordre d'affichage:</span> {section.display_order}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-8">
                    {/* Meta Tags SEO */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Globe className="w-6 h-6 text-[#FF8C00]" />
                        <h3 className="text-xl font-bold text-gray-900">
                          Meta Tags SEO
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title (55-65 caractères optimal)
                          </label>
                          <input
                            type="text"
                            value={seoSettings.title}
                            onChange={e => setSeoSettings({ ...seoSettings, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                            maxLength={70}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Longueur actuelle : {seoSettings.title.length} caractères
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta Description (155-165 caractères optimal)
                          </label>
                          <textarea
                            value={seoSettings.description}
                            onChange={e => setSeoSettings({ ...seoSettings, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                            rows={3}
                            maxLength={200}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Longueur actuelle : {seoSettings.description.length} caractères
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Keywords SEO (séparés par des virgules)
                          </label>
                          <textarea
                            value={seoSettings.keywords}
                            onChange={e => setSeoSettings({ ...seoSettings, keywords: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                            rows={2}
                          />
                        </div>

                        <button
                          className="px-6 py-2 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Enregistrer les paramètres SEO
                        </button>
                      </div>
                    </div>

                    {/* Preview SEO */}
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                      <div className="flex items-center gap-3 mb-6">
                        <Eye className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">
                          Prévisualisation Google
                        </h3>
                      </div>

                      <div className="bg-white p-4 border border-gray-200 rounded-lg">
                        <div className="text-sm text-green-700 mb-1">
                          https://jobguinee.com › solutions-b2b
                        </div>
                        <div className="text-xl text-blue-600 hover:underline cursor-pointer mb-1 font-medium">
                          {seoSettings.title}
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {seoSettings.description}
                        </div>
                      </div>
                    </div>

                    {/* Info SEO */}
                    <div className="bg-blue-50 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Conseils SEO</h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>• Le title doit contenir les mots-clés principaux et être attractif</li>
                            <li>• La description doit inciter au clic tout en décrivant le contenu</li>
                            <li>• Utilisez des mots-clés pertinents pour le marché guinéen (Guinée, Conakry, etc.)</li>
                            <li>• Les schemas JSON-LD (Organization, Service, FAQPage) sont automatiquement ajoutés</li>
                            <li>• La page contient déjà 5 questions/réponses FAQ optimisées pour le SEO</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Schema.org Status */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          Schemas JSON-LD actifs
                        </h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700"><strong>Organization Schema</strong> - Informations sur JobGuinée</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700"><strong>Service Schema</strong> - Description des services B2B</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700"><strong>FAQPage Schema</strong> - 5 questions/réponses structurées</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
