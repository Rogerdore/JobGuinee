import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  contract_type: string;
  salary_range?: string;
}

interface PlatformConfig {
  platform: string;
  is_enabled: boolean;
  auto_share_enabled: boolean;
  post_template: string;
  credentials: any;
  settings: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { job_id, platforms } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, location, contract_type, salary_range')
      .eq('id', job_id)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let query = supabase
      .from('social_platforms_config')
      .select('*')
      .eq('is_enabled', true)
      .eq('auto_share_enabled', true);

    if (platforms && platforms.length > 0) {
      query = query.in('platform', platforms);
    }

    const { data: platformConfigs, error: configError } = await query;

    if (configError || !platformConfigs || platformConfigs.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No platforms configured for auto-sharing',
          shared_on: [],
          errors: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sharedOn: string[] = [];
    const errors: any[] = [];

    for (const config of platformConfigs as PlatformConfig[]) {
      try {
        const postContent = fillTemplate(
          config.post_template,
          job as JobData,
          `https://jobguinee-pro.com/offres/${job.id}`
        );

        const shareResult = await shareToPlatform(config, job as JobData, postContent, supabase);

        if (shareResult.success) {
          sharedOn.push(config.platform);

          await supabase.from('social_share_analytics').insert({
            job_id: job.id,
            platform: config.platform,
            share_type: 'auto',
            metadata: {
              success: true,
              post_content: postContent,
              shared_at: new Date().toISOString(),
            },
          });
        } else {
          errors.push({
            platform: config.platform,
            error: shareResult.error,
          });

          await supabase.from('social_share_analytics').insert({
            job_id: job.id,
            platform: config.platform,
            share_type: 'auto',
            metadata: {
              success: false,
              error: shareResult.error,
              attempted_at: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        errors.push({
          platform: config.platform,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: sharedOn.length > 0,
        shared_on: sharedOn,
        errors: errors,
        job_id: job_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in auto-share-job:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function fillTemplate(template: string, job: JobData, url: string): string {
  return template
    .replace(/{title}/g, job.title)
    .replace(/{company}/g, job.company)
    .replace(/{location}/g, job.location)
    .replace(/{contract_type}/g, job.contract_type)
    .replace(/{salary}/g, job.salary_range || '')
    .replace(/{url}/g, url);
}

async function shareToPlatform(
  config: PlatformConfig,
  job: JobData,
  postContent: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  const hasCredentials = config.credentials && Object.keys(config.credentials).length > 0;

  if (!hasCredentials) {
    return {
      success: false,
      error: `No credentials configured for ${config.platform}`,
    };
  }

  switch (config.platform) {
    case 'facebook':
      return await shareToFacebook(config, postContent);
    case 'linkedin':
      return await shareToLinkedIn(config, postContent);
    case 'twitter':
      return await shareToTwitter(config, postContent);
    case 'whatsapp':
      return { success: true };
    default:
      return { success: false, error: 'Unknown platform' };
  }
}

async function shareToFacebook(
  config: PlatformConfig,
  postContent: string
): Promise<{ success: boolean; error?: string }> {
  const { page_id, access_token } = config.credentials;

  if (!page_id || !access_token) {
    return { success: false, error: 'Missing Facebook credentials' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: postContent,
          access_token: access_token,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Facebook API error' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function shareToLinkedIn(
  config: PlatformConfig,
  postContent: string
): Promise<{ success: boolean; error?: string }> {
  const { access_token, organization_id } = config.credentials;

  if (!access_token) {
    return { success: false, error: 'Missing LinkedIn credentials' };
  }

  try {
    const author = organization_id ? `urn:li:organization:${organization_id}` : 'urn:li:person:me';

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postContent,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'LinkedIn API error' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function shareToTwitter(
  config: PlatformConfig,
  postContent: string
): Promise<{ success: boolean; error?: string }> {
  const { bearer_token } = config.credentials;

  if (!bearer_token) {
    return { success: false, error: 'Missing Twitter credentials' };
  }

  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearer_token}`,
      },
      body: JSON.stringify({
        text: postContent.substring(0, 280),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || 'Twitter API error' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}