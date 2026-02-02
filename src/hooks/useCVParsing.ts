import { useState, useCallback } from 'react';
import { cvUploadParserService, CVParseResult, ParsedCVData } from '../services/cvUploadParserService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export interface CVParsingState {
  isParsing: boolean;
  progress: number;
  result: CVParseResult | null;
  error: string | null;
  parsedData: ParsedCVData | null;
}

export function useCVParsing() {
  const { user } = useAuth();
  const [state, setState] = useState<CVParsingState>({
    isParsing: false,
    progress: 0,
    result: null,
    error: null,
    parsedData: null,
  });

  const parseCV = useCallback(async (file: File): Promise<boolean> => {
    try {
      // Vérifier que l'utilisateur est connecté
      if (!user?.id) {
        setState(prev => ({
          ...prev,
          error: 'Vous devez être connecté pour utiliser cette fonctionnalité',
        }));
        return false;
      }

      // Vérifier le solde de crédits AVANT de commencer
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setState(prev => ({
          ...prev,
          error: 'Impossible de vérifier votre solde de crédits',
        }));
        return false;
      }

      const requiredCredits = 10;
      if (profile.credits_balance < requiredCredits) {
        setState(prev => ({
          ...prev,
          error: `Crédits insuffisants. Vous avez ${profile.credits_balance} crédits, mais ${requiredCredits} sont nécessaires pour l'analyse de CV.`,
        }));
        return false;
      }

      // Vérifier que le fichier est valide
      if (!file) {
        setState(prev => ({
          ...prev,
          error: 'Aucun fichier sélectionné',
        }));
        return false;
      }

      // Vérifier la taille (10 MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setState(prev => ({
          ...prev,
          error: 'Le fichier est trop volumineux (max 10 MB)',
        }));
        return false;
      }

      // Vérifier le type de fichier
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
      ];
      const validExtensions = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

      if (!validTypes.includes(file.type) && !hasValidExtension) {
        setState(prev => ({
          ...prev,
          error: 'Format de fichier non supporté. Utilisez PDF, DOCX, JPG ou PNG.',
        }));
        return false;
      }

      // Démarrer le parsing
      setState({
        isParsing: true,
        progress: 10,
        result: null,
        error: null,
        parsedData: null,
      });

      // Phase 1: Extraction du texte (30%)
      setState(prev => ({ ...prev, progress: 30 }));

      // Phase 2: Parsing avec l'IA (70%)
      setState(prev => ({ ...prev, progress: 70 }));

      const result = await cvUploadParserService.parseCV(file);

      // Phase 3: Finalisation (100%)
      setState(prev => ({ ...prev, progress: 100 }));

      if (!result.success) {
        setState({
          isParsing: false,
          progress: 0,
          result,
          error: result.error || 'Erreur lors du parsing du CV',
          parsedData: null,
        });
        return false;
      }

      // Succès - 10 crédits IA ont été consommés
      setState({
        isParsing: false,
        progress: 100,
        result,
        error: null,
        parsedData: result.data || null,
      });

      return true;
    } catch (error) {
      console.error('Error in useCVParsing:', error);
      setState({
        isParsing: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue lors du parsing',
        parsedData: null,
      });
      return false;
    }
  }, [user?.id]);

  /**
   * Mapper les données parsées vers le format du formulaire
   */
  const mapToFormData = useCallback((parsedData: ParsedCVData, currentFormData: any = {}) => {
    return {
      ...currentFormData,
      // Identité
      fullName: parsedData.full_name || currentFormData.fullName || '',
      email: parsedData.email || currentFormData.email || '',
      phone: parsedData.phone || currentFormData.phone || '',
      address: parsedData.location || currentFormData.address || '',
      nationality: parsedData.nationality || currentFormData.nationality || '',

      // Professionnel
      currentPosition: parsedData.title || currentFormData.currentPosition || '',
      professionalSummary: parsedData.summary || currentFormData.professionalSummary || '',

      // Expériences - convertir au format attendu par le formulaire
      experiences: parsedData.experiences.length > 0
        ? parsedData.experiences.map(exp => ({
            'Poste occupé': exp.position,
            'Entreprise': exp.company,
            'Période': exp.period,
            'Missions principales': exp.missions.join('\n'),
          }))
        : currentFormData.experiences || [],

      // Formations
      formations: parsedData.education.length > 0
        ? parsedData.education.map(edu => ({
            'Diplôme obtenu': edu.degree,
            'Établissement': edu.institution,
            'Année d\'obtention': edu.year,
          }))
        : currentFormData.formations || [],

      // Compétences
      skills: parsedData.skills.length > 0
        ? parsedData.skills
        : currentFormData.skills || [],

      // Langues - convertir au format du formulaire
      languages: parsedData.languages.length > 0
        ? parsedData.languages.map(lang => lang.language)
        : currentFormData.languages || [],

      // Langues détaillées (pour stockage en DB)
      languagesDetailed: parsedData.languages.length > 0
        ? parsedData.languages
        : currentFormData.languagesDetailed || [],

      // Liens professionnels
      linkedinUrl: parsedData.linkedin_url || currentFormData.linkedinUrl || '',
      portfolioUrl: parsedData.portfolio_url || currentFormData.portfolioUrl || '',
      githubUrl: parsedData.github_url || currentFormData.githubUrl || '',

      // Données brutes pour référence
      cvParsedData: parsedData,
      cvParsedAt: new Date().toISOString(),
    };
  }, []);

  /**
   * Reset l'état
   */
  const reset = useCallback(() => {
    setState({
      isParsing: false,
      progress: 0,
      result: null,
      error: null,
      parsedData: null,
    });
  }, []);

  return {
    ...state,
    parseCV,
    mapToFormData,
    reset,
  };
}
