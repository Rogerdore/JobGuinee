import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import { DollarSign, Star, Pin, Sparkles, Edit, Save, X } from 'lucide-react';

interface BasePricing {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
}

interface PremiumOption {
  id: string;
  feature_type: 'pinned' | 'featured' | 'both';
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
  is_active: boolean;
}

export default function JobPricingAdmin({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [basePricing, setBasePricing] = useState<BasePricing | null>(null);
  const [premiumOptions, setPremiumOptions] = useState<PremiumOption[]>([]);
  const [editingBase, setEditingBase] = useState(false);
  const [baseForm, setBaseForm] = useState({ price: 500000, duration_days: 30 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [base, premium] = await Promise.all([
      supabase.from('job_publication_base_pricing').select('*').eq('is_active', true).maybeSingle(),
      supabase.from('job_premium_pricing').select('*').order('display_order')
    ]);
    if (base.data) {
      setBasePricing(base.data);
      setBaseForm({ price: base.data.price, duration_days: base.data.duration_days });
    }
    setPremiumOptions(premium.data || []);
  };

  const saveBasePricing = async () => {
    if (!basePricing) return;
    await supabase.from('job_publication_base_pricing').update(baseForm).eq('id', basePricing.id);
    setEditingBase(false);
    loadData();
  };

  const togglePremium = async (id: string, active: boolean) => {
    await supabase.from('job_premium_pricing').update({ is_active: !active }).eq('id', id);
    loadData();
  };

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tarification des Publications</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="neo-clay rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                Publication Standard
              </h2>
              {!editingBase ? (
                <button onClick={() => setEditingBase(true)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                  <Edit className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveBasePricing} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                    <Save className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditingBase(false)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {editingBase ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix (GNF)</label>
                  <input
                    type="number"
                    value={baseForm.price}
                    onChange={e => setBaseForm({ ...baseForm, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durée (jours)</label>
                  <input
                    type="number"
                    value={baseForm.duration_days}
                    onChange={e => setBaseForm({ ...baseForm, duration_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">{basePricing?.description}</p>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {basePricing?.price.toLocaleString()} GNF
                </div>
                <div className="text-gray-600">Durée: {basePricing?.duration_days} jours</div>
              </div>
            )}
          </div>

          <div className="neo-clay rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Options Premium
            </h2>
            <div className="space-y-3">
              {premiumOptions.map(opt => (
                <div key={opt.id} className={`p-4 rounded-lg border-2 ${opt.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {opt.feature_type === 'pinned' && <Pin className="w-4 h-4 text-purple-600" />}
                        {opt.feature_type === 'featured' && <Star className="w-4 h-4 text-amber-600" />}
                        {opt.feature_type === 'both' && <Sparkles className="w-4 h-4 text-blue-600" />}
                        <span className="font-bold">{opt.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">{opt.price.toLocaleString()} GNF · {opt.duration_days}j</div>
                    </div>
                    <button
                      onClick={() => togglePremium(opt.id, opt.is_active)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${opt.is_active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}
                    >
                      {opt.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
