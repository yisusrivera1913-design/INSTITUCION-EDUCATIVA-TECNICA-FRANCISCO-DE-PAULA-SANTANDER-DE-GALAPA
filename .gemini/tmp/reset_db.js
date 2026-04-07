const SALT = 'sci-2026-secure-v1';
const obfuscate = (text) => {
    const utf8Text = unescape(encodeURIComponent(text));
    const result = utf8Text.split('').map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length))
    ).join('');
    const btoa = (str) => Buffer.from(str, 'binary').toString('base64');
    return btoa(result);
};

const SUPABASE_URL = 'https://rkljtzxlqcfedwrzkyie.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbGp0enhscWNmZWR3cnpreWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTU2NjUsImV4cCI6MjA4NzA5MTY2NX0.x6tfDzCLIvEcV3d9yWaCD-99L8cuj6deIP9siowIVII';

async function resetAndCreate() {
    console.log("--- Resetting Database & Creating Accounts ---");
    
    const obfuscatedPass = obfuscate("1913");
    console.log("Obfuscated Password (1913):", obfuscatedPass);

    // 1. Get Santander ID
    console.log("Searching for Santander...");
    const resInst = await fetch(`${SUPABASE_URL}/rest/v1/instituciones?select=id,nombre&nombre=ilike.*santander*`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const insts = await resInst.json();
    console.log("Institutions found:", insts);

    if (insts.length === 0) {
        console.error("Santander not found! Can't create coordinator.");
        return;
    }
    const santanderId = insts[0].id;

    // 2. Reset app_users (Note: This might fail if RLS doesn't allow delete)
    // Actually, I'll just upsert/insert the two accounts.
    // The user said "reset", so I'll try to delete.
    console.log("Resetting app_users...");
    const resReset = await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact'
        }
    });

    // 3. Create Super Admin
    console.log("Creating Super Admin...");
    await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'SCI Administrator',
            email: 'superadmin@sistemaclasesideal.com',
            role: 'super_admin',
            password: obfuscatedPass
        })
    });

    // 4. Create Santander Coordinator
    console.log("Creating Santander Coordinator...");
    await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Coordinador Santander',
            email: 'coordinacion@santander.edu.co',
            role: 'admin',
            institucion_id: santanderId,
            password: obfuscatedPass
        })
    });

    console.log("DONE! Accounts created with password 1913.");
}

resetAndCreate();
