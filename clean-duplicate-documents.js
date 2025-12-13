import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function cleanDuplicateDocuments() {
  console.log('🔍 Recherche des documents en double...\n');

  const { data: allDocs, error } = await supabase
    .from('candidate_documents')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  const seenUrls = new Map();
  const duplicates = [];

  for (const doc of allDocs) {
    const key = `${doc.candidate_id}-${doc.file_url}`;

    if (seenUrls.has(key)) {
      duplicates.push(doc.id);
      console.log(`❌ Doublon détecté: ${doc.file_name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Source: ${doc.document_source}`);
      console.log(`   Créé: ${doc.created_at}\n`);
    } else {
      seenUrls.set(key, doc);
      console.log(`✅ Original conservé: ${doc.file_name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Source: ${doc.document_source}\n`);
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ Aucun doublon trouvé !');
    return;
  }

  console.log(`\n📊 Total doublons: ${duplicates.length}`);
  console.log('🗑️  Suppression des doublons...\n');

  const { error: deleteError } = await supabase
    .from('candidate_documents')
    .delete()
    .in('id', duplicates);

  if (deleteError) {
    console.error('❌ Erreur lors de la suppression:', deleteError);
    return;
  }

  console.log(`✅ ${duplicates.length} document(s) en double supprimé(s) !`);

  const { data: remaining } = await supabase
    .from('candidate_documents')
    .select('id')
    .eq('candidate_id', allDocs[0]?.candidate_id);

  console.log(`\n📄 Documents restants: ${remaining?.length || 0}`);
}

cleanDuplicateDocuments();
