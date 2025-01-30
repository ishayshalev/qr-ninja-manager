import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const signature = req.headers.get('x-signature')
    if (!signature) {
      throw new Error('No signature provided')
    }

    const body = await req.json()
    console.log('Webhook received:', body)

    const { data: { event_name, data } } = body

    switch (event_name) {
      case 'subscription_created':
      case 'subscription_updated': {
        const { subscription } = data
        const { user_id } = subscription.custom_data
        
        const { data: existingSubscription, error: fetchError } = await supabaseClient
          .from('subscriptions')
          .select()
          .eq('user_id', user_id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        const subscriptionData = {
          user_id,
          lemon_squeezy_subscription_id: subscription.id.toString(),
          status: subscription.status,
          current_period_ends_at: subscription.ends_at,
          updated_at: new Date().toISOString()
        }

        if (existingSubscription) {
          const { error } = await supabaseClient
            .from('subscriptions')
            .update(subscriptionData)
            .eq('user_id', user_id)

          if (error) throw error
        } else {
          const { error } = await supabaseClient
            .from('subscriptions')
            .insert([subscriptionData])

          if (error) throw error
        }
        break
      }

      case 'subscription_cancelled': {
        const { subscription } = data
        const { user_id } = subscription.custom_data

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