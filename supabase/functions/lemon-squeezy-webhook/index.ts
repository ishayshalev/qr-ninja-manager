import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from "https://deno.land/x/hmac@v2.0.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the raw request body
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature')
    const signingSecret = Deno.env.get('LEMON_SQUEEZY_SIGNING_SECRET')

    if (!signature || !signingSecret) {
      throw new Error('Missing signature or signing secret')
    }

    // Verify webhook signature
    const isValid = await verify(
      "sha256",
      signingSecret,
      rawBody,
      signature,
      "hex"
    )

    if (!isValid) {
      throw new Error('Invalid signature')
    }

    const body = JSON.parse(rawBody)
    console.log('Webhook received:', body)

    const { data: { event_name, data } } = body

    switch (event_name) {
      case 'subscription_created':
      case 'subscription_updated': {
        const { subscription } = data
        const { user_id } = subscription.custom_data
        
        if (!user_id) {
          throw new Error('No user_id in custom_data')
        }

        const { data: existingSubscription, error: fetchError } = await supabaseClient
          .from('subscriptions')
          .select()
          .eq('user_id', user_id)
          .maybeSingle()

        if (fetchError) throw fetchError

        const subscriptionData = {
          user_id,
          lemon_squeezy_subscription_id: subscription.id.toString(),
          status: subscription.status,
          current_period_ends_at: subscription.renews_at,
          trial_ends_at: subscription.trial_ends_at,
          updated_at: new Date().toISOString()
        }

        if (existingSubscription) {
          console.log('Updating existing subscription for user:', user_id)
          const { error } = await supabaseClient
            .from('subscriptions')
            .update(subscriptionData)
            .eq('user_id', user_id)

          if (error) throw error
        } else {
          console.log('Creating new subscription for user:', user_id)
          const { error } = await supabaseClient
            .from('subscriptions')
            .insert([{
              ...subscriptionData,
              created_at: new Date().toISOString()
            }])

          if (error) throw error
        }
        break
      }

      case 'subscription_cancelled': {
        const { subscription } = data
        const { user_id } = subscription.custom_data

        if (!user_id) {
          throw new Error('No user_id in custom_data')
        }

        console.log('Cancelling subscription for user:', user_id)
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)

        if (error) throw error
        break
      }

      case 'subscription_payment_success': {
        const { subscription } = data
        const { user_id } = subscription.custom_data

        if (!user_id) {
          throw new Error('No user_id in custom_data')
        }

        console.log('Processing successful payment for user:', user_id)
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_ends_at: subscription.renews_at,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)

        if (error) throw error
        break
      }

      case 'subscription_payment_failed': {
        const { subscription } = data
        const { user_id } = subscription.custom_data

        if (!user_id) {
          throw new Error('No user_id in custom_data')
        }

        console.log('Processing failed payment for user:', user_id)
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)

        if (error) throw error
        break
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})