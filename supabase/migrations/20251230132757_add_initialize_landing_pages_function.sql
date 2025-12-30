-- Function to initialize default landing pages (admin use only)
CREATE OR REPLACE FUNCTION initialize_default_landing_pages()
RETURNS TABLE (
  pages_created int,
  pages_updated int,
  total_pages int
) AS $$
DECLARE
  v_pages_created int := 0;
  v_pages_updated int := 0;
  v_total int := 0;
BEGIN
  -- This function bypasses RLS to initialize landing pages
  -- It should only be called by admins

  -- Insert all default pages using upsert
  INSERT INTO seo_landing_pages (
    page_type, slug, title, meta_description, keywords, h1, introduction,
    profession_name, sector_name, city_name, level_name,
    primary_cta, secondary_cta, is_active, schema_org
  ) VALUES
  -- Professions
  ('job_by_profession', 'emplois/developpeur-informatique-guinee', 'Emplois Développeur Informatique en Guinée | Offres Recrutement Développeur Informatique Conakry', 'Trouvez des offres d''emploi Développeur Informatique en Guinée. Postulez aux meilleures opportunités Développeur Informatique à Conakry et dans toute la Guinée. JobGuinée, leader du recrutement.', 'emploi developpeur-informatique guinée, recrutement developpeur-informatique conakry, offre developpeur-informatique, job developpeur-informatique guinée', 'Emplois Développeur Informatique en Guinée', 'Découvrez toutes les offres d''emploi pour Développeur Informatique en Guinée. JobGuinée vous connecte aux meilleures opportunités professionnelles dans le secteur.', 'Développeur Informatique', NULL, NULL, NULL, 'Confier un recrutement Développeur Informatique', 'Voir les offres Développeur Informatique', true, '{"@context":"https://schema.org","@type":"CollectionPage"}'::jsonb),
  ('job_by_profession', 'emplois/comptable-guinee', 'Emplois Comptable en Guinée | Offres Recrutement Comptable Conakry', 'Trouvez des offres d''emploi Comptable en Guinée. Postulez aux meilleures opportunités Comptable à Conakry et dans toute la Guinée. JobGuinée, leader du recrutement.', 'emploi comptable guinée, recrutement comptable conakry, offre comptable, job comptable guinée', 'Emplois Comptable en Guinée', 'Découvrez toutes les offres d''emploi pour Comptable en Guinée. JobGuinée vous connecte aux meilleures opportunités professionnelles dans le secteur.', 'Comptable', NULL, NULL, NULL, 'Confier un recrutement Comptable', 'Voir les offres Comptable', true, '{"@context":"https://schema.org","@type":"CollectionPage"}'::jsonb),
  ('job_by_profession', 'emplois/ingenieur-mines-guinee', 'Emplois Ingénieur Mines en Guinée | Offres Recrutement Ingénieur Mines Conakry', 'Trouvez des offres d''emploi Ingénieur Mines en Guinée. Postulez aux meilleures opportunités Ingénieur Mines à Conakry et dans toute la Guinée. JobGuinée, leader du recrutement.', 'emploi ingenieur-mines guinée, recrutement ingenieur-mines conakry, offre ingenieur-mines, job ingenieur-mines guinée', 'Emplois Ingénieur Mines en Guinée', 'Découvrez toutes les offres d''emploi pour Ingénieur Mines en Guinée. JobGuinée vous connecte aux meilleures opportunités professionnelles dans le secteur.', 'Ingénieur Mines', NULL, NULL, NULL, 'Confier un recrutement Ingénieur Mines', 'Voir les offres Ingénieur Mines', true, '{"@context":"https://schema.org","@type":"CollectionPage"}'::jsonb),
  
  -- Secteurs
  ('job_by_sector', 'emplois/secteur/mines-guinee', 'Emplois Mines en Guinée | Recrutement Secteur Mines Conakry', 'Offres d''emploi dans le secteur Mines en Guinée. Recrutement Mines à Conakry et dans toute la Guinée. Postulez maintenant sur JobGuinée.', 'emploi mines guinée, recrutement mines, job mines conakry, carrière mines', 'Emplois Secteur Mines en Guinée', 'Explorez les opportunités d''emploi dans le secteur Mines en Guinée. Trouvez votre prochain job dans une entreprise leader du secteur.', NULL, 'Mines', NULL, NULL, 'Externaliser recrutement Mines', 'Voir offres Mines', true, '{"@context":"https://schema.org","@type":"CollectionPage"}'::jsonb),
  ('job_by_sector', 'emplois/secteur/btp-guinee', 'Emplois BTP en Guinée | Recrutement Secteur BTP Conakry', 'Offres d''emploi dans le secteur BTP en Guinée. Recrutement BTP à Conakry et dans toute la Guinée. Postulez maintenant sur JobGuinée.', 'emploi btp guinée, recrutement btp, job btp conakry, carrière btp', 'Emplois Secteur BTP en Guinée', 'Explorez les opportunités d''emploi dans le secteur BTP en Guinée. Trouvez votre prochain job dans une entreprise leader du secteur.', NULL, 'BTP', NULL, NULL, 'Externaliser recrutement BTP', 'Voir offres BTP', true, '{"@context":"https://schema.org","@type":"CollectionPage"}'::jsonb),
  
  -- Villes
  ('job_by_city', 'emplois/conakry', 'Emplois à Conakry Guinée | Offres Recrutement Conakry', 'Trouvez un emploi à Conakry, capitale économique de Guinée. Offres d''emploi actualisées quotidiennement. Recrutement local Conakry.', 'emploi conakry, recrutement conakry, job conakry guinée, offre conakry', 'Emplois à Conakry, Guinée', 'Découvrez les opportunités d''emploi à Conakry, capitale économique de Guinée. JobGuinée facilite votre recherche d''emploi local.', NULL, NULL, 'Conakry', NULL, 'Recruter à Conakry', 'Voir offres Conakry', true, '{"@context":"https://schema.org","@type":"Place"}'::jsonb),
  
  -- Niveaux
  ('job_by_level', 'emplois/junior-guinee', 'Emplois Junior en Guinée | Offres 0-3 ans d''expérience', 'Offres d''emploi niveau Junior en Guinée. 0-3 ans d''expérience. Trouvez votre opportunité professionnelle adaptée à votre niveau d''expérience.', 'emploi junior guinée, recrutement junior, job junior, offre junior conakry', 'Emplois Niveau Junior en Guinée', 'Parcourez les offres d''emploi pour profils Junior en Guinée. 0-3 ans d''expérience. Postulez aux opportunités correspondant à votre expérience.', NULL, NULL, NULL, 'Junior', 'Recruter profil Junior', 'Voir offres Junior', true, '{"@context":"https://schema.org","@type":"CollectionPage"}'::jsonb)
  
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    meta_description = EXCLUDED.meta_description,
    keywords = EXCLUDED.keywords,
    updated_at = now();

  GET DIAGNOSTICS v_total = ROW_COUNT;
  
  RETURN QUERY SELECT 0::int, v_total, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to call this function
GRANT EXECUTE ON FUNCTION initialize_default_landing_pages() TO authenticated;
