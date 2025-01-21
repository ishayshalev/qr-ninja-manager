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
    const url = new URL(req.url);
    const qrId = url.pathname.split('/').pop();

    if (!qrId) {
      return new Response(
        JSON.stringify({ error: 'QR ID not provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get QR code data
    const { data: qrCode, error: qrError } = await supabaseClient
      .from('qr_codes')
      .select('redirect_url')
      .eq('id', qrId)
      .single()

    if (qrError || !qrCode) {
      return new Response(
        JSON.stringify({ error: 'QR code not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the scan
    const { error: scanError } = await supabaseClient
      .from('qr_scans')
      .insert([
        { 
          qr_code_id: qrId,
          user_agent: req.headers.get('user-agent'),
          referrer: req.headers.get('referer'),
        }
      ])

    if (scanError) {
      console.error('Error logging scan:', scanError)
    }

    // Redirect to the destination URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': qrCode.redirect_url,
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})