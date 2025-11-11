import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  sessionId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messages, sessionId }: RequestBody = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: config } = await supabase
      .from('chatbot_config')
      .select('*')
      .single();

    if (!config || !config.enabled) {
      return new Response(
        JSON.stringify({ error: 'Chatbot is not enabled' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!config.api_key) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemMessage = {
      role: 'system' as const,
      content: config.system_prompt || 'Vous êtes un assistant IA serviable.',
    };

    const fullMessages = [systemMessage, ...messages];

    let aiResponse = '';

    if (config.api_provider === 'openai') {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.ai_model || 'gpt-3.5-turbo',
          messages: fullMessages,
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 500,
        }),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text();
        console.error('OpenAI API error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to get AI response' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const data = await openaiResponse.json();
      aiResponse = data.choices[0].message.content;
    } else if (config.api_provider === 'anthropic') {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.api_key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.ai_model || 'claude-3-haiku-20240307',
          max_tokens: config.max_tokens || 500,
          temperature: config.temperature || 0.7,
          system: systemMessage.content,
          messages: messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          })),
        }),
      });

      if (!anthropicResponse.ok) {
        const error = await anthropicResponse.text();
        console.error('Anthropic API error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to get AI response' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const data = await anthropicResponse.json();
      aiResponse = data.content[0].text;
    } else if (config.api_provider === 'custom' && config.api_endpoint) {
      const customResponse = await fetch(config.api_endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: fullMessages,
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 500,
        }),
      });

      if (!customResponse.ok) {
        const error = await customResponse.text();
        console.error('Custom API error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to get AI response' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const data = await customResponse.json();
      aiResponse = data.choices?.[0]?.message?.content || data.response || '';
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid API provider configuration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Chatbot AI error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});