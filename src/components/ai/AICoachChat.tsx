import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { callAIService } from '../../utils/aiService';
import { MessageCircle, Send, Loader, Bot, User, ArrowLeft } from 'lucide-react';

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
    try {
      // Récupérer l'historique de la conversation pour le contexte
      const conversationHistory = messages
        .slice(-5) // Derniers 5 messages pour le contexte
        .map(m => `${m.type === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const prompt = `Tu es JobCoach IA, un expert en développement de carrière et coach professionnel spécialisé dans le marché de l'emploi guinéen.

Ton rôle : Aider les candidats dans leur recherche d'emploi, développement de carrière, et orientation professionnelle.

Tes domaines d'expertise :
- Préparation aux entretiens d'embauche
- Rédaction de CV et lettres de motivation
- Développement des compétences professionnelles
- Négociation salariale
- Reconversion professionnelle
- Orientation de carrière
- Stratégies de recherche d'emploi

Ton style :
- Bienveillant et encourageant
- Concret et actionnable
- Structuré et organisé
- Adapté au contexte guinéen

Historique de la conversation :
${conversationHistory}

Question de l'utilisateur : ${userMessage}

Réponds de manière détaillée, structurée (utilise des listes, des sections, des exemples concrets) et personnalisée. Garde un ton professionnel mais chaleureux.`;

      const aiResponse = await callAIService({
        service_type: 'matching',
        prompt: prompt,
        context: {
          user_message: userMessage,
          conversation_history: conversationHistory,
          session_id: sessionId
        },
        temperature: 0.8,
        max_tokens: 1000
      });

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'Erreur lors de l\'appel à l\'API IA');
      }

      return aiResponse.data.content;
    } catch (error) {
      console.error('Erreur génération réponse IA:', error);
      return `Je suis désolé, je rencontre une difficulté technique. Voici quelques conseils généraux :

- **Soyez proactif** dans votre recherche d'emploi
- **Mettez à jour régulièrement** votre profil et CV
- **Réseautez** avec des professionnels de votre secteur
- **Continuez à apprendre** de nouvelles compétences
- **Restez positif** et persévérant

N'hésitez pas à reformuler votre question ou à poser une question différente.`;
    }
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">JobCoach IA</h1>
              <p className="text-blue-100">Votre assistant personnel pour le développement de carrière</p>
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