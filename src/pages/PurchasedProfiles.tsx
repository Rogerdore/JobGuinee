import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Download,
  FileText,
  Package,
  Calendar,
  CheckCircle2,
  Eye,
  Filter,
  Search,
  FileSpreadsheet,
  X,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import jsPDF from 'jspdf';

interface PurchasedProfile {
  id: string;
  candidate_id: string;
  purchased_at: string;
  amount: number;
  payment_method: string;
  candidate: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    city: string;
    country: string;
    title: string;
    bio: string;
    experience_years: number;
    skills: string[];
    education: any[];
    experience: any[];
    languages: any[];
    certifications: string[];
    linkedin_url: string;
    portfolio_url: string;
    desired_position: string;
    desired_salary: number;
    salary_currency: string;
    cv_url: string;
    cover_letter_url: string;
    is_verified: boolean;
    ai_score: number;
  };
}

interface PurchasedProfilesProps {
  profile: any;
}

type SortField = 'name' | 'date' | 'experience' | 'score' | 'salary' | 'city';
type SortDirection = 'asc' | 'desc';

export default function PurchasedProfiles({ profile }: PurchasedProfilesProps) {
  const [purchases, setPurchases] = useState<PurchasedProfile[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchasedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<PurchasedProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    loadPurchasedProfiles();
  }, [profile?.id]);

  useEffect(() => {
    filterAndSortProfiles();
  }, [searchTerm, purchases, sortField, sortDirection]);

  const loadPurchasedProfiles = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profile_purchases')
        .select(`
          id,
          candidate_id,
          purchased_at,
          amount,
          payment_method,
          candidate:candidate_profiles!profile_purchases_candidate_id_fkey (
            id,
            user_id,
            full_name,
            email,
            phone,
            date_of_birth,
            city,
            country,
            title,
            bio,
            experience_years,
            skills,
            education,
            experience,
            languages,
            certifications,
            linkedin_url,
            portfolio_url,
            desired_position,
            desired_salary,
            salary_currency,
            cv_url,
            cover_letter_url,
            is_verified,
            ai_score
          )
        `)
        .eq('buyer_id', profile.id)
        .eq('payment_status', 'completed')
        .eq('payment_verified_by_admin', true)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        candidate: Array.isArray(item.candidate) ? item.candidate[0] : item.candidate
      }));

      setPurchases(formattedData);
      setFilteredPurchases(formattedData);
    } catch (error) {
      console.error('Error loading purchased profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProfiles = () => {
    let filtered = purchases;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = purchases.filter(p =>
        p.candidate?.full_name?.toLowerCase().includes(term) ||
        p.candidate?.title?.toLowerCase().includes(term) ||
        p.candidate?.city?.toLowerCase().includes(term) ||
        p.candidate?.skills?.some(skill => skill.toLowerCase().includes(term))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.candidate?.full_name || '';
          bValue = b.candidate?.full_name || '';
          break;
        case 'date':
          aValue = new Date(a.purchased_at).getTime();
          bValue = new Date(b.purchased_at).getTime();
          break;
        case 'experience':
          aValue = a.candidate?.experience_years || 0;
          bValue = b.candidate?.experience_years || 0;
          break;
        case 'score':
          aValue = a.candidate?.ai_score || 0;
          bValue = b.candidate?.ai_score || 0;
          break;
        case 'salary':
          aValue = a.candidate?.desired_salary || 0;
          bValue = b.candidate?.desired_salary || 0;
          break;
        case 'city':
          aValue = a.candidate?.city || '';
          bValue = b.candidate?.city || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    setFilteredPurchases(sorted);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setShowSortMenu(false);
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    } else {
      return <ArrowDown className="w-4 h-4" />;
    }
  };

  const getSortLabel = (field: SortField) => {
    const labels: Record<SortField, string> = {
      name: 'Nom',
      date: 'Date d\'achat',
      experience: 'Expérience',
      score: 'Score IA',
      salary: 'Salaire souhaité',
      city: 'Ville'
    };
    return labels[field];
  };

  const exportToCSV = () => {
    const headers = [
      'Nom Complet',
      'Email',
      'Téléphone',
      'Poste',
      'Ville',
      'Pays',
      'Années d\'expérience',
      'Compétences',
      'Salaire souhaité',
      'Date d\'achat',
      'Montant payé',
      'LinkedIn',
      'Portfolio'
    ];

    const rows = filteredPurchases.map(p => [
      p.candidate?.full_name || '',
      p.candidate?.email || '',
      p.candidate?.phone || '',
      p.candidate?.title || '',
      p.candidate?.city || '',
      p.candidate?.country || '',
      p.candidate?.experience_years || 0,
      (p.candidate?.skills || []).join('; '),
      `${p.candidate?.desired_salary || 0} ${p.candidate?.salary_currency || 'GNF'}`,
      new Date(p.purchased_at).toLocaleDateString('fr-FR'),
      `${p.amount.toLocaleString()} GNF`,
      p.candidate?.linkedin_url || '',
      p.candidate?.portfolio_url || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profils_achetes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const headers = [
      'Nom Complet',
      'Email',
      'Téléphone',
      'Poste',
      'Ville',
      'Pays',
      'Expérience',
      'Compétences',
      'Salaire',
      'Date Achat',
      'Montant'
    ];

    const rows = filteredPurchases.map(p => [
      p.candidate?.full_name || '',
      p.candidate?.email || '',
      p.candidate?.phone || '',
      p.candidate?.title || '',
      p.candidate?.city || '',
      p.candidate?.country || '',
      `${p.candidate?.experience_years || 0} ans`,
      (p.candidate?.skills || []).slice(0, 5).join(', '),
      `${p.candidate?.desired_salary || 0} ${p.candidate?.salary_currency || 'GNF'}`,
      new Date(p.purchased_at).toLocaleDateString('fr-FR'),
      `${p.amount.toLocaleString()} GNF`
    ]);

    let html = '<table border="1" cellpadding="5" cellspacing="0">';
    html += '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + rows.map(row =>
      '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>'
    ).join('') + '</tbody>';
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profils_achetes_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    doc.setFontSize(18);
    doc.text('Profils Achetés - CVThèque', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Total: ${filteredPurchases.length} profils`, pageWidth / 2, yPos + 5, { align: 'center' });
    yPos += 15;

    filteredPurchases.forEach((purchase, index) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${purchase.candidate?.full_name || 'N/A'}`, 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Poste: ${purchase.candidate?.title || 'N/A'}`, 20, yPos);
      yPos += 5;
      doc.text(`Email: ${purchase.candidate?.email || 'N/A'}`, 20, yPos);
      yPos += 5;
      doc.text(`Téléphone: ${purchase.candidate?.phone || 'N/A'}`, 20, yPos);
      yPos += 5;
      doc.text(`Localisation: ${purchase.candidate?.city || 'N/A'}, ${purchase.candidate?.country || 'N/A'}`, 20, yPos);
      yPos += 5;
      doc.text(`Expérience: ${purchase.candidate?.experience_years || 0} ans`, 20, yPos);
      yPos += 5;

      if (purchase.candidate?.skills && purchase.candidate.skills.length > 0) {
        doc.text(`Compétences: ${purchase.candidate.skills.slice(0, 5).join(', ')}`, 20, yPos);
        yPos += 5;
      }

      doc.text(`Acheté le: ${new Date(purchase.purchased_at).toLocaleDateString('fr-FR')}`, 20, yPos);
      yPos += 5;
      doc.text(`Montant: ${purchase.amount.toLocaleString()} GNF`, 20, yPos);
      yPos += 10;
    });

    doc.save(`profils_achetes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadDocumentsAsZip = async () => {
    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let downloadedCount = 0;

      for (const purchase of filteredPurchases) {
        const candidateName = purchase.candidate?.full_name?.replace(/[^a-z0-9]/gi, '_') || `candidate_${purchase.candidate_id}`;

        if (purchase.candidate?.cv_url) {
          try {
            const { data } = await supabase.storage
              .from('candidate-documents')
              .download(purchase.candidate.cv_url);

            if (data) {
              zip.file(`${candidateName}_CV.pdf`, data);
              downloadedCount++;
            }
          } catch (error) {
            console.error(`Error downloading CV for ${candidateName}:`, error);
          }
        }

        if (purchase.candidate?.cover_letter_url) {
          try {
            const { data } = await supabase.storage
              .from('candidate-documents')
              .download(purchase.candidate.cover_letter_url);

            if (data) {
              zip.file(`${candidateName}_Lettre_Motivation.pdf`, data);
              downloadedCount++;
            }
          } catch (error) {
            console.error(`Error downloading cover letter for ${candidateName}:`, error);
          }
        }
      }

      if (downloadedCount > 0) {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `documents_profils_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
      }
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Erreur lors de la création du fichier ZIP');
    } finally {
      setDownloading(false);
    }
  };

  const viewProfileDetails = (purchase: PurchasedProfile) => {
    setSelectedProfile(purchase);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-900" />
              Mes Profils Achetés
            </h1>
            <p className="text-gray-600 mt-2">
              Accès complet aux profils et documents des candidats
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">Total de profils</p>
              <p className="text-2xl font-bold text-blue-900">{filteredPurchases.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, poste, ville ou compétences..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap"
                >
                  <ArrowUpDown className="w-5 h-5" />
                  Trier: {getSortLabel(sortField)}
                  {getSortIcon()}
                </button>

                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">
                        Trier par
                      </div>
                      <button
                        onClick={() => handleSort('date')}
                        className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition flex items-center justify-between ${
                          sortField === 'date' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date d'achat
                        </span>
                        {sortField === 'date' && getSortIcon()}
                      </button>
                      <button
                        onClick={() => handleSort('name')}
                        className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition flex items-center justify-between ${
                          sortField === 'name' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          Nom
                        </span>
                        {sortField === 'name' && getSortIcon()}
                      </button>
                      <button
                        onClick={() => handleSort('score')}
                        className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition flex items-center justify-between ${
                          sortField === 'score' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Score IA
                        </span>
                        {sortField === 'score' && getSortIcon()}
                      </button>
                      <button
                        onClick={() => handleSort('experience')}
                        className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition flex items-center justify-between ${
                          sortField === 'experience' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Expérience
                        </span>
                        {sortField === 'experience' && getSortIcon()}
                      </button>
                      <button
                        onClick={() => handleSort('salary')}
                        className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition flex items-center justify-between ${
                          sortField === 'salary' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Salaire souhaité
                        </span>
                        {sortField === 'salary' && getSortIcon()}
                      </button>
                      <button
                        onClick={() => handleSort('city')}
                        className={`w-full px-3 py-2 text-left rounded hover:bg-gray-50 transition flex items-center justify-between ${
                          sortField === 'city' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Ville
                        </span>
                        {sortField === 'city' && getSortIcon()}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={exportToCSV}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5" />
                CSV
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition flex items-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                PDF
              </button>
              <button
                onClick={downloadDocumentsAsZip}
                disabled={downloading}
                className="px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {downloading ? 'Téléchargement...' : 'Documents ZIP'}
              </button>
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'Aucun profil trouvé avec ces critères' : 'Aucun profil acheté pour le moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg border border-blue-100 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {purchase.candidate?.full_name || 'Profil sans nom'}
                        </h3>
                        {purchase.candidate?.is_verified && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          Score: {purchase.candidate?.ai_score || 0}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Briefcase className="w-4 h-4 text-blue-900" />
                          <span className="font-medium">{purchase.candidate?.title || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-blue-900" />
                          <span>{purchase.candidate?.experience_years || 0} ans d'expérience</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-blue-900" />
                          <span>{purchase.candidate?.city}, {purchase.candidate?.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-blue-900" />
                          <span className="truncate">{purchase.candidate?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-blue-900" />
                          <span>{purchase.candidate?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-blue-900" />
                          <span>Acheté le {new Date(purchase.purchased_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {purchase.candidate?.skills && purchase.candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {purchase.candidate.skills.slice(0, 8).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-white border border-blue-200 text-blue-900 text-sm rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {purchase.candidate.skills.length > 8 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                              +{purchase.candidate.skills.length - 8} autres
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">Montant payé:</span>
                        <span className="text-green-600 font-bold">{purchase.amount.toLocaleString()} GNF</span>
                        <span className="text-gray-400">•</span>
                        <span className="capitalize">{purchase.payment_method.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => viewProfileDetails(purchase)}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition flex items-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      Voir Détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {selectedProfile.candidate?.full_name}
                  {selectedProfile.candidate?.is_verified && (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  )}
                </h2>
                <p className="text-blue-100">{selectedProfile.candidate?.title}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-blue-800 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-900" />
                      Informations de Contact
                    </h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <p><span className="font-medium">Email:</span> {selectedProfile.candidate?.email}</p>
                      <p><span className="font-medium">Téléphone:</span> {selectedProfile.candidate?.phone || 'N/A'}</p>
                      <p><span className="font-medium">Localisation:</span> {selectedProfile.candidate?.city}, {selectedProfile.candidate?.country}</p>
                      {selectedProfile.candidate?.linkedin_url && (
                        <p><span className="font-medium">LinkedIn:</span> <a href={selectedProfile.candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Voir profil</a></p>
                      )}
                      {selectedProfile.candidate?.portfolio_url && (
                        <p><span className="font-medium">Portfolio:</span> <a href={selectedProfile.candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Voir portfolio</a></p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-900" />
                      Informations Professionnelles
                    </h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <p><span className="font-medium">Expérience:</span> {selectedProfile.candidate?.experience_years || 0} ans</p>
                      <p><span className="font-medium">Poste souhaité:</span> {selectedProfile.candidate?.desired_position || 'N/A'}</p>
                      <p><span className="font-medium">Salaire souhaité:</span> {selectedProfile.candidate?.desired_salary?.toLocaleString() || 'N/A'} {selectedProfile.candidate?.salary_currency || 'GNF'}</p>
                      <p><span className="font-medium">Score IA:</span> {selectedProfile.candidate?.ai_score || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-900" />
                      Compétences
                    </h3>
                    <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-lg">
                      {selectedProfile.candidate?.skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-900 text-sm rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      )) || <p className="text-gray-500">Aucune compétence renseignée</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-900" />
                      Documents
                    </h3>
                    <div className="space-y-2">
                      {selectedProfile.candidate?.cv_url && (
                        <a
                          href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/candidate-documents/${selectedProfile.candidate.cv_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Download className="w-5 h-5 text-blue-900" />
                          <span className="font-medium text-blue-900">Télécharger le CV</span>
                        </a>
                      )}
                      {selectedProfile.candidate?.cover_letter_url && (
                        <a
                          href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/candidate-documents/${selectedProfile.candidate.cover_letter_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition"
                        >
                          <Download className="w-5 h-5 text-green-700" />
                          <span className="font-medium text-green-700">Télécharger la Lettre de Motivation</span>
                        </a>
                      )}
                      {!selectedProfile.candidate?.cv_url && !selectedProfile.candidate?.cover_letter_url && (
                        <p className="text-gray-500 text-center py-4">Aucun document disponible</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedProfile.candidate?.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Biographie</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                    {selectedProfile.candidate.bio}
                  </p>
                </div>
              )}

              {selectedProfile.candidate?.experience && selectedProfile.candidate.experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Expériences Professionnelles</h3>
                  <div className="space-y-3">
                    {selectedProfile.candidate.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-900">{exp.title || exp.position}</p>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">{exp.period || `${exp.start_date} - ${exp.end_date || 'Présent'}`}</p>
                        {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfile.candidate?.education && selectedProfile.candidate.education.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Formation</h3>
                  <div className="space-y-3">
                    {selectedProfile.candidate.education.map((edu: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-900">{edu.degree || edu.diploma}</p>
                        <p className="text-gray-600">{edu.institution || edu.school}</p>
                        <p className="text-sm text-gray-500">{edu.year || edu.period}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfile.candidate?.languages && selectedProfile.candidate.languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Langues</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProfile.candidate.languages.map((lang: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 px-4 py-2 rounded-lg">
                        <span className="font-medium text-gray-900">{lang.language || lang.name}</span>
                        {lang.level && <span className="text-gray-600 ml-2">- {lang.level}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
