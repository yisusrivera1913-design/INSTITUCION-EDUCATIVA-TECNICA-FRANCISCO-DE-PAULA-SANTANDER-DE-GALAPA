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
        const externalRef = payment.external_reference || '' // email|instId|plan
        const [userEmail, institucionId, planId] = externalRef.split('|')
        
        console.log(`💰 Procesando pago para: ${userEmail} en inst: ${institucionId} (Plan: ${planId})`)

        if (planId.includes('anual')) {
          // 1. ACTUALIZAR PLAN INSTITUCIONAL (ANUAL)
          const { error: instError } = await supabase
            .from('instituciones')
            .update({ plan_suscripcion: 'oro' })
            .eq('id', institucionId)
          if (instError) throw instError

          // 2. MARCAR USUARIO COMO ANUAL
          const { error: userError } = await supabase
            .from('app_users')
            .update({ plan_type: 'annual' })
            .eq('email', userEmail)
          if (userError) throw userError

          console.log(`✅ Plan ANUAL activado para ${userEmail}`)
        } else {
          // 3. RECARGA DE CRÉDITOS INDIVIDUALES (SEMANAL/MENSUAL)
          const creditsToAdd = planId.includes('semanal') ? 10 : (planId.includes('mensual') ? 30 : 1)
          
          // Obtener créditos actuales
          const { data: user } = await supabase
            .from('app_users')
            .select('credits')
            .eq('email', userEmail)
            .single()

          const newCredits = (user?.credits || 0) + creditsToAdd

          const { error: credError } = await supabase
            .from('app_users')
            .update({ credits: newCredits, plan_type: 'free' })
            .eq('email', userEmail)
          if (credError) throw credError

          console.log(`✅ ${creditsToAdd} créditos agregados a ${userEmail}. Total: ${newCredits}`)
        }
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
