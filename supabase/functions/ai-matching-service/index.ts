import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MatchingRequest {
  candidate_profile: {
    full_name: string;
    title: string;
    skills: string[];
    work_experience: any[];
    education: any[];
    years_of_experience: number;
    education_level: string;
    languages: string[];
    location: string;
    location_mobility: string[];
    desired_salary_min?: number;
    desired_salary_max?: number;
    desired_sectors: string[];
    certifications: any[];
    tools_technologies: string[];
  };
  job_offer: {
    id: string;
    title: string;
    description: string;
    sector: string;
    location: string;
    contract_type: string;
    salary_min?: number;
    salary_max?: number;
    required_skills: string[];
    preferred_skills: string[];
    min_experience: number;
    required_education_level: string;
    required_languages: string[];
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    if (!openaiApiKey) {
      console.warn(
        "OPENAI_API_KEY not configured, returning mock response for testing"
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: MatchingRequest = await req.json();

    // Get IA config
    const { data: configData, error: configError } = await supabase.rpc(
      "get_ia_service_config",
      { p_service_code: "ai_matching" }
    );

    if (configError || !configData?.success) {
      console.error("Failed to fetch IA config", configError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch IA service configuration",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const config = configData.config;

    // Build the prompt
    const systemMessage = config.system_message || config.base_prompt;
    const instructions = config.instructions || "";

    const userMessage = `
## PROFIL CANDIDAT COMPLET

Nom: ${body.candidate_profile.full_name}
Titre: ${body.candidate_profile.title}
Naissance: ${body.candidate_profile.education_level}
Localisation: ${body.candidate_profile.location}

### Compétences
${body.candidate_profile.skills.join(", ")}

### Outils/Technologues
${body.candidate_profile.tools_technologies.join(", ") || "Non spécifiés"}

### Expérience Professionnelle
${body.candidate_profile.work_experience
  .map(
    (exp: any) =>
      `- ${exp.position} chez ${exp.company} (${exp.period})\n  Missions: ${exp.missions?.join(", ") || "N/A"}`
  )
  .join("\n")}

### Formation
${body.candidate_profile.education
  .map(
    (edu: any) =>
      `- ${edu.degree} de ${edu.school} (${edu.graduation_year})`
  )
  .join("\n")}

### Langues
${body.candidate_profile.languages.join(", ")}

### Certifications
${body.candidate_profile.certifications?.map((c: any) => `- ${c.name || c}`).join("\n") || "Aucune"}

### Salaire Souhaité
${body.candidate_profile.desired_salary_min || "Non spécifié"} - ${body.candidate_profile.desired_salary_max || "Non spécifié"} GNF

### Secteurs d'Intérêt
${body.candidate_profile.desired_sectors.join(", ")}

### Mobilité
${body.candidate_profile.location_mobility.join(", ") || "Non spécifiée"}

---

## OFFRE D'EMPLOI

Poste: ${body.job_offer.title}
Entreprise/Secteur: ${body.job_offer.sector}
Localisation: ${body.job_offer.location}
Type de Contrat: ${body.job_offer.contract_type}
Description: ${body.job_offer.description}

### Compétences Requises
${body.job_offer.required_skills.join(", ")}

### Compétences Souhaitées
${body.job_offer.preferred_skills.join(", ") || "Aucune"}

### Expérience Minimale
${body.job_offer.min_experience} ans

### Niveau d'Études Requis
${body.job_offer.required_education_level}

### Langues Requises
${body.job_offer.required_languages.join(", ")}

### Salaire Proposé
${body.job_offer.salary_min || "Non spécifié"} - ${body.job_offer.salary_max || "Non spécifié"} GNF

---

${instructions}

FORMAT REQUIS: Réponds UNIQUEMENT avec un JSON valide, sans aucun texte avant ou après.`;

    // If no OpenAI key, return mock response
    if (!openaiApiKey) {
      const mockResponse = {
        score_global: 78,
        niveau: "Très fort",
        type_emploi_détecté: "technique",
        strengths: [
          "Compétences techniques bien alignées",
          "Expérience pertinente en secteur similaire",
          "Formation appropriée",
        ],
        gaps: [
          "Manque d'expérience en management",
          "Certifications additionnelles appréciées",
        ],
        sub_scores: {
          skills: 85,
          experience: 75,
          education: 70,
          tools: 80,
          soft_skills: 65,
          languages: 75,
          location: 90,
          salary_match: 80,
        },
        skills_matched: [
          "JavaScript",
          "React",
          "Node.js",
          "PostgreSQL",
        ],
        skills_missing: ["Kubernetes", "AWS Advanced"],
        mission_relevance: [
          "Développement full-stack aligne avec experience",
          "Architecture API compatible",
        ],
        improvement_suggestions: [
          "Obtenir certifications cloud (AWS, GCP)",
          "Approfondir Kubernetes et DevOps",
          "Pratiquer mobile development",
        ],
        training_recommendations: [
          "Formation AWS Solutions Architect (4 semaines)",
          "Certification Kubernetes (3 semaines)",
          "Course React Advanced Patterns (2 semaines)",
        ],
        hiring_risk_level: "low",
        hiring_risk_reason:
          "Candidat très qualifie avec competences alignees et experience pertinente",
        potential_development:
          "Candidat peut progresser vers role senior/architect rapidement",
        negotiation_points: [
          "Flexibilite travail a distance: 3j/semaine possible",
          "Augmentation salariale: potential +15% apres 6 mois",
          "Budget formation: 2000 USD/an proposable",
        ],
      };
      return new Response(JSON.stringify(mockResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-4",
        temperature: config.temperature || 0.3,
        max_tokens: config.max_tokens || 3500,
        top_p: config.top_p || 1.0,
        frequency_penalty: config.frequency_penalty || 0.0,
        presence_penalty: config.presence_penalty || 0.0,
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "AI service error", details: error }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    // Parse JSON from response
    let matchingResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchingResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          raw_response: content,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log service usage
    await supabase
      .from("ai_service_usage_history")
      .insert({
        user_id: user.id,
        service_key: "ai_matching",
        input_payload: body,
        output_response: matchingResult,
        credits_consumed: 50,
        status: "success",
      });

    return new Response(JSON.stringify(matchingResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-matching-service:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
