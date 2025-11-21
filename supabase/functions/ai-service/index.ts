import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIRequest {
  service_type: 'cv_generation' | 'cover_letter' | 'profile_analysis' | 'job_generation' | 'matching';
  prompt: string;
  context?: any;
  temperature?: number;
  max_tokens?: number;
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

    const requestBody: AIRequest = await req.json();
    const { service_type, prompt, context, temperature, max_tokens } = requestBody;

    if (!service_type || !prompt) {
      throw new Error("service_type and prompt are required");
    }

    const { data: configData, error: configError } = await supabase
      .from('chatbot_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError || !configData) {
      throw new Error("AI configuration not found");
    }

    const config = configData;

    if (!config.enabled) {
      throw new Error("AI service is currently disabled");
    }

    if (!config.api_key) {
      throw new Error("AI API key not configured");
    }

    const apiProvider = config.api_provider || 'openai';
    const apiModel = config.ai_model || 'gpt-3.5-turbo';
    const apiTemperature = temperature !== undefined ? temperature : (config.temperature || 0.7);
    const apiMaxTokens = max_tokens !== undefined ? max_tokens : (config.max_tokens || 500);

    let aiResponse;

    if (apiProvider === 'openai') {
      const openaiEndpoint = config.api_endpoint || 'https://api.openai.com/v1/chat/completions';
      
      const messages = [
        {
          role: 'system',
          content: config.system_prompt || 'You are a helpful AI assistant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      if (context) {
        messages.splice(1, 0, {
          role: 'system',
          content: `Context: ${JSON.stringify(context)}`
        });
      }

      const openaiResponse = await fetch(openaiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages: messages,
          temperature: apiTemperature,
          max_tokens: apiMaxTokens
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const openaiData = await openaiResponse.json();
      aiResponse = {
        content: openaiData.choices[0].message.content,
        model: apiModel,
        provider: 'openai',
        usage: openaiData.usage
      };

    } else if (apiProvider === 'anthropic') {
      const anthropicEndpoint = config.api_endpoint || 'https://api.anthropic.com/v1/messages';
      
      let fullPrompt = prompt;
      if (context) {
        fullPrompt = `Context: ${JSON.stringify(context)}\n\n${prompt}`;
      }

      const anthropicResponse = await fetch(anthropicEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.api_key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: apiMaxTokens,
          temperature: apiTemperature
        })
      });

      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const anthropicData = await anthropicResponse.json();
      aiResponse = {
        content: anthropicData.content[0].text,
        model: apiModel,
        provider: 'anthropic',
        usage: anthropicData.usage
      };

    } else {
      throw new Error(`Unsupported API provider: ${apiProvider}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: aiResponse,
        service_type
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