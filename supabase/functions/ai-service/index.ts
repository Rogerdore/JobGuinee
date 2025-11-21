import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CentralizedAIRequest {
  user_id: string;
  service_key: string;
  payload: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const requestBody: CentralizedAIRequest = await req.json();
    const { user_id, service_key, payload } = requestBody;

    if (!user_id || !service_key || !payload) {
      throw new Error("user_id, service_key, and payload are required");
    }

    if (user_id !== user.id) {
      throw new Error("User ID mismatch");
    }

    const { data: serviceConfig, error: serviceError } = await supabase
      .from('service_credit_costs')
      .select('*')
      .eq('service_key', service_key)
      .eq('is_active', true)
      .eq('status', true)
      .maybeSingle();

    if (serviceError || !serviceConfig) {
      throw new Error(`Service "${service_key}" not found or inactive`);
    }

    const { data: aiConfig, error: configError } = await supabase
      .from('chatbot_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError || !aiConfig) {
      throw new Error("AI configuration not found");
    }

    if (!aiConfig.enabled) {
      throw new Error("AI service is currently disabled");
    }

    if (!aiConfig.api_key) {
      throw new Error("AI API key not configured");
    }

    const model = serviceConfig.model || aiConfig.ai_model || 'gemini-1.5-flash';
    const temperature = serviceConfig.temperature !== null ? serviceConfig.temperature : (aiConfig.temperature || 0.7);
    const maxTokens = serviceConfig.max_tokens || aiConfig.max_tokens || 2000;
    const apiProvider = aiConfig.api_provider || 'gemini';

    let prompt = '';

    if (payload.prompt_content) {
      prompt = payload.prompt_content;
    } else if (serviceConfig.prompt_template) {
      prompt = serviceConfig.prompt_template;
      for (const [key, value] of Object.entries(payload)) {
        const placeholder = `{{${key}}}`;
        prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
      }
    } else {
      throw new Error('No prompt template configured for this service');
    }

    const systemInstructions = serviceConfig.system_instructions || aiConfig.system_prompt || '';

    let aiResponse;
    let fullResponse;

    if (apiProvider === 'gemini') {
      const apiVersion = model.includes('1.5') || model.includes('2.0') ? 'v1' : 'v1beta';
      const geminiEndpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

      let fullPrompt = '';
      if (systemInstructions) {
        fullPrompt = `${systemInstructions}\n\n${prompt}`;
      } else {
        fullPrompt = prompt;
      }

      if (serviceConfig.knowledge_base) {
        fullPrompt = `${serviceConfig.knowledge_base}\n\n${fullPrompt}`;
      }

      const geminiResponse = await fetch(`${geminiEndpoint}?key=${aiConfig.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          }
        })
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini error:', errorText);
        throw new Error(`Gemini API error: ${errorText}`);
      }

      const geminiData = await geminiResponse.json();

      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        throw new Error('Gemini API returned no candidates');
      }

      fullResponse = geminiData;
      aiResponse = {
        content: geminiData.candidates[0].content.parts[0].text,
        model: model,
        provider: 'gemini',
        usage: geminiData.usageMetadata
      };

    } else if (apiProvider === 'openai') {
      const openaiEndpoint = aiConfig.api_endpoint || 'https://api.openai.com/v1/chat/completions';

      const messages: any[] = [];

      if (systemInstructions) {
        messages.push({
          role: 'system',
          content: systemInstructions
        });
      }

      if (serviceConfig.knowledge_base) {
        messages.push({
          role: 'system',
          content: `Knowledge Base:\n${serviceConfig.knowledge_base}`
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const openaiResponse = await fetch(openaiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.api_key}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const openaiData = await openaiResponse.json();
      fullResponse = openaiData;
      aiResponse = {
        content: openaiData.choices[0].message.content,
        model: model,
        provider: 'openai',
        usage: openaiData.usage
      };

    } else if (apiProvider === 'anthropic') {
      const anthropicEndpoint = aiConfig.api_endpoint || 'https://api.anthropic.com/v1/messages';

      let fullPrompt = prompt;

      if (serviceConfig.knowledge_base) {
        fullPrompt = `${serviceConfig.knowledge_base}\n\n${fullPrompt}`;
      }

      const anthropicResponse = await fetch(anthropicEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiConfig.api_key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          system: systemInstructions || undefined,
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: maxTokens,
          temperature: temperature
        })
      });

      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const anthropicData = await anthropicResponse.json();
      fullResponse = anthropicData;
      aiResponse = {
        content: anthropicData.content[0].text,
        model: model,
        provider: 'anthropic',
        usage: anthropicData.usage
      };

    } else if (apiProvider === 'deepseek') {
      const deepseekEndpoint = aiConfig.api_endpoint || 'https://api.deepseek.com/v1/chat/completions';

      const messages: any[] = [];

      if (systemInstructions) {
        messages.push({
          role: 'system',
          content: systemInstructions
        });
      }

      if (serviceConfig.knowledge_base) {
        messages.push({
          role: 'system',
          content: `Knowledge Base:\n${serviceConfig.knowledge_base}`
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const deepseekResponse = await fetch(deepseekEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.api_key}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens
        })
      });

      if (!deepseekResponse.ok) {
        const errorData = await deepseekResponse.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const deepseekData = await deepseekResponse.json();
      fullResponse = deepseekData;
      aiResponse = {
        content: deepseekData.choices[0].message.content,
        model: model,
        provider: 'deepseek',
        usage: deepseekData.usage
      };

    } else {
      throw new Error(`Unsupported API provider: ${apiProvider}`);
    }

    const { data: creditsResult, error: creditsError } = await supabase.rpc('use_ai_credits', {
      p_user_id: user_id,
      p_service_key: service_key,
      p_input_payload: payload,
      p_output_response: {
        ai_response: aiResponse,
        full_response: fullResponse
      }
    });

    if (creditsError) {
      throw new Error(`Credits error: ${creditsError.message}`);
    }

    const creditsData = creditsResult as any;

    if (!creditsData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: creditsData.error,
          message: creditsData.message,
          required_credits: creditsData.required_credits,
          available_credits: creditsData.available_credits
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        credits_remaining: creditsData.credits_remaining,
        credits_consumed: creditsData.credits_consumed,
        service_name: creditsData.service_name,
        usage_id: creditsData.usage_id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error('AI Service Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});