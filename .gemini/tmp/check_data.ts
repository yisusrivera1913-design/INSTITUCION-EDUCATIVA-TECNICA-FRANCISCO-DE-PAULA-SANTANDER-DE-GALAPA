import { supabase } from '../services/supabaseClient';

async function checkData() {
    console.log("--- Checking Institutions ---");
    const { data: insts } = await supabase.from('instituciones').select('id, nombre, slug');
    console.log(JSON.stringify(insts, null, 2));

    console.log("\n--- Checking Super Admins ---");
    const { data: supers } = await supabase.from('app_users').select('*').eq('role', 'super_admin');
    console.log(JSON.stringify(supers, null, 2));
}

checkData();
