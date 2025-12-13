import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@^2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InterviewReminder {
  id: string;
  interview_id: string;
  reminder_type: 'j_moins_1' | 'deux_heures_avant';
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed';
}

interface Interview {
  id: string;
  application_id: string;
  job_id: string;
  candidate_id: string;
  company_id: string;
  interview_type: 'visio' | 'presentiel' | 'telephone';
  scheduled_at: string;
  location_or_link: string | null;
  notes: string | null;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  job: {
    id: string;
    title: string;
  };
  company: {
    id: string;
    name: string;
  };
}

interface NotificationTemplate {
  subject: string;
  body: string;
}

const TEMPLATES: Record<string, NotificationTemplate> = {
  j_moins_1: {
    subject: 'Rappel : Entretien demain pour {{job_title}}',
    body: `Bonjour {{candidate_name}},\n\nNous vous rappelons que votre entretien pour le poste de {{job_title}} est prévu demain.\n\n📅 Date : {{interview_date}}\n⏰ Heure : {{interview_time}}\n{{#if_visio}}\n🎥 Lien de visioconférence : {{interview_link}}\n{{/if_visio}}\n{{#if_presentiel}}\n📍 Lieu : {{interview_location}}\n{{/if_presentiel}}\n\nÀ bientôt !\n{{company_name}}`
  },
  deux_heures_avant: {
    subject: 'Rappel : Entretien dans 2 heures',
    body: `Bonjour {{candidate_name}},\n\nVotre entretien pour {{job_title}} commence dans 2 heures ({{interview_time}}).\n\n{{#if_visio}}\n🎥 Lien de connexion : {{interview_link}}\n{{/if_visio}}\n\nÀ tout de suite !\n{{company_name}}`
  }
};

function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value || '');
  });

  const conditionalBlockRegex = /\{\{#if_(\w+)\}\}([\s\S]*?)\{\{\/if_\1\}\}/g;
  processed = processed.replace(conditionalBlockRegex, (_match, condition, content) => {
    return variables[condition] ? content : '';
  });

  processed = processed.replace(/\n{3,}/g, '\n\n');

  return processed.trim();
}

async function sendNotification(
  supabase: any,
  recipientId: string,
  subject: string,
  body: string,
  applicationId: string,
  metadata: Record<string, any>
) {
  await supabase.from('notifications').insert({
    profile_id: recipientId,
    type: 'interview_reminder',
    title: subject,
    message: body,
    metadata,
    is_read: false
  });

  console.log(`[NOTIFICATION] Sent to profile ${recipientId}`);
}

async function logCommunication(
  supabase: any,
  applicationId: string,
  senderId: string,
  recipientId: string,
  subject: string,
  body: string,
  channel: string
) {
  await supabase.from('communications_log').insert({
    application_id: applicationId,
    sender_id: senderId,
    recipient_id: recipientId,
    communication_type: 'interview_reminder',
    channel,
    subject,
    message: body,
    status: 'sent'
  });
}

async function processReminder(
  supabase: any,
  reminder: InterviewReminder
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Processing reminder ${reminder.id} (${reminder.reminder_type})`);

    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select(`
        *,
        candidate:profiles!interviews_candidate_id_fkey(id, full_name, email, phone),
        job:jobs(id, title),
        company:companies(id, name)
      `)
      .eq('id', reminder.interview_id)
      .single();

    if (fetchError || !interview) {
      throw new Error(`Interview not found: ${fetchError?.message}`);
    }

    const interviewData = interview as Interview;

    const template = TEMPLATES[reminder.reminder_type];
    if (!template) {
      throw new Error(`Template not found for type: ${reminder.reminder_type}`);
    }

    const scheduledAt = new Date(interviewData.scheduled_at);
    const variables = {
      candidate_name: interviewData.candidate.full_name,
      job_title: interviewData.job.title,
      company_name: interviewData.company.name,
      interview_date: scheduledAt.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      interview_time: scheduledAt.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      interview_link: interviewData.location_or_link || '',
      interview_location: interviewData.location_or_link || '',
      if_visio: interviewData.interview_type === 'visio',
      if_presentiel: interviewData.interview_type === 'presentiel',
      if_telephone: interviewData.interview_type === 'telephone'
    };

    const subject = processTemplate(template.subject, variables);
    const body = processTemplate(template.body, variables);

    await sendNotification(
      supabase,
      interviewData.candidate_id,
      subject,
      body,
      interviewData.application_id,
      {
        interview_id: interviewData.id,
        job_id: interviewData.job_id,
        company_id: interviewData.company_id,
        reminder_type: reminder.reminder_type
      }
    );

    const systemUserId = '00000000-0000-0000-0000-000000000000';
    await logCommunication(
      supabase,
      interviewData.application_id,
      systemUserId,
      interviewData.candidate_id,
      subject,
      body,
      'notification'
    );

    console.log(`✓ Reminder ${reminder.id} processed successfully`);
    return { success: true };
  } catch (error: any) {
    console.error(`✗ Error processing reminder ${reminder.id}:`, error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== Interview Reminders Processor Started ===');

    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);

    const { data: reminders, error: fetchError } = await supabase
      .from('interview_reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch reminders: ${fetchError.message}`);
    }

    if (!reminders || reminders.length === 0) {
      console.log('No pending reminders to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending reminders',
          processed: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${reminders.length} pending reminders`);

    const results = await Promise.allSettled(
      reminders.map((reminder: InterviewReminder) => processReminder(supabase, reminder))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const reminder = reminders[i];

      if (result.status === 'fulfilled' && result.value.success) {
        await supabase
          .from('interview_reminders')
          .update({
            status: 'sent',
            sent_at: now.toISOString(),
            error_message: null
          })
          .eq('id', reminder.id);
      } else {
        const errorMessage = result.status === 'rejected'
          ? result.reason?.message || 'Unknown error'
          : (result.value as any).error || 'Processing failed';

        await supabase
          .from('interview_reminders')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', reminder.id);
      }
    }

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failureCount = results.length - successCount;

    console.log(`=== Processing Complete ===`);
    console.log(`Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: successCount,
        failed: failureCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in interview reminders processor:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});