# Social Sharing Engine - Quick Start Guide

## 🚀 Démarrage Rapide

### 1. Vérifier que tout fonctionne

```bash
# Build
npm run build

# La migration Supabase a été appliquée automatiquement
```

### 2. Accéder au Dashboard

```
URL : https://jobguinee-pro.com/admin/social-analytics
ou via le menu Admin → Analytics Sociaux
```

### 3. Partager une offre

#### Pour les Candidats/Utilisateurs
```
1. Voir une offre d'emploi
2. Cliquer sur "Partager"
3. Choisir un réseau (Facebook, LinkedIn, Twitter, WhatsApp)
4. Le lien partagé contient : ?src=facebook
5. Automatiquement trackable
```

#### Lien Direct de Partage
```
https://jobguinee-pro.com/s/{job_id}?src=facebook
```

---

## 📊 Visualiser les Analytics

### Dashboard Admin

**URL:** `/admin/social-analytics`

**Affiche :**
- Total Shares
- Total Clicks
- Global CTR (Click-Through Rate)
- Offres Actives

**Graphiques :**
- Distribution clics par réseau social
- Offres avec/sans engagement

**Tableaux :**
- Top 5 offres partagées
- Top 5 offres par CTR
- Détails complets (20 offres)

---

## 🔍 API Services

### Tracker un clic manuellement

```typescript
import { jobClickTrackingService } from '@/services/jobClickTrackingService';

await jobClickTrackingService.trackJobClick({
  jobId: 'uuid-123',
  sourceNetwork: 'facebook'
});
```

### Récupérer les stats d'une offre

```typescript
const stats = await jobClickTrackingService.getJobClickStats('job-id');
// Retourne : [{ sourceNetwork: 'facebook', clickCount: 42, lastClickedAt: '...' }]
```

### Récupérer les stats globales

```typescript
const globalStats = await jobClickTrackingService.getGlobalSocialStats(20);
// Retourne : [{
//   jobId, jobTitle, companyName, totalShares, totalClicks, ctr,
//   facebookClicks, linkedinClicks, twitterClicks, whatsappClicks
// }]
```

---

## 🎯 Réseaux Supportés

| Réseau | Paramètre | Status |
|--------|-----------|--------|
| Facebook | `facebook` | ✅ |
| LinkedIn | `linkedin` | ✅ |
| Twitter | `twitter` | ✅ |
| WhatsApp | `whatsapp` | ✅ |
| Instagram | `instagram` | ✅ |
| Telegram | `telegram` | ✅ |

---

## 💾 Bases de Données

### Table `job_clicks`

```sql
-- Voir tous les clics d'une offre
SELECT * FROM job_clicks WHERE job_id = 'uuid-123';

-- Stats par réseau
SELECT source_network, COUNT(*) as count
FROM job_clicks
WHERE job_id = 'uuid-123'
GROUP BY source_network;

-- Clics par jour
SELECT DATE(clicked_at) as date, COUNT(*) as count
FROM job_clicks
GROUP BY DATE(clicked_at)
ORDER BY date DESC;
```

### Table `social_share_analytics` (existante)

```sql
-- Voir tous les partages d'une offre
SELECT * FROM social_share_analytics WHERE job_id = 'uuid-123';

-- Stats par réseau de partage
SELECT platform, COUNT(*) as count
FROM social_share_analytics
WHERE job_id = 'uuid-123'
GROUP BY platform;
```

---

## 📈 Calcul du CTR

```
CTR = (Clics / Partages) * 100

Exemple :
- 100 partages sur Facebook
- 25 clics depuis Facebook
- CTR = (25 / 100) * 100 = 25%
```

---

## 🔐 Permissions

### Admin
- ✅ Voir tous les clics
- ✅ Voir tous les partages
- ✅ Dashboard complet

### Recruteur
- ✅ Voir clics sur ses offres
- ✅ Voir partages sur ses offres
- ❌ Voir données autres recruteurs

### Candidat
- ✅ Voir ses offres partagées (ses propres clics)
- ❌ Voir clics autres

---

## 🚨 Troubleshooting

### Les clics ne s'enregistrent pas

1. Vérifier que migration a été appliquée
```sql
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='job_clicks');
-- Doit retourner true
```

2. Vérifier les paramètres URL
```
URL doit être : /offres/{slug}?src=facebook
```

3. Vérifier la console du navigateur
```javascript
// Vérifier que le hook s'exécute
console.log('useSocialShareTracking called');
```

### Le dashboard ne se charge pas

1. Vérifier que vous êtes admin
```sql
SELECT * FROM profiles WHERE id = 'your-uuid' AND user_type = 'admin';
```

2. Vérifier RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'job_clicks';
```

### CTR à 0%

- Normal si pas de clics enregistrés
- Vérifier that offres ont des partages
- Vérifier that clics sont enregistrés

---

## 📱 Partage Mobile

Le système supporte automatiquement :
- Deep links WhatsApp
- Custom intents Android
- Universal links iOS

---

## 🎓 Cas d'Usage

### Cas 1 : Suivre une campagne

```
1. Partager offre sur Facebook
2. Observez : total_shares et total_clicks
3. Calculez : CTR
4. Optimisez : titre/image/description
```

### Cas 2 : Comparer les réseaux

```
Dashboard montre :
- Facebook : 50 shares, 8 clicks (16% CTR)
- LinkedIn : 30 shares, 12 clicks (40% CTR)
→ LinkedIn plus efficace pour ce type d'offre
```

### Cas 3 : Analyser les performances

```
Top 5 offres ont 500 shares total
Mais seulement 75 clics
→ CTR = 15%
→ Peut être amélioré
```

---

## 🔄 Cycle de Mise à Jour

Les stats sont **en temps réel** :
- Chaque partage enregistré immédiatement
- Chaque clic enregistré immédiatement
- Dashboard rafraîchit quand vous rechargez

---

## 📞 Support

Pour des questions :
1. Vérifier les logs du navigateur (F12)
2. Vérifier Supabase logs
3. Vérifier RLS policies
4. Vérifier migrations appliquées

---

**Bon partage ! 🚀**
