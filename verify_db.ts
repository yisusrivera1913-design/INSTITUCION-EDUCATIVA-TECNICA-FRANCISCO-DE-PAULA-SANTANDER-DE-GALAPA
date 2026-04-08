
import { supabase } from './services/supabaseClient';

async function verify() {
    const { data, error } = await supabase.from('instituciones').select('nombre, slug, activo');
    console.log('INSTITUCIONES EN BD:');
    console.log(JSON.stringify(data, null, 2));
    if (error) console.error(error);
}

verify();
