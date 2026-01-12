# Aperçus Sociaux - Guide Rapide

## ✅ C'est Maintenant Disponible

Facebook, WhatsApp, LinkedIn, Twitter, Instagram et Telegram affichent maintenant les aperçus personnalisés des offres d'emploi JobGuinée.

---

## 🚀 Comment ça Marche

### Pour les Candidats

```
1. Voir une offre d'emploi
2. Cliquer "Partager"
3. Choisir Facebook, LinkedIn, WhatsApp, etc.
4. L'aperçu affiche :
   - Titre de l'offre
   - Nom de l'entreprise
   - Image (logo ou featured)
   - Description professionnelle
```

### Pour les Recruteurs

```
Tableau de bord Admin → Social Analytics
    ↓
Voir les performances de partage par réseau
    ↓
Optimiser les offres avec meilleur CTR
```

---

## 📊 Réseaux Supportés

| Réseau | Aperçu | Textuel | Tracking |
|--------|--------|---------|----------|
| 📘 **Facebook** | ✅ Image + texte | ✅ | ✅ Complet |
| 💼 **LinkedIn** | ✅ Image + texte | ✅ | ✅ Complet |
| 🐦 **Twitter** | ✅ Image + texte | ✅ | ✅ Complet |
| 💬 **WhatsApp** | - | ✅ Lien | ✅ Complet |
| 📷 **Instagram** | - | ✅ Copié | ✅ Complet |
| ✈️ **Telegram** | - | ✅ Lien | ✅ Complet |

---

## 🎨 Exemples d'Aperçus

### Facebook
```
╔════════════════════════════════════╗
║ Développeur Senior – Acme Corp     ║
║                                    ║
║ [Image 1200×630]                   ║
║                                    ║
║ Acme Corp recrute pour un CDI de   ║
║ Développeur Senior à Conakry.      ║
║ Salaire: 500K-800K GNF             ║
║                                    ║
║ jobguinee-pro.com                  ║
╚════════════════════════════════════╝
```

### WhatsApp
```
Développeur Senior chez Acme Corp
https://jobguinee-pro.com/s/abc123

👤 Profil partagé par Aminata
```

---

## 🔍 Vérifier que ça Marche

### Test 1: Facebook Debugger

```
1. Aller sur: https://developers.facebook.com/tools/debug/sharing/
2. Entrer une URL: https://jobguinee-pro.com/s/{job_id}
3. Vérifier:
   ✅ og:title s'affiche
   ✅ og:description s'affiche
   ✅ og:image s'affiche correctement
```

### Test 2: Partager sur Facebook

```
1. Aller sur JobGuinée
2. Voir une offre
3. Cliquer "Partager"
4. Partager sur Facebook
5. Vérifier l'aperçu sur le fil
```

### Test 3: Analytics

```
1. Admin → Social Analytics
2. Voir les statistiques
3. Vérifier que "Total Shares" et "Total Clicks" augmentent
```

---

## 📈 Optimiser les Partages

### ✅ Faire pour augmenter les clics

1. **Ajouter une image mise en avant**
   - Allez sur l'offre
   - Upload une image (logo entreprise ou graphique job)
   - Facebook l'affichera en aperçu

2. **Titre accrocheur**
   - ❌ "Ingénieur"
   - ✅ "Ingénieur Senior - Conakry - 800K GNF"

3. **Description claire**
   - ❌ "Travail dans notre entreprise"
   - ✅ "CDI - Télétravail possible - Formation incluse"

4. **Partager au bon moment**
   - Lundi-jeudi matin = meilleur engagement
   - Eviter dimanche

---

## 🎯 URLs de Partage

### Format
```
https://jobguinee-pro.com/s/{job_id}?src={réseau}
```

