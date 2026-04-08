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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (topic === 'payment' || topic === 'merchant_order') {
      const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
      
      // Consultar el estado del pago en Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      })
      
      const payment = await mpResponse.json()
      
      if (payment.status === 'approved') {
        const institucionId = payment.external_reference
        
        // Actualizar el plan de la institución
        const { error } = await supabase
          .from('instituciones')
          .update({ plan_suscripcion: 'oro' }) // Asumimos Oro como el plan PRO
          .eq('id', institucionId)
          
        if (error) throw error
        console.log(`✅ Plan actualizado para institución: ${institucionId}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('❌ Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
