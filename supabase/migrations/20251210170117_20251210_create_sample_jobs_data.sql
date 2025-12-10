/*
  # Create sample jobs and companies

  1. New Data
    - Create sample companies
    - Create sample published jobs for testing

  2. Purpose
    - Provide test data to verify job listing functionality
*/

-- Insert sample companies
INSERT INTO public.companies (profile_id, name, description, logo_url, website, industry, size, location, created_at)
VALUES 
  ('ae429d0e-416f-40ed-92cb-5bf8b272a589'::uuid, 'Tech Solutions Guinea', 'Cabinet de consulting en technologie', NULL, 'https://techsolutions.gn', 'Informatique', 'PME', 'Conakry', now()),
  ('ae429d0e-416f-40ed-92cb-5bf8b272a589'::uuid, 'Global Services', 'Entreprise de services', NULL, 'https://globalservices.gn', 'Services', 'ETI', 'Kindia', now()),
  ('ae429d0e-416f-40ed-92cb-5bf8b272a589'::uuid, 'Africa Digital', 'Agence digitale', NULL, 'https://africadigital.gn', 'Marketing', 'PME', 'Conakry', now());

-- Get company IDs and insert jobs
INSERT INTO public.jobs (user_id, company_id, title, description, location, contract_type, salary_min, salary_max, status, created_at, updated_at)
SELECT 
  'ae429d0e-416f-40ed-92cb-5bf8b272a589'::uuid,
  id,
  title,
  description,
  location,
  contract_type,
  salary_min,
  salary_max,
  'published',
  now(),
  now()
FROM (
  VALUES
    ((1), 'Développeur Full Stack', 'Nous recherchons un développeur full stack expérimenté avec React et Node.js', 'Conakry', 'CDI', 5000000::numeric, 8000000::numeric),
    ((2), 'Chef de Projet IT', 'Management de projet informatique, supervision d''équipe', 'Kindia', 'CDI', 6000000::numeric, 9000000::numeric),
    ((3), 'Spécialiste Marketing Digital', 'Stratégie marketing digital, SEO, gestion des réseaux sociaux', 'Conakry', 'CDD', 4000000::numeric, 6000000::numeric),
    ((1), 'Analyste de Données', 'Analyse données, BI, reporting', 'À distance', 'CDI', 5500000::numeric, 8500000::numeric)
) AS jobs_data(company_order, title, description, location, contract_type, salary_min, salary_max)
INNER JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as company_order
  FROM public.companies
  WHERE profile_id = 'ae429d0e-416f-40ed-92cb-5bf8b272a589'::uuid
  LIMIT 3
) companies ON companies.company_order = jobs_data.company_order;
