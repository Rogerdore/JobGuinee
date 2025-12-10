import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Send, Loader, Bot, User, ArrowLeft, Coins } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import CreditBalance from '../credits/CreditBalance';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AICoachChatProps {
  onNavigate?: (page: string) => void;
}

export default function AICoachChat({ onNavigate }: AICoachChatProps = {}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Bonjour ! Je suis JobCoach IA, votre assistant personnel pour le développement de carrière. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { consumeCredits } = useConsumeCredits();

  const quickQuestions = [
    'Comment préparer un entretien d\'embauche ?',
    'Quelles compétences développer pour mon secteur ?',
    'Comment rédiger une lettre de motivation efficace ?',
    'Conseils pour négocier mon salaire',
    'Comment me reconvertir professionnellement ?',
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses: Record<string, string> = {
      'entretien': `Pour préparer un entretien d'embauche efficace :

1. **Recherche sur l'entreprise** : Étudiez son histoire, ses valeurs, ses produits/services
2. **Préparez vos réponses** aux questions classiques (points forts/faibles, motivations, parcours)
3. **Préparez vos questions** : Montrez votre intérêt pour le poste et l'entreprise
4. **Soignez votre présentation** : Tenue professionnelle, ponctualité
5. **Pratiquez** : Simulez l'entretien avec un ami ou devant un miroir
6. **Préparez des exemples concrets** de vos réalisations (méthode STAR)

Voulez-vous que je vous aide à préparer des réponses spécifiques ?`,

      'compétences': `Le développement des compétences est essentiel. Voici mes recommandations :

**Compétences techniques** :
- Identifiez les compétences clés de votre secteur
- Suivez des formations en ligne (Coursera, Udemy, LinkedIn Learning)
- Obtenez des certifications reconnues

**Compétences transversales** :
- Communication et travail d'équipe
- Résolution de problèmes
- Gestion du temps
- Leadership et management

**Conseil** : Concentrez-vous sur 2-3 compétences à la fois et pratiquez-les régulièrement.

Dans quel domaine souhaitez-vous vous perfectionner ?`,

      'lettre': `Pour une lettre de motivation percutante :

**Structure** :
1. **En-tête** : Vos coordonnées + celles de l'entreprise
2. **Objet** : Poste visé + référence de l'annonce
3. **Introduction** : Captez l'attention (votre intérêt pour le poste)
4. **Corps** :
   - Pourquoi vous ? (vos compétences/expériences)
   - Pourquoi cette entreprise ? (votre motivation)
5. **Conclusion** : Demande d'entretien + formule de politesse

**Conseils clés** :
- Personnalisez pour chaque offre
- Soyez concis (1 page max)
- Utilisez des exemples concrets
- Montrez votre valeur ajoutée

Je peux vous aider à rédiger votre lettre si vous le souhaitez !`,

      'salaire': `La négociation salariale est cruciale. Voici mes conseils :

**Avant l'entretien** :
- Renseignez-vous sur les salaires du marché pour votre poste
- Déterminez votre fourchette (minimum acceptable - objectif - idéal)
- Listez vos atouts et réalisations

**Pendant la négociation** :
- Laissez l'employeur proposer en premier si possible
- Justifiez votre demande avec des faits concrets
- Soyez confiant mais flexible
- Négociez aussi les avantages (télétravail, formation, primes)

**Phrases clés** :
- "D'après mes recherches et mon expérience, je viserais une rémunération entre X et Y"
- "Au-delà du salaire, quels autres avantages proposez-vous ?"

Quel est votre secteur d'activité pour des conseils plus précis ?`,

      'reconversion': `La reconversion professionnelle nécessite une préparation solide :

**Étape 1 : Bilan personnel**
- Identifiez vos motivations réelles
- Évaluez vos compétences transférables
- Définissez vos objectifs de carrière

**Étape 2 : Exploration**
- Recherchez les métiers qui vous intéressent
- Rencontrez des professionnels du secteur
- Testez via des stages ou missions courtes

**Étape 3 : Formation**
- Identifiez les compétences manquantes
- Suivez les formations nécessaires
- Obtenez des certifications si besoin

**Étape 4 : Transition**
- Adaptez votre CV et profil LinkedIn
- Réseautez dans votre nouveau secteur
- Soyez patient et persévérant

Vers quel domaine souhaitez-vous vous reconvertir ?`,
    };

    for (const [keyword, response] of Object.entries(responses)) {
      if (userMessage.toLowerCase().includes(keyword)) {
        return response;
      }
    }

    return `Merci pour votre question ! Voici quelques conseils généraux :

- **Soyez proactif** dans votre recherche d'emploi
- **Mettez à jour régulièrement** votre profil et CV
- **Réseautez** avec des professionnels de votre secteur
- **Continuez à apprendre** de nouvelles compétences
- **Restez positif** et persévérant

N'hésitez pas à me poser des questions plus spécifiques sur :
- La préparation d'entretiens
- Le développement de compétences
- La rédaction de CV/lettre de motivation
- La négociation salariale
- La reconversion professionnelle`;
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const creditResult = await consumeCredits(
        SERVICES.AI_INTERVIEW_COACHING,
        { message: text, sessionId },
        null
      );

      if (!creditResult.success) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `❌ ${creditResult.message}\n\nVeuillez recharger vos crédits pour continuer à utiliser JobCoach IA.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      await supabase.from('ai_chat_history').insert({
        user_id: user!.id,
        session_id: sessionId,
        message: text,
        message_type: 'user',
      });

      const aiResponse = await generateAIResponse(text);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      await supabase.from('ai_chat_history').insert({
        user_id: user!.id,
        session_id: sessionId,
        message: text,
        response: aiResponse,
        message_type: 'ai',
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {onNavigate && (
        <button
          onClick={() => onNavigate('premium-ai')}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour aux Services IA</span>
        </button>
      )}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">JobCoach IA</h1>
                <p className="text-blue-100">Votre assistant personnel pour le développement de carrière</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4" />
                <span>100 crédits/message</span>
              </div>
              <div className="mt-1">
                <CreditBalance variant="compact" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600 mb-3">Questions rapides :</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(question)}
                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}