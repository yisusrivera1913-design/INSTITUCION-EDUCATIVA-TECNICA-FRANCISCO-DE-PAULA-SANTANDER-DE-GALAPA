import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split(/\r?\n/);
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        
        if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value;
        if (key === 'VITE_SUPABASE_ANON_KEY') SUPABASE_KEY = value;
    }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan credenciales.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateLogo() {
    console.log('🏫 Buscando institución "santander-galapa"...');

    const { data: inst, error: fetchError } = await supabase
        .from('instituciones')
        .select('id, config_visual')
        .eq('slug', 'santander-galapa')
        .maybeSingle();

    if (fetchError) {
        console.error('❌ Error Supabase:', fetchError);
        return;
    }

    if (!inst) {
        console.error('❌ No se encontró institucion.');
        return;
    }

    const updatedConfig = {
        ...(inst.config_visual || {}),
        logo_url: '/logo_santander.png'
    };

    const { error: updateError } = await supabase
        .from('instituciones')
        .update({ config_visual: updatedConfig })
        .eq('id', inst.id);

    if (updateError) {
        console.error('❌ Error al actualizar config_visual:', updateError);
        return;
    }

    console.log('✅ ¡Logo actualizado! a /logo_santander.png');
}

updateLogo();
