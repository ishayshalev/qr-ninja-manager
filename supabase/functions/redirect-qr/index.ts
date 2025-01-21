import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const qrId = url.searchParams.get('id')
    
    if (!qrId) {
      return new Response(
        JSON.stringify({ error: 'QR ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing QR redirect for ID:', qrId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get QR code details
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('redirect_url')
      .eq('id', qrId)
      .single()

    if (qrError || !qrCode) {
      console.error('Error fetching QR code:', qrError)
      return new Response(
        JSON.stringify({ error: 'QR code not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse user agent
    const userAgent = req.headers.get('user-agent') || ''
    const browser = getBrowser(userAgent)
    const os = getOS(userAgent)
    const deviceType = getDeviceType(userAgent)
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip')
    const referrer = req.headers.get('referer')

    // Get geolocation data
    const geoData = await getGeoData(ipAddress || '')

    // Log the scan
    const { error: scanError } = await supabase
      .from('qr_scans')
      .insert([{
        qr_code_id: qrId,
        ip_address: ipAddress,
        user_agent: userAgent,
        browser,
        os,
        device_type: deviceType,
        country: geoData.country,
        city: geoData.city,
        referrer,
      }])

    if (scanError) {
      console.error('Error logging scan:', scanError)
    }

    // Increment usage count
    await supabase
      .from('qr_codes')
      .update({ usage_count: supabase.rpc('increment_counter', { row_id: qrId }) })
      .eq('id', qrId)

    // Redirect to the target URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': qrCode.redirect_url,
      },
    })
  } catch (error) {
    console.error('Error in redirect-qr function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions to parse user agent
function getBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Opera')) return 'Opera'
  return 'Unknown'
}

function getOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac OS')) return 'MacOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS')) return 'iOS'
  return 'Unknown'
}

function getDeviceType(ua: string): string {
  if (ua.includes('Mobile')) return 'Mobile'
  if (ua.includes('Tablet')) return 'Tablet'
  return 'Desktop'
}

async function getGeoData(ip: string) {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await response.json()
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown'
    }
  } catch (error) {
    console.error('Error getting geo data:', error)
    return {
      country: 'Unknown',
      city: 'Unknown'
    }
  }
}