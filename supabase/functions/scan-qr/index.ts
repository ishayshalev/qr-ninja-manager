import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  qrId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { qrId, ipAddress, userAgent, referrer } = await req.json() as RequestBody;

    console.log('Scanning QR code:', qrId);
    console.log('IP Address:', ipAddress);
    console.log('User Agent:', userAgent);
    console.log('Referrer:', referrer);

    // Parse user agent to get browser, OS, and device information
    const ua = userAgent || '';
    const browser = getBrowser(ua);
    const os = getOS(ua);
    const deviceType = getDeviceType(ua);

    // Get country and city from IP using a geolocation service
    const geoData = await getGeoData(ipAddress || '');

    // Record the scan in the database
    const { data, error } = await supabase
      .from('qr_scans')
      .insert([
        {
          qr_code_id: qrId,
          ip_address: ipAddress,
          user_agent: userAgent,
          country: geoData.country,
          city: geoData.city,
          browser,
          os,
          device_type: deviceType,
          referrer,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error recording scan:', error);
      throw error;
    }

    // Increment the usage count in qr_codes table
    const { error: updateError } = await supabase
      .from('qr_codes')
      .update({ usage_count: supabase.rpc('increment_counter', { row_id: qrId }) })
      .eq('id', qrId);

    if (updateError) {
      console.error('Error updating usage count:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, scan: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scan-qr function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions to parse user agent
function getBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
}

function getOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getDeviceType(ua: string): string {
  if (ua.includes('Mobile')) return 'Mobile';
  if (ua.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}

async function getGeoData(ip: string) {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown'
    };
  } catch (error) {
    console.error('Error getting geo data:', error);
    return {
      country: 'Unknown',
      city: 'Unknown'
    };
  }
}