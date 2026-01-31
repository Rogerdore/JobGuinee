import { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminTestEmail() {
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestEmail = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Veuillez entrer une adresse email' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Appeler la fonction send-email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to_email: testEmail,
          to_name: 'Test User',
          subject: 'Test Email - JobGuinée SMTP',
          html_body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Test Email - JobGuinée</h1>
              <p>Ceci est un email de test envoyé via le serveur SMTP Hostinger.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Configuration SMTP</h2>
                <ul style="list-style: none; padding: 0;">
                  <li>✅ Host: smtp.hostinger.com</li>
                  <li>✅ Port: 465 (SSL)</li>
                  <li>✅ From: contact@jobguinee-pro.com</li>
                </ul>
              </div>
              <p>Si vous recevez cet email, votre configuration SMTP fonctionne parfaitement !</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">
                JobGuinée - Plateforme d'emploi en Guinée<br>
                <a href="https://jobguinee-pro.com">jobguinee-pro.com</a>
              </p>
            </div>
          `,
          text_body: 'Test Email - JobGuinée SMTP\n\nCeci est un email de test envoyé via le serveur SMTP Hostinger.\n\nSi vous recevez cet email, votre configuration SMTP fonctionne parfaitement !'
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        setResult({
          success: false,
          message: `Erreur: ${error.message}`
        });
      } else if (data?.success) {
        setResult({
          success: true,
          message: `Email envoyé avec succès à ${testEmail} ! Vérifiez votre boîte de réception (et spam).`
        });
      } else {
        setResult({
          success: false,
          message: data?.error || 'Erreur inconnue lors de l\'envoi'
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      setResult({
        success: false,
        message: `Erreur: ${error.message}`
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Email SMTP</h1>
              <p className="text-gray-600">Testez votre configuration SMTP Hostinger</p>
            </div>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Configuration Actuelle</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Serveur SMTP:</span>
              <span className="ml-2 text-blue-900">smtp.hostinger.com</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Port:</span>
              <span className="ml-2 text-blue-900">465 (SSL)</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Email:</span>
              <span className="ml-2 text-blue-900">contact@jobguinee-pro.com</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Nom:</span>
              <span className="ml-2 text-blue-900">JobGuinée Pro</span>
            </div>
          </div>
        </div>

        {/* Test Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Envoyer un Email de Test</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse Email de Test
              </label>
              <input
                type="email"
                id="testEmail"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={sending}
              />
              <p className="mt-2 text-sm text-gray-500">
                L'email sera envoyé à cette adresse pour tester la configuration SMTP
              </p>
            </div>

            <button
              onClick={sendTestEmail}
              disabled={sending || !testEmail}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Envoyer l'Email de Test</span>
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3
                    className={`font-semibold mb-1 ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.success ? 'Succès !' : 'Erreur'}
                  </h3>
                  <p
                    className={`text-sm ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600">1.</span>
              <p>Entrez votre adresse email dans le champ ci-dessus</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600">2.</span>
              <p>Cliquez sur "Envoyer l'Email de Test"</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600">3.</span>
              <p>Vérifiez votre boîte de réception (et spam) dans 1-2 minutes</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600">4.</span>
              <p>Si vous ne recevez pas l'email, vérifiez :</p>
            </div>
            <ul className="ml-8 list-disc space-y-1 text-gray-600">
              <li>Le dossier spam/courrier indésirable</li>
              <li>Que le mot de passe SMTP est correct</li>
              <li>Les logs d'erreur dans le message ci-dessus</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
