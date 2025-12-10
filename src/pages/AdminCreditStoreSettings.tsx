import { useState, useEffect } from 'react';
import { Settings, Save, Phone, MessageCircle, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { CreditStoreService, CreditStoreSettings } from '../services/creditStoreService';

export default function AdminCreditStoreSettings() {
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    admin_phone_number: '',
    admin_whatsapp_number: '',
    payment_instructions: '',
    is_enabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await CreditStoreService.getSettings();

      if (data) {
        setSettings(data);
        setFormData({
          admin_phone_number: data.admin_phone_number,
          admin_whatsapp_number: data.admin_whatsapp_number,
          payment_instructions: data.payment_instructions,
          is_enabled: data.is_enabled
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await CreditStoreService.updateSettings(formData);

      if (success) {
        alert('Paramètres sauvegardés avec succès!');
        await loadSettings();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Configuration Boutique</h1>
                <p className="text-orange-100">Gérer les paramètres de la boutique de crédits</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Ces paramètres contrôlent le fonctionnement de la boutique de crédits.
                Assurez-vous que les numéros Orange Money et WhatsApp sont corrects avant d'activer la boutique.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-14 h-8 rounded-full transition ${
                    formData.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      formData.is_enabled ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Boutique active</div>
                  <div className="text-sm text-gray-600">
                    {formData.is_enabled ? 'Les utilisateurs peuvent acheter des crédits' : 'La boutique est fermée'}
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className="block mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Phone className="w-5 h-5 text-orange-600" />
                  Numéro Orange Money
                </div>
                <input
                  type="text"
                  value={formData.admin_phone_number}
                  onChange={(e) => setFormData({ ...formData, admin_phone_number: e.target.value })}
                  placeholder="622000000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Le numéro vers lequel les utilisateurs enverront leur paiement Orange Money
              </p>
            </div>

            <div>
              <label className="block mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Numéro WhatsApp
                </div>
                <input
                  type="text"
                  value={formData.admin_whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, admin_whatsapp_number: e.target.value })}
                  placeholder="622000000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Le numéro WhatsApp où les utilisateurs enverront la preuve de paiement
              </p>
            </div>

            <div>
              <label className="block mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Instructions de paiement
                </div>
                <textarea
                  value={formData.payment_instructions}
                  onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                  placeholder="Effectuez le transfert Orange Money vers le numéro indiqué..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Message affiché aux utilisateurs dans la modal de paiement
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sauvegarder les paramètres
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Aperçu</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">État boutique</div>
              <div className={`text-lg font-bold ${formData.is_enabled ? 'text-green-600' : 'text-red-600'}`}>
                {formData.is_enabled ? 'Active' : 'Désactivée'}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <div className="text-sm text-orange-600 mb-1">Orange Money</div>
              <div className="text-2xl font-bold text-orange-700">{formData.admin_phone_number}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="text-sm text-green-600 mb-1">WhatsApp</div>
              <div className="text-2xl font-bold text-green-700">{formData.admin_whatsapp_number}</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="text-sm text-blue-600 mb-2 font-semibold">Instructions</div>
              <div className="text-sm text-blue-900 whitespace-pre-wrap">{formData.payment_instructions}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
