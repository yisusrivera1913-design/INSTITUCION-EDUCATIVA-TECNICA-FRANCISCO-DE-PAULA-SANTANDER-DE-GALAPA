import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Preference } from 'https://esm.sh/mercadopago@2.2.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { institucionId, userEmail, planName, amount, domain } = await req.json()
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') || Deno.env.get('MP_ACCESS_TOKEN')

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not set')
    }

    // Inicializar cliente
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    // external_reference formateado como: email|institucionId|planId
    const externalReference = `${userEmail}|${institucionId}|${planName.toLowerCase()}`

    const body = {
      items: [
        {
          id: planName.toLowerCase(),
          title: `Suscripción: ${planName}`,
          unit_price: Number(amount),
          quantity: 1,
          currency_id: 'COP'
        }
      ],
      external_reference: externalReference,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      back_urls: {
        success: `${domain}/?payment=success`,
        failure: `${domain}/?payment=failure`,
        pending: `${domain}/?payment=pending`,
      },
      auto_return: 'approved',
    };

    const result = await preference.create({ body });
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error creating preference:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
