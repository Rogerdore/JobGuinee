# ARCHITECTURE GLOBALE SYSTÈME SEO - JOBGUINÉE
**Documentation Technique Complète**

Date : 26 décembre 2024
Version : 1.0
Audience : Développeurs, Architectes, Tech Leads

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des couches](#architecture-couches)
3. [Schéma base de données](#schema-database)
4. [Services et modules](#services-modules)
5. [Flux de données](#flux-donnees)
6. [Composants React](#composants-react)
7. [Hooks personnalisés](#hooks)
8. [Sécurité et RLS](#securite)
9. [Performance et optimisation](#performance)
10. [Intégrations externes](#integrations)
11. [Déploiement](#deploiement)
12. [Maintenance et monitoring](#maintenance)

---

## 🎯 VUE D'ENSEMBLE {#vue-densemble}

### Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
├─────────────────────────────────────────────────────────┤
│  Pages          │  Components     │  Hooks              │
│  ├─ AdminSEO    │  ├─ Tabs        │  ├─ useSEO         │
│  ├─ Home        │  └─ Forms       │  └─ useAnalytics   │
│  ├─ Jobs        │                 │                     │
│  └─ B2B         │                 │                     │
├─────────────────────────────────────────────────────────┤
│                   SERVICES LAYER                        │
├─────────────────────────────────────────────────────────┤
│  SEO Core              │  AI & Intelligence             │
│  ├─ seoService         │  ├─ seoSemanticAIService      │
│  ├─ schemaService      │  ├─ seoScoringService         │
│  ├─ sitemapService     │  └─ seoInternalLinkingService │
│  └─ seoAutoGenerator   │                                │
│                        │                                │
│  Analytics             │  External Linking              │
│  ├─ seoAnalyticsService│  ├─ seoExternalLinkingService │
│  └─ seoAuditService    │  └─ backlinksMonitoring       │
├─────────────────────────────────────────────────────────┤
│              BACKEND (Supabase PostgreSQL)              │
├─────────────────────────────────────────────────────────┤
│  Tables SEO            │  Tables Business               │
│  ├─ seo_config         │  ├─ jobs                      │
│  ├─ seo_page_meta      │  ├─ applications              │
│  ├─ seo_schemas        │  ├─ profiles                  │
│  ├─ seo_keywords       │  ├─ companies                 │
│  ├─ seo_internal_links │  ├─ formations                │
│  ├─ seo_backlinks      │  └─ b2b_leads                 │
│  └─ seo_audit_reports  │                                │
├─────────────────────────────────────────────────────────┤
│                  EXTERNAL SERVICES                      │
├─────────────────────────────────────────────────────────┤
│  Google Search Console │  Google Analytics 4           │
│  Schema.org Validator  │  Sitemap Generators           │
└─────────────────────────────────────────────────────────┘
```

### Principes architecturaux

1. **Separation of Concerns** : Services découplés, responsabilité unique
2. **DRY (Don't Repeat Yourself)** : Logique réutilisable dans services
3. **Database-First** : Toute configuration stockée en DB
4. **Type Safety** : TypeScript strict pour prévenir erreurs
5. **Security by Design** : RLS (Row Level Security) sur toutes tables
6. **Performance** : Lazy loading, indexation DB, caching stratégique

---

## 🏗️ ARCHITECTURE DES COUCHES {#architecture-couches}

### Couche 1 : Présentation (Frontend)

**Technologies** :
- React 18.3 (Hooks, Functional Components)
- TypeScript 5.5
- Tailwind CSS 3.4
- Vite 5.4 (Build tool)

**Responsabilités** :
- Affichage interfaces admin SEO
- Formulaires configuration
- Dashboards analytics
- Interaction utilisateur

**Structure** :
```
src/
├── pages/
│   ├── AdminSEO.tsx          # Page principale admin SEO
│   ├── Home.tsx               # Homepage (useSEO hook)
│   ├── Jobs.tsx               # Listings emplois
│   └── B2BSolutions.tsx       # Page B2B (schemas FAQ)
├── components/
│   └── (aucun spécifique SEO, tabs dans AdminSEO)
├── hooks/
│   └── useSEO.ts              # Hook React SEO dynamique
```

### Couche 2 : Logique métier (Services)

**Technologies** :
- TypeScript classes
- Async/await patterns
- Supabase client (@supabase/supabase-js 2.57)

**Responsabilités** :
- CRUD opérations SEO
- Génération automatique contenu
- Calculs scores et audits
- Intégration APIs externes

**Structure** :
```
src/services/
├── seoService.ts                      # Config & page meta (CORE)
├── schemaService.ts                   # JSON-LD schemas
├── sitemapService.ts                  # Sitemap XML
├── seoAutoGeneratorService.ts         # Générateur auto pages
├── seoSemanticAIService.ts            # IA contenu sémantique
├── seoScoringService.ts               # Audit & scoring
├── seoInternalLinkingService.ts       # Maillage interne
├── seoExternalLinkingService.ts       # Backlinks & netlinking
├── seoAnalyticsService.ts             # Analytics & metrics
└── seoAuditService.ts                 # Audit SEO complet
```

### Couche 3 : Données (Database)

**Technologies** :
- PostgreSQL 15+ (Supabase hosted)
- Row Level Security (RLS)
- Triggers & functions
- Indexes optimisés

**Responsabilités** :
- Stockage persistant config SEO
- Historique audits
- Tracking keywords
- Relations entités

**Structure** : Voir section [Schéma base de données](#schema-database)

### Couche 4 : Intégrations (External APIs)

**Services externes** :
- Google Search Console API (à venir)
- Google Analytics 4 API (à venir)
- Schema.org validators
- OpenAI API (IA sémantique, à venir)

---

## 💾 SCHÉMA BASE DE DONNÉES {#schema-database}

### Tables principales

#### `seo_config` (Configuration globale)

```sql
CREATE TABLE seo_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL,
  site_tagline text,
  default_title text NOT NULL,
  default_description text NOT NULL,
  default_keywords text[],
  site_url text NOT NULL,
  logo_url text,
  og_image text,
  twitter_handle text,
  facebook_page text,
  linkedin_page text,
  enable_indexation boolean DEFAULT true,
  robots_txt text,
  google_analytics_id text,
  google_site_verification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Cardinalité** : 1 seul enregistrement (singleton pattern)

**RLS** : Admins uniquement (read/write)

#### `seo_page_meta` (Meta tags par page)

```sql
CREATE TABLE seo_page_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL UNIQUE,
  page_type text NOT NULL, -- homepage, job_detail, blog_post, etc.
  title text NOT NULL,
  description text NOT NULL,
  keywords text[],
  og_title text,
  og_description text,
  og_image text,
  og_type text DEFAULT 'website',
  canonical_url text,
  robots text DEFAULT 'index, follow',
  priority numeric DEFAULT 0.5, -- sitemap priority 0.0-1.0
  change_freq text DEFAULT 'weekly', -- sitemap changefreq
  entity_type text, -- job, blog, formation (pour lier à entité)
  entity_id uuid, -- ID entité liée
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_seo_page_meta_path ON seo_page_meta(page_path);
CREATE INDEX idx_seo_page_meta_type ON seo_page_meta(page_type);
CREATE INDEX idx_seo_page_meta_entity ON seo_page_meta(entity_type, entity_id);
```

**Cardinalité** : 1 enregistrement par page unique

**RLS** : Admins write, public read (pour affichage meta)

#### `seo_schemas` (Schemas JSON-LD)

```sql
CREATE TABLE seo_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type text NOT NULL, -- JobPosting, Person, Course, FAQPage, etc.
  entity_type text NOT NULL, -- job, profile, formation, page
  entity_id uuid, -- ID entité (nullable pour schemas globaux)
  schema_json jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_seo_schemas_entity ON seo_schemas(entity_type, entity_id);
CREATE INDEX idx_seo_schemas_type ON seo_schemas(schema_type);
```

**Cardinalité** : N schemas par entité (ex: job peut avoir JobPosting + BreadcrumbList)

**RLS** : Admins write, public read

#### `seo_keywords` (Mots-clés suivis)

```sql
CREATE TABLE seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL UNIQUE,
  keyword_type text NOT NULL, -- primary, secondary, long_tail
  target_url text,
  search_volume int,
  difficulty text, -- low, medium, high
  intent text, -- informational, navigational, transactional, commercial
  country text DEFAULT 'GN',
  language text DEFAULT 'fr',
  is_tracked boolean DEFAULT true,
  current_rank int,
  previous_rank int,
  best_rank int,
  target_rank int,
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  ctr numeric DEFAULT 0,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_seo_keywords_tracked ON seo_keywords(is_tracked) WHERE is_tracked = true;
CREATE INDEX idx_seo_keywords_rank ON seo_keywords(current_rank);
```

**Cardinalité** : 1 enregistrement par keyword unique

**RLS** : Admins only

#### `seo_internal_links` (Maillage interne)

```sql
CREATE TABLE seo_internal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page text NOT NULL,
  target_page text NOT NULL,
  anchor_text text NOT NULL,
  link_type text, -- contextual, navigation, related, recommended
  relevance_score int DEFAULT 0, -- 0-100
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_internal_links_source ON seo_internal_links(source_page);
CREATE INDEX idx_internal_links_target ON seo_internal_links(target_page);
```

**RLS** : Admins only

#### `seo_backlinks` (Liens entrants)

```sql
CREATE TABLE seo_backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source_domain text NOT NULL,
  target_page text NOT NULL,
  anchor_text text,
  is_dofollow boolean DEFAULT true,
  quality_score int DEFAULT 50, -- 0-100
  status text DEFAULT 'active', -- active, lost, pending
  discovered_at timestamptz DEFAULT now(),
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_backlinks_domain ON seo_backlinks(source_domain);
CREATE INDEX idx_backlinks_status ON seo_backlinks(status);
```

**RLS** : Admins only

#### `seo_domains` (Domaines référents)

```sql
CREATE TABLE seo_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  domain_authority int DEFAULT 0, -- 0-100 (Moz DA)
  spam_score int DEFAULT 0, -- 0-100
  total_backlinks int DEFAULT 0,
  category text, -- excellent, good, average, poor, toxic
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**RLS** : Admins only

#### `seo_audit_reports` (Rapports d'audit)

```sql
CREATE TABLE seo_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score int NOT NULL DEFAULT 0,
  technical_score int NOT NULL DEFAULT 0,
  content_score int NOT NULL DEFAULT 0,
  semantic_score int NOT NULL DEFAULT 0,
  performance_score int NOT NULL DEFAULT 0,
  issues_count int NOT NULL DEFAULT 0,
  opportunities_count int NOT NULL DEFAULT 0,
  pages_analyzed int NOT NULL DEFAULT 0,
  audit_data jsonb, -- Détails complets audit
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_reports_date ON seo_audit_reports(created_at DESC);
```

**RLS** : Admins only

#### `seo_generation_logs` (Logs génération)

```sql
CREATE TABLE seo_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type text NOT NULL, -- all, jobs, sectors, cities
  pages_created int DEFAULT 0,
  pages_updated int DEFAULT 0,
  pages_failed int DEFAULT 0,
  total_pages int DEFAULT 0,
  duration_ms int,
  triggered_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending', -- pending, running, completed, failed
  details jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

**RLS** : Admins only

### Relations clés

```
seo_page_meta ────┬─> jobs (via entity_id où entity_type='job')
                  ├─> cms_content (via entity_id où entity_type='blog')
                  ├─> formations (via entity_id où entity_type='formation')
                  └─> (generic pages sans entity)

seo_schemas ──────┬─> jobs (via entity_id où entity_type='job')
                  ├─> profiles (via entity_id où entity_type='profile')
                  ├─> formations (via entity_id où entity_type='formation')
                  └─> (global schemas sans entity)

seo_keywords ─────> seo_page_meta (via target_url)

seo_internal_links ─> seo_page_meta (source_page & target_page)

seo_backlinks ────> seo_page_meta (via target_page)
                 └─> seo_domains (via source_domain)
```

---

## 🔧 SERVICES ET MODULES {#services-modules}

### `seoService.ts` (Core)

**Responsabilités** :
- CRUD configuration globale SEO
- CRUD meta tags par page
- Génération meta pour jobs, secteurs, villes
- Build meta tags complets (merge config + page)
- Injection meta dans DOM (document.head)

**Méthodes principales** :

```typescript
class SEOService {
  // Configuration
  async getConfig(): Promise<SEOConfig | null>
  async updateConfig(updates: Partial<SEOConfig>): Promise<boolean>

  // Page Meta
  async getPageMeta(pagePath: string): Promise<SEOPageMeta | null>
  async setPageMeta(pageMeta: Partial<SEOPageMeta>): Promise<boolean>
  async getAllPageMeta(): Promise<SEOPageMeta[]>

  // Générateurs
  async generateJobMeta(job: any): Promise<Partial<SEOPageMeta>>
  async generateSectorPageMeta(sector: string, jobCount: number): Promise<Partial<SEOPageMeta>>
  async generateCityPageMeta(city: string, jobCount: number): Promise<Partial<SEOPageMeta>>

  // Build & Injection
  buildMetaTags(pageMeta: SEOPageMeta | null, config: SEOConfig | null)
  updateDocumentHead(metaTags: ReturnType<typeof this.buildMetaTags>)
}
```

**Usage dans composants** :
```typescript
import { seoService } from '@/services/seoService';

// Dans composant ou hook
const config = await seoService.getConfig();
const pageMeta = await seoService.getPageMeta('/jobs');
const metaTags = seoService.buildMetaTags(pageMeta, config);
seoService.updateDocumentHead(metaTags);
```

### `schemaService.ts` (Schemas JSON-LD)

**Responsabilités** :
- Génération schemas Schema.org conformes
- CRUD schemas dans base
- Injection schemas dans DOM (<script type="application/ld+json">)

**Méthodes principales** :

```typescript
class SchemaService {
  // CRUD
  async getSchemas(entityType?: string, entityId?: string): Promise<SchemaData[]>
  async setSchema(schema: Partial<SchemaData>): Promise<boolean>

  // Générateurs
  generateJobPostingSchema(job: any)
  generatePersonSchema(profile: any)
  generateCourseSchema(formation: any)
  generateArticleSchema(post: any)
  generateBreadcrumbSchema(breadcrumbs: Array<{name: string; url: string}>)
  generateFAQSchema(faqs: Array<{question: string; answer: string}>)

  // Injection
  injectSchemas(schemas: SchemaData[])
}
```

**Exemple utilisation** :
```typescript
// Dans page B2B avec FAQ
const faqSchema = schemaService.generateFAQSchema([
  { question: "Qu'est-ce que l'externalisation RH ?", answer: "..." },
  { question: "Quel est le coût ?", answer: "..." }
]);

await schemaService.setSchema({
  schema_type: 'FAQPage',
  entity_type: 'page',
  entity_id: null,
  schema_json: faqSchema,
  is_active: true
});
```

### `seoAutoGeneratorService.ts` (Générateur automatique)

**Responsabilités** :
- Scanner base de données (jobs, blog, formations)
- Générer meta tags + schemas automatiquement
- Bulk insert/update dans seo_page_meta et seo_schemas

**Méthode principale** :

```typescript
class SEOAutoGeneratorService {
  async generateAll(): Promise<{
    total: number;
    jobs: { created: number; updated: number };
    sectors: { created: number; updated: number };
    cities: { created: number; updated: number };
    blog: { created: number; updated: number };
    formations: { created: number; updated: number };
  }>

  private async generateJobPages()
  private async generateSectorPages()
  private async generateCityPages()
  private async generateBlogPages()
  private async generateFormationPages()
}
```

**Logique génération** :
1. Fetch toutes entités depuis DB (jobs, cms_content, formations)
2. Pour chaque entité :
   - Générer meta via seoService.generateXxxMeta()
   - Générer schema via schemaService.generateXxxSchema()
   - Upsert dans seo_page_meta (si existe, update; sinon, insert)
   - Upsert dans seo_schemas
3. Return counts

### `seoAnalyticsService.ts` (Analytics)

**Responsabilités** :
- Agréger métriques SEO (sessions, impressions, clics)
- Calculer conversions (candidatures, leads B2B, premium)
- Compute ROI (revenus / investissement)
- Fournir top keywords, top pages, traffic sources

**Méthodes principales** :

```typescript
class SEOAnalyticsService {
  async getOverviewMetrics(period: '7days' | '30days' | '90days'): Promise<SEOMetrics>
  async getConversionMetrics(period: '7days' | '30days' | '90days'): Promise<ConversionMetrics>
  async getTopKeywords(limit: number): Promise<KeywordPerformance[]>
  async getTopPages(limit: number): Promise<PagePerformance[]>
  async getROIMetrics(period: 'month' | 'quarter' | 'year'): Promise<ROIMetrics>
  async getTrafficBySource(days: number): Promise<Array<{source: string; sessions: number; percentage: number}>>
  async getTrendData(metric: 'sessions' | 'impressions' | 'clicks' | 'conversions', days: number): Promise<Array<{date: string; value: number}>>

  // Formatters
  formatNumber(num: number): string
  formatCurrency(amount: number): string
  formatPercentage(value: number, decimals: number): string
}
```

**Source données** :
- **Actuellement** : Mixte réel (applications, b2b_leads) + mocked (sessions, impressions)
- **À venir** : Google Search Console API + Google Analytics 4 API

### Autres services

- **`seoScoringService.ts`** : Audit pages, calcul scores 0-100
- **`seoInternalLinkingService.ts`** : Génération suggestions maillage interne
- **`seoExternalLinkingService.ts`** : Gestion backlinks, domaines, opportunités
- **`seoSemanticAIService.ts`** : Génération contenu IA sémantique
- **`seoAuditService.ts`** : Audit SEO complet 4 dimensions
- **`sitemapService.ts`** : Génération sitemap XML dynamique

---

## 🔄 FLUX DE DONNÉES {#flux-donnees}

### Flux 1 : Affichage meta sur page publique

```
User visite /jobs
     ↓
React Router charge Jobs.tsx
     ↓
useEffect calls useSEO('/jobs')
     ↓
useSEO hook:
  ├─> seoService.getConfig()
  ├─> seoService.getPageMeta('/jobs')
  ├─> seoService.buildMetaTags(pageMeta, config)
  └─> seoService.updateDocumentHead(metaTags)
     ↓
Document <head> mis à jour avec:
  - <title>...</title>
  - <meta name="description" content="...">
  - <meta property="og:title" content="...">
  - <link rel="canonical" href="...">
     ↓
Google crawl page avec meta optimisés
```

### Flux 2 : Génération automatique pages SEO

```
Admin clique "Générer toutes les pages"
     ↓
AdminSEO.tsx calls generateAll()
     ↓
seoAutoGeneratorService.generateAll():
  ├─> Fetch jobs table
  │    ├─> Pour chaque job:
  │    │    ├─> seoService.generateJobMeta(job)
  │    │    ├─> schemaService.generateJobPostingSchema(job)
  │    │    ├─> Insert/Update seo_page_meta
  │    │    └─> Insert/Update seo_schemas
  │
  ├─> Extract unique sectors
  │    ├─> Pour chaque secteur:
  │    │    ├─> Count jobs in sector
  │    │    ├─> seoService.generateSectorPageMeta(sector, count)
  │    │    └─> Insert/Update seo_page_meta
  │
  ├─> Extract unique cities
  │    └─> (même logique)
  │
  ├─> Fetch cms_content (blog)
  │    └─> (même logique)
  │
  └─> Fetch formations
       └─> (même logique)
     ↓
Insert seo_generation_logs (audit trail)
     ↓
Return { total, jobs, sectors, cities, blog, formations }
     ↓
AdminSEO affiche message succès avec counts
```

### Flux 3 : Audit SEO page

```
Admin saisit '/job-detail/123' dans Scoring tab
     ↓
AdminSEO calls seoScoringService.auditPage('/job-detail/123')
     ↓
seoScoringService:
  ├─> Fetch seo_page_meta pour cette page
  ├─> Analyse technique:
  │    ├─> Title présent ? Longueur optimale ?
  │    ├─> Description présente ? Longueur optimale ?
  │    ├─> Canonical URL définie ?
  │    ├─> Robots tag correct ?
  │    └─> Score technical: 0-100
  │
  ├─> Analyse contenu:
  │    ├─> Keywords présents ?
  │    ├─> Densité keywords ?
  │    ├─> Meta description unique ?
  │    └─> Score content: 0-100
  │
  ├─> Analyse on-page:
  │    ├─> H1 présent ?
  │    ├─> Structure H2-H6 ?
  │    ├─> Liens internes ?
  │    └─> Score on-page: 0-100
  │
  └─> Analyse off-page:
       ├─> Backlinks count ?
       ├─> Domain authority ?
       └─> Score off-page: 0-100
     ↓
Calculate overall score (moyenne pondérée)
     ↓
Identify strengths & weaknesses
     ↓
Generate actionable recommendations (sorted by priority)
     ↓
Return AuditResult object
     ↓
AdminSEO displays:
  - Overall score with color coding
  - Category scores (bars)
  - Strengths list (green)
  - Weaknesses list (red)
  - Action items (priority badges)
```

### Flux 4 : Analytics dashboard

```
Admin ouvre onglet Analytics
     ↓
AnalyticsTab component mounts
     ↓
useEffect triggers loadAnalytics()
     ↓
Parallel fetch (Promise.all):
  ├─> seoAnalyticsService.getOverviewMetrics('30days')
  │    ├─> Query seo_page_meta (count pages indexed)
  │    ├─> Mock organic sessions, impressions, clicks (à venir: GSC API)
  │    └─> Calculate % changes vs previous period
  │
  ├─> seoAnalyticsService.getConversionMetrics('30days')
  │    ├─> Query applications table (count candidatures)
  │    ├─> Query b2b_leads table (count leads)
  │    ├─> Query premium_subscriptions (count upgrades)
  │    ├─> Estimate % from SEO (attribution model)
  │    └─> Calculate conversion rate
  │
  ├─> seoAnalyticsService.getTopKeywords(10)
  │    ├─> Query seo_keywords WHERE is_tracked = true
  │    ├─> Order by current_rank ASC
  │    ├─> Calculate position change (current - previous)
  │    └─> Determine trend (up/down/stable)
  │
  ├─> seoAnalyticsService.getTopPages(10)
  │    ├─> Query seo_page_meta ORDER BY priority DESC
  │    ├─> Mock sessions, bounce rate, conversion rate
  │    └─> Calculate SEO score per page
  │
  ├─> seoAnalyticsService.getROIMetrics('month')
  │    ├─> Query b2b_leads, premium_subscriptions
  │    ├─> Estimate revenue from SEO (leads × avg deal size × closing rate)
  │    ├─> Define SEO investment (fixed: 2M GNF/month)
  │    └─> Calculate ROI = revenue / investment
  │
  └─> seoAnalyticsService.getTrafficBySource(30)
       └─> Mock traffic sources distribution
     ↓
State updated (setMetrics, setConversions, etc.)
     ↓
Component re-renders with data
     ↓
Dashboard displays:
  - Metric cards with trend indicators (↗️↘️)
  - Top keywords table with position changes
  - Top pages with performance stats
  - ROI calculation with color coding
  - Traffic sources pie chart
```

---

## ⚛️ COMPOSANTS REACT {#composants-react}

### `AdminSEO.tsx` (Page principale)

**Structure** :
```typescript
export default function AdminSEO({ onNavigate }) {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [config, setConfig] = useState<SEOConfig | null>(null);
  const [pages, setPages] = useState<SEOPageMeta[]>([]);
  // ... autres states

  useEffect(() => {
    loadData(); // Charge données selon activeTab
  }, [activeTab]);

  // 12 fonctions de sous-composants (tabs)
  return (
    <AdminLayout>
      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'config' && <ConfigTab ... />}
      {activeTab === 'pages' && <PagesTab ... />}
      {activeTab === 'keywords' && <KeywordsTab ... />}
      {/* ... 9 autres tabs ... */}
    </AdminLayout>
  );
}

// Sous-composants inline (un par tab)
function ConfigTab({ config, setConfig, onSave, saving }: any) { ... }
function PagesTab({ pages, onRefresh }: any) { ... }
function KeywordsTab({ keywords, onRefresh }: any) { ... }
function GeneratorTab({ onGenerateAll, loading }: any) { ... }
function SitemapTab({ stats, onDownload, onRefresh }: any) { ... }
function AIContentTab() { ... }
function ScoringTab() { ... }
function InternalLinksTab() { ... }
function ExternalLinksTab() { ... }
function QuickWinsTab() { ... }
function AnalyticsTab() { ... }
function LogsTab({ logs, onRefresh }: any) { ... }
```

**Pattern** : Single Page Component avec tabs, pas de routing interne

### Pages publiques utilisant SEO

#### `Home.tsx`

```typescript
import { useSEO } from '@/hooks/useSEO';

export default function Home() {
  useSEO({
    title: 'JobGuinée - Plateforme N°1 de l\'Emploi en Guinée',
    description: 'Trouvez votre emploi idéal en Guinée. Milliers d\'offres, CV IA, formations. Recruteurs, gérez vos candidatures efficacement.',
    keywords: ['emploi guinée', 'job conakry', 'recrutement guinée'],
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'JobGuinée',
        // ... Organization schema complet
      }
    ]
  });

  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

#### `B2BSolutions.tsx`

```typescript
import { useSEO } from '@/hooks/useSEO';
import { schemaService } from '@/services/schemaService';

export default function B2BSolutions() {
  const faqItems = [
    { question: "Qu'est-ce que l'externalisation ?", answer: "..." },
    // ... 5 FAQs
  ];

  useSEO({
    title: 'Solutions B2B RH en Guinée | Recrutement, Externalisation & IA',
    description: 'Solutions RH B2B complètes pour entreprises guinéennes...',
    keywords: ['solutions b2b rh guinée', 'externalisation recrutement', ...],
    schemas: [
      schemaService.generateFAQSchema(faqItems),
      // Organization schema, Service schema
    ]
  });

  return (
    <div>
      {/* B2B content with FAQ section */}
    </div>
  );
}
```

#### `Jobs.tsx`

```typescript
export default function Jobs() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sector = searchParams.get('sector');
  const city = searchParams.get('location');

  // Dynamic SEO based on filters
  useSEO({
    title: sector
      ? `Emplois ${sector} en Guinée | JobGuinée`
      : city
      ? `Emplois à ${city} | JobGuinée`
      : 'Offres d\'Emploi en Guinée | JobGuinée',
    // ... description, keywords adaptés
  });

  return (
    <div>
      {/* Job listings */}
    </div>
  );
}
```

---

## 🎣 HOOKS PERSONNALISÉS {#hooks}

### `useSEO` Hook

**Fichier** : `src/hooks/useSEO.ts`

**Interface** :
```typescript
interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  schemas?: any[]; // Array of Schema.org objects
}

export function useSEO(props: SEOProps): void
```

**Implémentation** :
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoService } from '@/services/seoService';
import { schemaService } from '@/services/schemaService';

export function useSEO(props: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    const updateSEO = async () => {
      // 1. Fetch config globale
      const config = await seoService.getConfig();

      // 2. Fetch page meta (si existe)
      const pageMeta = await seoService.getPageMeta(location.pathname);

      // 3. Merge props > pageMeta > config (priorité)
      const finalTitle = props.title || pageMeta?.title || config?.default_title;
      const finalDescription = props.description || pageMeta?.description || config?.default_description;
      // ... idem pour autres champs

      // 4. Build meta tags
      const metaTags = {
        title: finalTitle,
        description: finalDescription,
        keywords: [...(props.keywords || []), ...(config?.default_keywords || [])].join(', '),
        ogTitle: props.ogTitle || finalTitle,
        ogDescription: props.ogDescription || finalDescription,
        ogImage: props.ogImage || config?.og_image,
        ogType: props.ogType || 'website',
        canonicalUrl: props.canonicalUrl || `${config?.site_url}${location.pathname}`,
        robots: config?.enable_indexation ? 'index, follow' : 'noindex, nofollow'
      };

      // 5. Inject dans DOM
      seoService.updateDocumentHead(metaTags);

      // 6. Inject schemas (si fournis)
      if (props.schemas && props.schemas.length > 0) {
        schemaService.injectSchemas(
          props.schemas.map(schema => ({
            id: crypto.randomUUID(),
            schema_type: schema['@type'],
            entity_type: 'page',
            entity_id: null,
            schema_json: schema,
            is_active: true
          }))
        );
      }
    };

    updateSEO();
  }, [location.pathname, JSON.stringify(props)]);
}
```

**Avantages** :
- Déclaratif : Props SEO dans composant
- Automatique : Merge config + page meta + props
- Réactif : Re-run si route change
- Type-safe : TypeScript interfaces

---

## 🔒 SÉCURITÉ ET RLS {#securite}

### Row Level Security (RLS)

**Toutes les tables SEO** ont RLS activé :

```sql
ALTER TABLE seo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_page_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_schemas ENABLE ROW LEVEL SECURITY;
-- ... etc pour toutes tables
```

### Policies standard

#### Admins full access

```sql
CREATE POLICY "Admins can do anything on seo_config"
  ON seo_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
```

**Appliqué sur** : seo_config, seo_keywords, seo_internal_links, seo_backlinks, seo_domains, seo_audit_reports, seo_generation_logs

#### Public read, admin write

```sql
-- Read policy (public)
CREATE POLICY "Anyone can read active page meta"
  ON seo_page_meta
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Write policy (admin only)
CREATE POLICY "Admins can write page meta"
  ON seo_page_meta
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
```

**Appliqué sur** : seo_page_meta, seo_schemas (besoin lecture publique pour affichage)

### Validation input

**Frontend** :
```typescript
// Validation title length
if (title.length < 50 || title.length > 60) {
  showWarning('Title devrait faire 50-60 caractères');
}

// Validation description length
if (description.length < 150 || description.length > 165) {
  showWarning('Description devrait faire 150-165 caractères');
}

// Sanitization keywords
const sanitizedKeywords = keywords
  .map(kw => kw.trim().toLowerCase())
  .filter(kw => kw.length > 0 && kw.length < 100);
```

**Backend (DB constraints)** :
```sql
ALTER TABLE seo_page_meta
ADD CONSTRAINT check_title_length CHECK (length(title) BETWEEN 10 AND 200),
ADD CONSTRAINT check_description_length CHECK (length(description) BETWEEN 50 AND 500);
```

### Protection injection SQL

**Supabase client** : Utilise prepared statements automatiquement

```typescript
// SAFE (parameterized)
await supabase
  .from('seo_page_meta')
  .select('*')
  .eq('page_path', userInput); // userInput échappé automatiquement

// JAMAIS FAIRE (raw SQL avec concat)
// await supabase.rpc('raw_query', { sql: `SELECT * FROM seo_page_meta WHERE page_path = '${userInput}'` });
```

---

## ⚡ PERFORMANCE ET OPTIMISATION {#performance}

### Indexation base de données

**Indexes créés** :
```sql
-- seo_page_meta
CREATE INDEX idx_seo_page_meta_path ON seo_page_meta(page_path);
CREATE INDEX idx_seo_page_meta_type ON seo_page_meta(page_type);
CREATE INDEX idx_seo_page_meta_entity ON seo_page_meta(entity_type, entity_id);
CREATE INDEX idx_seo_page_meta_active ON seo_page_meta(is_active) WHERE is_active = true;

-- seo_keywords
CREATE INDEX idx_seo_keywords_tracked ON seo_keywords(is_tracked) WHERE is_tracked = true;
CREATE INDEX idx_seo_keywords_rank ON seo_keywords(current_rank);

-- seo_internal_links
CREATE INDEX idx_internal_links_source ON seo_internal_links(source_page);
CREATE INDEX idx_internal_links_target ON seo_internal_links(target_page);

-- seo_backlinks
CREATE INDEX idx_backlinks_domain ON seo_backlinks(source_domain);
CREATE INDEX idx_backlinks_status ON seo_backlinks(status);

-- seo_audit_reports
CREATE INDEX idx_audit_reports_date ON seo_audit_reports(created_at DESC);
```

**Impact** : Queries < 50ms même avec milliers de pages

### Caching stratégies

**Config SEO** :
- Lecture fréquente, écriture rare
- Cache in-memory (à implémenter) :
```typescript
let cachedConfig: SEOConfig | null = null;
let cacheExpiry: number = 0;

async getConfig(): Promise<SEOConfig | null> {
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig;
  }

  const config = await supabase.from('seo_config').select('*').single();
  cachedConfig = config.data;
  cacheExpiry = Date.now() + 300000; // 5 min cache
  return cachedConfig;
}
```

**Page Meta** :
- Lecture modérée, écriture modérée
- Pas de cache (données doivent être fresh pour SEO)

### Lazy loading

**AdminSEO tabs** : Chargement lazy des données par tab

```typescript
useEffect(() => {
  loadData(); // Load only active tab data
}, [activeTab]);

const loadData = async () => {
  setLoading(true);
  if (activeTab === 'config') {
    const data = await seoService.getConfig();
    setConfig(data);
  } else if (activeTab === 'pages') {
    const data = await seoService.getAllPageMeta();
    setPages(data);
  }
  // ... etc
  setLoading(false);
};
```

**Résultat** : Pas de surcharge initiale, load progressif

### Pagination (à implémenter)

**Pour tables volumineuses** (ex: seo_page_meta avec 10,000+ pages) :

```typescript
async getAllPageMeta(page: number = 1, pageSize: number = 50): Promise<{ data: SEOPageMeta[]; total: number }> {
  const { data, error, count } = await supabase
    .from('seo_page_meta')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  return { data: data || [], total: count || 0 };
}
```

---

## 🌐 INTÉGRATIONS EXTERNES {#integrations}

### Google Search Console (À implémenter)

**Objectif** : Récupérer données réelles (impressions, clics, positions)

**API** : [Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original)

**Flow** :
1. Créer projet Google Cloud
2. Activer Search Console API
3. OAuth 2.0 credentials
4. Implémenter auth flow dans admin
5. Query performance data :
```typescript
async function fetchSearchConsoleData(startDate: string, endDate: string) {
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent('sc-domain:jobguinee.com')}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: 1000
      })
    }
  );

  const data = await response.json();
  // Process data.rows
  // Update seo_keywords table with real positions
}
```

**Fréquence sync** : Quotidien (cron job)

### Google Analytics 4 (À implémenter)

**Objectif** : Tracking sessions, conversions, comportement

**Setup** :
1. Créer propriété GA4
2. Installer gtag.js :
```html
<!-- Dans index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

3. Configurer événements :
```typescript
// Dans JobApplicationModal après soumission
gtag('event', 'job_application_completed', {
  job_id: job.id,
  job_title: job.title,
  source: 'organic_search' // si provient SEO
});

// Dans B2BLeadForm après soumission
gtag('event', 'generate_lead', {
  value: 1500000, // Estimated deal value
  currency: 'GNF',
  form_type: 'b2b_demo_request'
});
```

4. Query GA4 Data API pour analytics dashboard :
```typescript
async function fetchGA4Sessions(startDate: string, endDate: string) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagementRate' },
          { name: 'conversions' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionSource',
            stringFilter: { value: 'google', matchType: 'EXACT' }
          }
        }
      })
    }
  );

  const data = await response.json();
  // Process data.rows
}
```

### Schema.org Validator

**Outil** : [Rich Results Test](https://search.google.com/test/rich-results)

**Usage** : Valider schemas générés

**Automatisation** (à implémenter) :
```typescript
async function validateSchema(url: string) {
  const response = await fetch(
    `https://search.google.com/test/rich-results/api`,
    {
      method: 'POST',
      body: JSON.stringify({ url })
    }
  );

  const result = await response.json();
  if (result.errors.length > 0) {
    console.error('Schema validation errors:', result.errors);
  }
  return result;
}
```

---

## 🚀 DÉPLOIEMENT {#deploiement}

### Environnements

#### **Development**
- URL : http://localhost:5173
- Supabase : Projet dev
- `enable_indexation = false`
- Google Analytics : Disabled
- Données : Test data

#### **Staging**
- URL : https://staging.jobguinee.com
- Supabase : Projet staging
- `enable_indexation = false` (IMPORTANT)
- Google Analytics : Test property
- Données : Clone production

#### **Production**
- URL : https://jobguinee.com
- Supabase : Projet production
- `enable_indexation = true`
- Google Analytics : Production property
- Données : Real data

### Build & Deployment

**Build production** :
```bash
npm run build
```

**Output** : `dist/` directory

**Vérifications pré-deploy** :
```bash
# 1. TypeScript check
npm run typecheck

# 2. Linting
npm run lint

# 3. Build
npm run build

# 4. Preview build
npm run preview
```

**Deploy (exemple Netlify)** :
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Deploy (exemple Vercel)** :
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Variables d'environnement

**Fichier** : `.env`

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_ENVIRONMENT=production
```

**Sécurité** :
- `.env` dans `.gitignore` (JAMAIS commit)
- Variables définies dans hébergeur (Netlify/Vercel env vars)

### Post-deployment checks

1. **SEO Config**
   ```sql
   SELECT enable_indexation FROM seo_config;
   -- MUST be true in production
   ```

2. **Sitemap accessible**
   - Visiter https://jobguinee.com/sitemap.xml
   - Vérifier XML valide, URLs correctes

3. **Meta tags**
   - View source homepage
   - Vérifier présence : title, description, og:tags, canonical

4. **Schemas JSON-LD**
   - View source page job
   - Vérifier `<script type="application/ld+json">` présent

5. **Google Search Console**
   - Soumettre sitemap
   - Vérifier indexation (attendre 48h)

6. **Google Analytics**
   - Visiter site
   - Vérifier tracking fonctionnel (Real-Time reports)

---

## 🔧 MAINTENANCE ET MONITORING {#maintenance}

### Monitoring quotidien

**Automatisé (cron jobs recommandés)** :

1. **Sync Google Search Console** (1x/jour)
   ```typescript
   // Cron : 2h du matin
   async function dailySyncGSC() {
     const yesterday = new Date(Date.now() - 86400000);
     const data = await fetchSearchConsoleData(
       yesterday.toISOString().split('T')[0],
       yesterday.toISOString().split('T')[0]
     );

     // Update seo_keywords table
     for (const row of data.rows) {
       await supabase
         .from('seo_keywords')
         .upsert({
           keyword: row.keys[0],
           impressions: row.impressions,
           clicks: row.clicks,
           ctr: row.ctr,
           current_rank: row.position,
           last_checked_at: new Date().toISOString()
         });
     }
   }
   ```

2. **Génération automatique nouvelles pages** (1x/jour)
   ```typescript
   // Cron : 3h du matin
   async function dailyGeneration() {
     const result = await seoAutoGeneratorService.generateAll();
     console.log(`Generated ${result.total} pages`);

     // Alert si erreurs
     if (result.total === 0) {
       sendAlert('SEO generation failed');
     }
   }
   ```

3. **Audit pages stratégiques** (1x/semaine)
   ```typescript
   // Cron : Dimanche 4h du matin
   async function weeklyAudit() {
     const criticalPages = [
       '/',
       '/jobs',
       '/b2b-solutions',
       '/cvtheque',
       '/formations'
     ];

     for (const page of criticalPages) {
       const audit = await seoScoringService.auditPage(page);
       if (audit.score.overall < 70) {
         sendAlert(`SEO score for ${page} is low: ${audit.score.overall}`);
       }
     }
   }
   ```

### Monitoring manuel (hebdomadaire)

**Checklist administrateur** :

- [ ] Vérifier Analytics tab : Sessions, conversions, ROI
- [ ] Consulter Quick Wins : Implémenter top 3
- [ ] Vérifier Logs : Aucune erreur génération
- [ ] Top Keywords : Positions évoluent positivement ?
- [ ] Pages Indexées : Croissance continue ?

### Alertes critiques

**Conditions déclenchement** :

1. **Score SEO global < 60**
   - Action : Audit complet immédiat
   - Priorité : CRITICAL

2. **Pages orphelines > 10**
   - Action : Build réseau maillage interne
   - Priorité : HIGH

3. **Génération échoue 3 jours consécutifs**
   - Action : Debug seoAutoGeneratorService
   - Priorité : CRITICAL

4. **Backlinks toxiques > 50**
   - Action : Télécharger disavow file, soumettre Google
   - Priorité : HIGH

5. **Trafic organique -50% vs semaine précédente**
   - Action : Vérifier Google penalty, audit technique
   - Priorité : CRITICAL

### Maintenance trimestrielle

**Actions planifiées** :

1. **Audit SEO complet**
   - Toutes les pages clés
   - Rapport évolution scores
   - Mise à jour stratégie

2. **Revue keywords**
   - Retirer keywords non performants
   - Ajouter nouveaux keywords émergents
   - Ajuster tracking

3. **Backlinks cleanup**
   - Review nouveaux backlinks
   - Désavouer toxiques
   - Contacter opportunités identifiées

4. **Content refresh**
   - Mettre à jour articles blog > 6 mois
   - Re-générer meta si offres changées
   - Actualiser FAQs

5. **Performance audit**
   - Vérifier temps chargement pages
   - Optimiser images lourdes
   - Review Core Web Vitals

---

## 📚 RÉFÉRENCES & RESSOURCES

### Documentation interne

- `SEO_AUDIT_REPORT.md` : Méthodologie audit
- `SEO_ROADMAP_6_MONTHS.md` : Roadmap implémentation
- `KEYWORD_STRATEGY_GUINEA_AFRICA.md` : Stratégie mots-clés
- `SEO_CONVERSION_STRATEGY.md` : Optimisation conversion
- `SEO_ADMIN_GUIDE.md` : Guide utilisateur admin

### Standards & Spécifications

- [Schema.org](https://schema.org) : Référence schemas
- [OpenGraph Protocol](https://ogp.me) : Spécification OG tags
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards) : Spécification Twitter meta
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html) : Format sitemap XML

### Outils externes

- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics 4](https://analytics.google.com)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Validator](https://validator.schema.org)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) : Audit performance

### APIs

- [Google Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original)
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Document créé par : JobGuinée Tech Team**
**Dernière mise à jour : 26 décembre 2024**
**Version : 1.0**

🚀 **Happy SEO Coding!**
