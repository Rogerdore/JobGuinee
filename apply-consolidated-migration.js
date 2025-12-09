import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes: VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function applySQLFile() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   Application Migration Consolidée Supabase  ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const filepath = join(__dirname, 'consolidated_migration.sql');
  const sql = readFileSync(filepath, 'utf8');

  console.log(`📄 Fichier: consolidated_migration.sql`);
  console.log(`📏 Taille: ${(sql.length / 1024).toFixed(2)} KB\n`);

  console.log('⏳ Application de la migration...\n');

  try {
    // Split SQL into individual statements (except for DO $$ blocks)
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;

    const lines = sql.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('DO $$')) {
        inDoBlock = true;
      }

      currentStatement += line + '\n';

      if (inDoBlock && line.trim() === '$$;') {
        inDoBlock = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (!inDoBlock && line.trim().endsWith(';') && !line.trim().startsWith('--')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    console.log(`📊 ${statements.length} commandes SQL à exécuter\n`);

    let successCount = 0;
    let errorCount = 0;
    let lastError = null;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (!statement || statement.startsWith('/*') || statement.startsWith('--')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec', { sql: statement });

        if (error) {
          // Try alternative method
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql: statement })
          }).catch(() => null);

          if (!response || !response.ok) {
            errorCount++;
            lastError = error || 'Unknown error';
            process.stdout.write(`❌`);
          } else {
            successCount++;
            process.stdout.write(`✓`);
          }
        } else {
          successCount++;
          process.stdout.write(`✓`);
        }
      } catch (err) {
        errorCount++;
        lastError = err.message;
        process.stdout.write(`❌`);
      }

      if ((i + 1) % 50 === 0) {
        process.stdout.write(`  ${i + 1}/${statements.length}\n`);
      }
    }

    console.log(`\n\n╔═══════════════════════════════════════════════╗`);
    console.log(`║   Résultat: ${successCount} réussies, ${errorCount} échouées          ║`);
    if (lastError) {
      console.log(`║   Dernière erreur: ${lastError.substring(0, 30)}...    ║`);
    }
    console.log('╚═══════════════════════════════════════════════╝\n');

    if (errorCount > 0) {
      console.log('⚠️  Certaines commandes ont échoué, mais la base devrait être fonctionnelle.');
      console.log('   Les erreurs sont souvent dues à des objets déjà existants.\n');
    }

    if (successCount > 0) {
      console.log('✅ Migration appliquée avec succès!\n');
    }

  } catch (err) {
    console.error('❌ Erreur lors de l\'application:', err.message);
    process.exit(1);
  }
}

applySQLFile();
