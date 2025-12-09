import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quzvxbmwgpglezswvqxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1enZ4Ym13Z3BnbGV6c3d2cXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODg5MzksImV4cCI6MjA4MDg2NDkzOX0.baZnbDYGKqA5JL-Cbm5qORpTsRUnmw6WZ5KA_1wHT88';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('Création d\'un compte candidat de test...');

  const { data, error } = await supabase.auth.signUp({
    email: 'candidat2@gmail.com',
    password: 'password123',
    options: {
      data: {
        user_type: 'candidate',
        full_name: 'Candidat Test'
      }
    }
  });

  if (error) {
    console.error('Erreur lors de la création du compte:', error.message);
    return;
  }

  console.log('✅ Compte créé avec succès!');
  console.log('Email: candidat2@gmail.com');
  console.log('Mot de passe: password123');
  console.log('Type: Candidat');
}

createTestUser();
