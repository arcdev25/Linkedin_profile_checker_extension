// Helper script to generate bcrypt password hashes
// Run with: node generate_password_hash.js

const bcrypt = require('bcryptjs');

const passwords = {
    'admin123': null,
    'owner123': null
};

async function generateHashes() {
    console.log('Generating bcrypt hashes...\n');
    
    for (const [password, _] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        passwords[password] = hash;
        console.log(`Password: ${password}`);
        console.log(`Hash: ${hash}\n`);
    }
    
    console.log('\n=== SQL to update Supabase ===\n');
    console.log(`-- Update admin password`);
    console.log(`UPDATE owners SET password = '${passwords['admin123']}' WHERE email = 'admin@system.com';\n`);
    console.log(`-- Update test owner password`);
    console.log(`UPDATE owners SET password = '${passwords['owner123']}' WHERE email = 'owner@test.com';\n`);
}

generateHashes();
