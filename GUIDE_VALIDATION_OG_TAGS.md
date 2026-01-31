# GUIDE VALIDATION OPEN GRAPH - TESTS OBLIGATOIRES

**Date**: 31 Janvier 2026
**Durée estimée**: 15 minutes
**Prérequis**: Système OG déployé

---

## 🎯 OBJECTIF

Valider que le système Open Graph fonctionne correctement pour:
1. ✅ Facebook
2. ✅ LinkedIn  
3. ✅ WhatsApp
4. ✅ Twitter/X
5. ✅ Utilisateurs humains (SPA)

---

## ⚡ TESTS RAPIDES

### Test 1: Facebook Sharing Debugger

**URL**: https://developers.facebook.com/tools/debug/

**Procédure**:
1. Aller sur Facebook Sharing Debugger
2. Entrer: `https://jobguinee-pro.com/share/{job_id}`
3. Cliquer "Debug"

**✅ Résultat Attendu**: Tags OG présents, image 1200x630 visible

**❌ Si Erreur**: Voir section DÉPANNAGE

### Test 2: Simuler Crawler

```bash
curl -A "facebookexternalhit/1.1" https://jobguinee-pro.com/share/{job_id}
```

**✅ Attendu**: HTML avec balises `<meta property="og:..."`

**❌ Si React**: `<div id="root"></div>` → Problème .htaccess

### Test 3: Navigation Humaine  

Ouvrir `https://jobguinee-pro.com/share/{job_id}` dans navigateur

**✅ Attendu**: Redirection immédiate vers `/offres/{slug}`

---

## 📊 CHECKLIST

- [ ] Facebook Debugger OK
- [ ] LinkedIn Inspector OK
- [ ] WhatsApp preview OK
- [ ] Image PNG 1200x630 existe
- [ ] SPA fonctionne