### Exemples
```
Facebook:
https://jobguinee-pro.com/s/550e8400-e29b-41d4-a716-446655440000?src=facebook

LinkedIn:
https://jobguinee-pro.com/s/550e8400-e29b-41d4-a716-446655440000?src=linkedin

WhatsApp:
https://jobguinee-pro.com/s/550e8400-e29b-41d4-a716-446655440000?src=whatsapp
```

---

## 📊 Analyser la Performance

### Dashboard Admin

```
/admin/social-analytics

Affiche :
├─ Total Shares (tous les réseaux)
├─ Total Clicks (depuis les partages)
├─ CTR Global (Click-Through Rate %)
│
├─ Graphique par réseau
│  ├─ Facebook : 45%
│  ├─ LinkedIn : 30%
│  ├─ WhatsApp : 20%
│  └─ Autres : 5%
│
└─ Tableau des offres
   ├─ Top 5 partagées
   ├─ Top 5 meilleur CTR
   └─ Détails complets
```

### SQL pour Analyser

```sql
-- Offres les plus partagées
SELECT
  j.title,
  j.company_name,
  COUNT(s.id) as shares,
  COUNT(c.id) as clicks,
  ROUND(COUNT(c.id)::numeric / COUNT(s.id) * 100, 2) as ctr_percent
FROM social_share_analytics s
LEFT JOIN job_clicks c ON s.job_id = c.job_id
JOIN jobs j ON s.job_id = j.id
GROUP BY j.id, j.title, j.company_name
ORDER BY shares DESC
LIMIT 10;

-- Clics par réseau
SELECT
  source_network,
  COUNT(*) as clicks
FROM job_clicks
GROUP BY source_network
ORDER BY clicks DESC;
```

---

## 🔐 Confidentialité & Sécurité

✅ **Pas de données personnelles** dans les aperçus
✅ **Admins seulement** voient les stats complètes
✅ **Recruteurs** voient leurs offres
✅ **Candidats** voient leurs partages
✅ **RGPD compliant** - pas de cookies

---

## ⚡ FAQ

**Q: Pourquoi le lien commence par `/s/` ?**
A: Cela permet à JobGuinée de tracker les clics et d'afficher les OG tags corrects.

**Q: L'aperçu ne s'affiche pas sur Facebook ?**
A: Effacer le cache Facebook avec le Debugger: https://developers.facebook.com/tools/debug/

**Q: Est-ce que ça ralentit le site ?**
A: Non, tout est optimisé et cached (3600 secondes).

**Q: Est-ce que les anciens liens fonctionnent encore ?**
A: Oui, `/offres/{job_id}` fonctionne toujours normalement.

---

## 🎓 Cas d'Usage

### Cas 1 : Recruteur veut booster une offre

```
1. Créer offre en ligne
2. Upload une image attrayante
3. Partager sur LinkedIn
4. Voir les clics dans le dashboard
5. Optimiser la description si CTR faible
```

### Cas 2 : Candidat partage une offre pour ami

```
1. Voir l'offre sur JobGuinée
2. Partager via WhatsApp
3. Ami clique le lien
4. Redirigé vers l'offre complète
5. Peut postuler directement
```

### Cas 3 : Admin analyse les trends

```
1. Aller dans Social Analytics
2. Voir que LinkedIn a 40% des clics
3. Recommander partages sur LinkedIn
4. Voir que CDI a meilleur CTR que Stage
5. Adapter stratégie de publication
```

---

## 🚀 Prochaines Étapes

Optionnel (futur):

- [ ] Automatiser les partages via Cron
- [ ] Notifications aux recruteurs si bonne performance
- [ ] A/B testing des images OG
- [ ] Email digest des stats sociales
- [ ] Intégration Pixel Facebook

---

## 📞 Support

**Problème ?** Vérifier :

1. URL est-elle bien `/s/{job_id}` ?
2. Image est-elle accessible publiquement ?
3. Titre et description ne sont-ils pas vides ?
4. Facebook Debugger montre-t-il les OG tags ?

---

**Bon partage ! 🚀**

---

Version: 1.0 | Date: 12 Janvier 2026
