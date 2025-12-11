import { supabase } from '../lib/supabase';

export interface TrainerProfile {
  id: string;
  profile_id: string;
  user_id: string;
  entity_type: 'individual' | 'organization';
  bio?: string;
  specializations?: string[];
  website_url?: string;
  location?: string;
  is_verified: boolean;
  verification_documents?: string[];
  verification_notes?: string;
  verified_at?: string;

  // Individual fields
  full_name?: string;
  profession?: string;
  experience_years?: number;
  certifications?: any[];
  photo_url?: string;

  // Organization fields
  organization_name?: string;
  organization_type?: string;
  rccm?: string;
  agrement_number?: string;
  address?: string;
  domaines?: string[];
  logo_url?: string;
  contact_person?: string;
  contact_person_title?: string;

  // Stats
  total_students?: number;
  total_formations?: number;
  average_rating?: number;
  total_reviews?: number;

  created_at: string;
  updated_at: string;
}

export interface TrainerPromotion {
  id: string;
  trainer_id: string;
  formation_id: string;
  pack_type: 'boost_7j' | 'boost_15j' | 'boost_30j' | 'premium_month' | 'premium_org_annual';
  pack_name: string;
  price_amount: number;
  currency: string;
  payment_method: string;
  payment_reference?: string;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled';
  promotion_status: 'pending' | 'active' | 'expired' | 'cancelled';
  started_at?: string;
  expires_at?: string;
  views_count: number;
  clicks_count: number;
  enrollments_count: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

class TrainerService {
  async getTrainerProfile(userId: string): Promise<TrainerProfile | null> {
    const { data, error } = await supabase
      .from('trainer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createOrUpdateTrainerProfile(userId: string, profileId: string, data: Partial<TrainerProfile>): Promise<TrainerProfile> {
    const existing = await this.getTrainerProfile(userId);

    if (existing) {
      const { data: updated, error } = await supabase
        .from('trainer_profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } else {
      const { data: created, error } = await supabase
        .from('trainer_profiles')
        .insert({
          user_id: userId,
          profile_id: profileId,
          entity_type: data.entity_type || 'individual',
          ...data
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    }
  }

  async getTrainerPromotions(trainerId: string): Promise<TrainerPromotion[]> {
    const { data, error } = await supabase
      .from('trainer_promoted_posts')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createPromotion(promotion: Partial<TrainerPromotion>): Promise<TrainerPromotion> {
    const { data, error } = await supabase
      .from('trainer_promoted_posts')
      .insert(promotion)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getActivePromotedFormations(limit = 10) {
    const { data, error } = await supabase
      .from('formations')
      .select('*')
      .not('mise_en_avant_until', 'is', null)
      .gte('mise_en_avant_until', new Date().toISOString())
      .eq('status', 'active')
      .order('mise_en_avant_until', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  getPromotionPacks() {
    return [
      {
        code: 'boost_7j',
        name: 'Mise en avant 7 jours',
        price: 50000,
        duration_days: 7,
        features: ['Badge SPONSORISÉ', 'Position prioritaire', 'Statistiques']
      },
      {
        code: 'boost_15j',
        name: 'Mise en avant 15 jours',
        price: 90000,
        duration_days: 15,
        features: ['Badge SPONSORISÉ', 'Position prioritaire', 'Statistiques', 'Économie 10%']
      },
      {
        code: 'boost_30j',
        name: 'Mise en avant 30 jours',
        price: 150000,
        duration_days: 30,
        features: ['Badge SPONSORISÉ', 'Position prioritaire', 'Statistiques', 'Économie 25%']
      },
      {
        code: 'premium_month',
        name: 'Pack Premium Formateur',
        price: 250000,
        duration_days: 30,
        features: ['Badge PREMIUM', 'Publication illimitée', 'Stats avancées', 'Support prioritaire', 'Outils IA']
      },
      {
        code: 'premium_org_annual',
        name: 'Pack Premium Organisation',
        price: 2500000,
        duration_days: 365,
        features: ['Badge PREMIUM ORG', 'Publication illimitée', 'Multi-utilisateurs', 'Dashboard institutionnel', 'API', 'Gestionnaire dédié']
      }
    ];
  }
}

export const trainerService = new TrainerService();