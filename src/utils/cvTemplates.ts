export const CV_TEMPLATES = {
  modern: {
    name: 'Moderne',
    description: 'Épuré, minimaliste, idéal pour postes RH, management, consultant, corporate',
    structure: `
NOM & PRÉNOMS
Titre du poste | Spécialisation
Téléphone | Email | LinkedIn | Adresse

PROFIL PROFESSIONNEL
[Résumé professionnel de 4-5 lignes mettant en avant l'expertise, les résultats clés et la valeur ajoutée]

COMPÉTENCES CLÉS
• [Compétence 1]
• [Compétence 2]
• [Compétence 3]
• Outils : [Liste des outils maîtrisés]

EXPÉRIENCES PROFESSIONNELLES
[Poste] – [Entreprise] | [Ville] | [Dates]
• [Réalisation/Responsabilité 1]
• [Réalisation/Responsabilité 2]
• [Résultat chiffré si possible]

FORMATION
[Diplôme] – [Établissement] – [Année]
[Certificat / Spécialisation]

LANGUES
[Langue] : [Niveau]

CENTRES D'INTÉRÊT
[Intérêt 1] | [Intérêt 2]
`,
  },

  classic: {
    name: 'Classique',
    description: 'Structuré, sobre, idéal pour candidatures administratives, institutionnelles, ONG',
    structure: `
NOM PRÉNOMS
Adresse – Téléphone – Email – Nationalité

1. INFORMATIONS PERSONNELLES
Date et lieu de naissance : [À compléter]
Situation familiale : [Optionnel]

2. PROFIL PERSONNEL
[Résumé de 5 lignes sur les compétences générales]

3. EXPÉRIENCES PROFESSIONNELLES
[Poste] – [Entreprise] | [Dates]
• Tâche principale 1
• Tâche principale 2
• Tâche principale 3

4. FORMATION
[Diplôme] – [Établissement] – [Dates]
[Autres formations – Certifications]

5. COMPÉTENCES
Compétences techniques : [Liste]
Compétences relationnelles : [Liste]
Outils maîtrisés : [Liste]

6. CENTRES D'INTÉRÊT
[Centres d'intérêt]
`,
  },

  professional: {
    name: 'Professionnel',
    description: 'Axé résultats, idéal pour postes de cadre, managers, experts',
    structure: `
NOM PRÉNOMS
Titre professionnel
Téléphone | Email | LinkedIn

RÉSUMÉ EXÉCUTIF
[3-4 lignes orientées résultats et leadership]

DOMAINES DE COMPÉTENCES
• [Domaine 1]
• [Domaine 2]
• [Domaine 3]
• [Domaine 4]

RÉALISATIONS CLÉS
• [Réalisation 1 avec impact mesuré]
• [Réalisation 2 avec impact mesuré]
• [Réalisation 3 avec impact mesuré]

EXPÉRIENCE PROFESSIONNELLE
[Poste] – [Organisation] – [Dates]
• [Réalisation 1]
• [Réalisation 2]
• [Impact mesuré]

FORMATION & CERTIFICATIONS
[Diplôme] – [Établissement]
[Certifications professionnelles]
[Formations techniques]

LANGUES & OUTILS
Langues : [Liste avec niveaux]
Outils : [Liste des outils techniques]
`,
  },

  creative: {
    name: 'Créatif',
    description: 'Visuel, idéal pour communication, formateurs, coaching, consultants',
    structure: `
NOM PRÉNOMS
[Titre] – [Spécialité] – [Slogan professionnel]

🔹 À PROPOS
[Court texte inspirant et synthétique]

🔹 COMPÉTENCES & EXPERTISES
• [Expertise 1]
• [Expertise 2]
• [Expertise 3]
• [Expertise 4]

🔹 PARCOURS PROFESSIONNEL
[Entreprise] | [Poste] | [Dates]
• Action 1
• Action 2
• Résultat / impact

🔹 FORMATIONS
[Diplôme] – [Année]
[Certificat / MOOC]

🔹 OUTILS NUMÉRIQUES
[Outil 1] | [Outil 2] | [Outil 3]

🔹 CENTRES D'INTÉRÊT
[Centres d'intérêt avec description]
`,
  },
};

export function getCVTemplatePrompt(style: string): string {
  const template = CV_TEMPLATES[style as keyof typeof CV_TEMPLATES] || CV_TEMPLATES.modern;

  return `Tu es un expert en rédaction de CV professionnels. Tu dois générer un CV COMPLET selon le template "${template.name}".

IMPORTANT :
- Génère un CV COMPLET et DÉTAILLÉ avec TOUTES les sections
- Utilise EXACTEMENT la structure du template fourni
- Remplis chaque section avec du contenu professionnel et pertinent
- Pour les expériences, liste au moins 3-4 réalisations concrètes par poste
- Pour les compétences, sois spécifique et pertinent au poste visé
- Utilise des verbes d'action et des résultats mesurables quand possible
- Adapte le ton et le vocabulaire au style du template

STRUCTURE DU TEMPLATE "${template.name.toUpperCase()}" :
${template.structure}

Description du style : ${template.description}`;
}
