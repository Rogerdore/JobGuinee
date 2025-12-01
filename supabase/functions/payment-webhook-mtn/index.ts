import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const payload = await req.json();

    const orderReference = payload.externalId || payload.referenceId;
    const paymentStatus = payload.status;
    const providerTransactionId = payload.financialTransactionId;

    const { data: purchase, error: fetchError } = await supabaseClient
      .from('credit_purchases')
      .select('*')
      .eq('payment_reference', orderReference)
      .single();

    if (fetchError || !purchase) {
      console.error('Purchase not found:', orderReference);
      return new Response(
        JSON.stringify({ error: 'Purchase not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (paymentStatus === 'SUCCESSFUL') {
      const { data: result, error: completeError } = await supabaseClient
        .rpc('complete_credit_purchase', {
          p_purchase_id: purchase.id,
          p_payment_provider_id: providerTransactionId
        });

      if (completeError) {
        console.error('Error completing purchase:', completeError);
        return new Response(
          JSON.stringify({ error: 'Failed to complete purchase' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Purchase completed:', purchase.id);

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else if (paymentStatus === 'FAILED') {
      const { error: cancelError } = await supabaseClient
        .rpc('cancel_credit_purchase', {
          p_purchase_id: purchase.id,
          p_reason: `Payment failed: ${payload.reason || 'No reason provided'}`
        });

      if (cancelError) {
        console.error('Error cancelling purchase:', cancelError);
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
