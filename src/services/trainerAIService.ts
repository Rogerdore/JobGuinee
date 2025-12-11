import { supabase } from '../lib/supabase';

class TrainerAIService {
  async generateFormationDescription(formationData: {
    title: string;
    category: string;
    level?: string;
    duration?: string;
  }): Promise<string> {
    // Simulé pour l'instant - À connecter avec l'API IA réelle
    const prompt = `Génère une description professionnelle et engageante pour cette formation :

Titre: ${formationData.title}
Catégorie: ${formationData.category}
Niveau: ${formationData.level || 'Non spécifié'}
Durée: ${formationData.duration || 'Non spécifiée'}

La description doit être claire, convaincante et mettre en valeur les bénéfices pour les participants.`;

    // TODO: Intégrer avec service_code: trainer_formation_description
    return `Formation professionnelle en ${formationData.category} de niveau ${formationData.level || 'adapté'}. Cette formation vous permettra de développer vos compétences et d'atteindre vos objectifs professionnels.`;
  }

  async optimizeProgram(program: string): Promise<string> {
    // TODO: Intégrer avec service_code: trainer_program_optimizer
    return program;
  }

  async recommendPrice(formationData: {
    title: string;
    category: string;
    duration?: string;
    level?: string;
  }): Promise<{
    recommended_price: number;
    min_price: number;
    max_price: number;
    reasoning: string;
  }> {
    // TODO: Intégrer avec service_code: trainer_price_recommender

    // Simulation basique
    let basePrice = 200000;

    if (formationData.level === 'expert') basePrice *= 1.5;
    if (formationData.level === 'intermediate') basePrice *= 1.2;

    return {
      recommended_price: basePrice,
      min_price: basePrice * 0.7,
      max_price: basePrice * 1.5,
      reasoning: 'Prix basé sur la catégorie, le niveau et la durée de la formation'
    };
  }

  async getVisibilityTips(formationId: string): Promise<string[]> {
    // TODO: Intégrer avec service_code: trainer_visibility_tips
    return [
      'Ajoutez une image attractive pour votre formation',
      'Optimisez votre titre avec des mots-clés pertinents',
      'Détaillez le programme de formation',
      'Ajoutez des témoignages d\'anciens participants',
      'Mettez à jour régulièrement le contenu'
    ];
  }

  async consumeAICredits(userId: string, serviceCode: string, creditsAmount: number) {
    const { error } = await supabase.rpc('use_ai_credits', {
      p_user_id: userId,
      p_service_code: serviceCode,
      p_credits_amount: creditsAmount
    });

    if (error) throw error;
  }
}

export const trainerAIService = new TrainerAIService();