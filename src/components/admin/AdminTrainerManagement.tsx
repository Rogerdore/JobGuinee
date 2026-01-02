import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, MapPin, Phone, Mail, Filter, Eye, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Trainer {
  id: string;
  user_id: string;
  entity_type: 'individual' | 'organization';
  full_name?: string;
  organization_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  is_verified: boolean;
  total_formations?: number;
  total_students?: number;
  created_at: string;
}

export default function AdminTrainerManagement() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'individual' | 'organization'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadTrainers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trainers, searchTerm, entityTypeFilter, verificationFilter]);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const { data: trainersData, error: trainersError } = await supabase
        .from('trainer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (trainersError) throw trainersError;

      if (trainersData) {
        const userIds = trainersData.map(t => t.user_id);
        const { data: authData } = await supabase
          .from('profiles')
          .select('id, email, phone')
          .in('id', userIds);

        const enrichedTrainers = trainersData.map(trainer => {
          const auth = authData?.find(a => a.id === trainer.user_id);
          return {
            ...trainer,
            email: auth?.email,
            phone: auth?.phone
          };
        });

        setTrainers(enrichedTrainers);
      }
    } catch (error) {
      console.error('Error loading trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trainers];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.entity_type === entityTypeFilter);
    }

    if (verificationFilter === 'verified') {
      filtered = filtered.filter(t => t.is_verified);
    } else if (verificationFilter === 'unverified') {
      filtered = filtered.filter(t => !t.is_verified);
    }

    setFilteredTrainers(filtered);
  };

  const handleVerifyTrainer = async (trainerId: string, verify: boolean) => {
    try {
      const { error } = await supabase
        .from('trainer_profiles')
        .update({ is_verified: verify })
        .eq('id', trainerId);

      if (error) throw error;

      alert(verify ? 'Formateur vérifié avec succès' : 'Vérification retirée');
      loadTrainers();
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const stats = {
    total: trainers.length,
    verified: trainers.filter(t => t.is_verified).length,
    pending: trainers.filter(t => !t.is_verified).length,
    totalStudents: trainers.reduce((sum, t) => sum + (t.total_students || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Liste des Formateurs</h2>
        <p className="mt-2 text-gray-600">Vue d'ensemble et gestion des formateurs inscrits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vérifiés</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <XCircle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Étudiants</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalStudents}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un formateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="individual">Individuels</option>
              <option value="organization">Organisations</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="verified">Vérifiés</option>
              <option value="unverified">Non vérifiés</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {trainer.entity_type === 'individual' ? trainer.full_name : trainer.organization_name}
                        </p>
                        {trainer.is_verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <Shield className="w-3 h-3" />
                            Vérifié
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trainer.entity_type === 'individual'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {trainer.entity_type === 'individual' ? 'Individuel' : 'Organisation'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="space-y-1">
                      {trainer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {trainer.email}
                        </div>
                      )}
                      {trainer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {trainer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {trainer.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trainer.location}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {trainer.total_formations || 0} formations
                      </div>
                      <div className="text-gray-500">
                        {trainer.total_students || 0} étudiants
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trainer.is_verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trainer.is_verified ? 'Vérifié' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedTrainer(trainer);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!trainer.is_verified ? (
                        <button
                          onClick={() => handleVerifyTrainer(trainer.id, true)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Vérifier
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyTrainer(trainer.id, false)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrainers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun formateur trouvé</p>
          </div>
        )}
      </div>

      {showDetailModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Détails du formateur
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <p className="mt-1 text-gray-900">
                  {selectedTrainer.entity_type === 'individual'
                    ? selectedTrainer.full_name
                    : selectedTrainer.organization_name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedTrainer.entity_type === 'individual'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedTrainer.entity_type === 'individual' ? 'Individuel' : 'Organisation'}
                  </span>
                </p>
              </div>

              {selectedTrainer.email && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{selectedTrainer.email}</p>
                </div>
              )}

              {selectedTrainer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="mt-1 text-gray-900">{selectedTrainer.phone}</p>
                </div>
              )}

              {selectedTrainer.location && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Localisation</label>
                  <p className="mt-1 text-gray-900">{selectedTrainer.location}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Statistiques</label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Formations</p>
                    <p className="text-lg font-bold text-blue-600">{selectedTrainer.total_formations || 0}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Étudiants</p>
                    <p className="text-lg font-bold text-green-600">{selectedTrainer.total_students || 0}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Statut de vérification</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedTrainer.is_verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedTrainer.is_verified ? 'Vérifié' : 'En attente de vérification'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Date d'inscription</label>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedTrainer.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {!selectedTrainer.is_verified ? (
                <button
                  onClick={() => {
                    handleVerifyTrainer(selectedTrainer.id, true);
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Vérifier
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleVerifyTrainer(selectedTrainer.id, false);
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Retirer la vérification
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTrainer(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
