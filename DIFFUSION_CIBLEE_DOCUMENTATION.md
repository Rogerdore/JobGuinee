# Documentation - Système de Diffusion Ciblée Multicanale

## Vue d'ensemble

Le système de diffusion ciblée multicanale permet aux recruteurs de diffuser leurs annonces validées directement auprès de candidats qualifiés via **Email**, **SMS** et **WhatsApp**.

## Architecture du système

### Base de données

**Tables créées :**

1. **campaigns** - Campagnes de diffusion
2. **campaign_channels** - Canaux utilisés par campagne
3. **candidate_contact_preferences** - Consentements des candidats
4. **shortlinks** - Liens trackés pour mesure des clics
5. **campaign_sends** - Historique des envois
6. **campaign_clicks** - Tracking des clics
7. **campaign_blacklist** - Liste d'opt-out

**Fonctions SQL :**
- `calculate_available_audience(filters)` - Calcule l'audience disponible selon les filtres
- `generate_shortcode()` - Génère un code court unique pour les liens
- `check_anti_spam(person_id, channel)` - Vérifie les règles anti-spam (1/24h, 2/7j)

### Services

**`targetedDiffusionService.ts`**
- Gestion complète des campagnes
- Calcul d'audience
- Création et validation de campagnes
- Génération de shortlinks
- Statistiques

### Pages

**`CampaignCreate.tsx`** - Wizard en 4 étapes :
1. Sélection de l'annonce
2. Définition de l'audience (filtres)
3. Sélection des canaux et quantités
4. Validation et paiement

**`AdminCampaignPayments.tsx`**
- Interface admin pour valider les paiements
- Vue détaillée des campagnes en attente
- Validation/Rejet avec notes administratives

### Composants

**`TargetedDiffusionBadge.tsx`**
- Badge affiché sur les cartes d'annonces validées
- États : Disponible / En attente / En cours
- Redirection vers le wizard de création

## Flux utilisateur

### Pour les recruteurs

1. **Publier une annonce** → Attend validation admin
2. **Badge apparaît** sur l'annonce validée → "🚀 Diffusion ciblée disponible"
3. **Clic sur le badge** → Wizard de création de campagne
4. **Configuration** :
   - Définir l'audience cible (métier, secteur, localisation, expérience)
   - Voir l'audience disponible en temps réel
   - Choisir les canaux (Email / SMS / WhatsApp)
   - Définir les quantités par canal
5. **Récapitulatif** → Montant total calculé
6. **Paiement** → Instructions Orange Money affichées
7. **Envoi preuve** → Par WhatsApp ou SMS au numéro admin
8. **Validation admin** → Diffusion lancée automatiquement

### Pour les admins

1. Accéder à **Admin → Diffusion Ciblée**
2. Voir la liste des campagnes en attente
3. Examiner les détails (audience, canaux, coûts)
4. **Valider** ou **Rejeter** avec notes
5. Si validé → Campagne activée (statut "En cours")

## Tarification

| Canal | Coût unitaire |
|-------|--------------|
| Email | 500 GNF |
| SMS | 1 000 GNF |
| WhatsApp | 3 000 GNF |

## Règles métier

### Conditions d'accès
- Annonce DOIT être **approved** (validée par admin)
- Aucune diffusion pendant l'analyse ou si annonce refusée

### Calcul d'audience
Filtres disponibles :
- Métier / Poste
- Secteur d'activité
- Localisation
- Expérience (min/max)
- Actif dans les X derniers jours
- Profil complété ≥ 80%

Exclusions automatiques :
- Candidats en blacklist globale
- Candidats ayant fait opt-out
- Profils inactifs

### Anti-spam
- Maximum 1 envoi par canal / 24h par candidat
- Maximum 2 envois par canal / 7 jours par candidat
- Déduplication automatique

### Paiement
- **100% manuel** via Orange Money
- Numéro Admin : À configurer dans `ADMIN_ORANGE_MONEY_NUMBER`
- Workflow :
  1. Client paie via Orange Money
  2. Client envoie preuve (WhatsApp / SMS)
  3. Admin valide
  4. Diffusion lancée

## Sécurité & Conformité

### Row Level Security (RLS)
Toutes les tables ont RLS activé avec policies :
- Recruteurs voient uniquement leurs campagnes
- Admins voient toutes les campagnes
- Candidats gèrent leurs préférences de contact

### Consentements RGPD
- Consentements par canal (email, sms, whatsapp)
- Opt-out possible à tout moment
- Blacklist respectée automatiquement

## Intégration

### Dans le code existant

**App.tsx** - Routes ajoutées :
```typescript
'campaign-create' | 'admin-campaign-payments'
```

**AdminLayout.tsx** - Bouton ajouté :
```jsx
<button onClick={() => onNavigate('admin-campaign-payments')}>
  <Send /> Diffusion Ciblée
</button>
```

**B2BSolutions.tsx** - Section marketing complète :
- Explication du système
- Avantages business
- Tarification par canal
- Processus en 4 étapes
- CTA vers démo

### Badge sur cartes d'annonces

Utiliser le composant `TargetedDiffusionBadge` :

```jsx
<TargetedDiffusionBadge
  entityType="job" // ou 'training' / 'post'
  entityId={job.id}
  entityStatus={job.status}
  onNavigate={onNavigate}
/>
```

## Prochaines étapes (améliorations futures)

### Phase 1 - Actuellement implémenté ✓
- ✓ Base de données complète
- ✓ Wizard de création de campagne
- ✓ Validation admin des paiements
- ✓ Calcul d'audience dynamique
- ✓ Paiement manuel Orange Money
- ✓ Section marketing B2B

### Phase 2 - À implémenter (optionnel)
- Templates d'emails/SMS/WhatsApp personnalisables
- Prévisualisation des messages avant envoi
- Tableau de bord analytics des campagnes
- Export des statistiques
- Historique complet des campagnes
- WhatsApp Business API integration
- Orange Money API pour paiement automatique
- Génération automatique d'images pour messages

### Phase 3 - Avancé (optionnel)
- A/B testing de messages
- Segmentation automatique par IA
- Recommandations de canaux optimaux
- Prédiction de taux de réponse
- Gestion de templates par secteur
- Multi-devises
- Facturation automatique

## Configuration requise

### Variables d'environnement
```env
# Dans targetedDiffusionService.ts
ADMIN_ORANGE_MONEY_NUMBER=+224 622 00 00 00
```

### Permissions Supabase
- Les migrations ont été appliquées
- RLS est activé
- Les fonctions SQL sont déployées

## Support & Maintenance

### Monitoring
- Surveiller `campaign_sends` pour le taux de livraison
- Vérifier `campaign_clicks` pour l'engagement
- Analyser `campaign_blacklist` pour les opt-outs

### Logs & Debug
Tous les services utilisent `console.error()` pour les erreurs.
Vérifier les logs dans :
- Browser console (frontend)
- Supabase logs (backend)

## Contact technique

Pour toute question sur l'implémentation, consulter :
- `targetedDiffusionService.ts` - Service principal
- `create_targeted_diffusion_system.sql` - Schéma de base de données
- `CampaignCreate.tsx` - Wizard utilisateur
- `AdminCampaignPayments.tsx` - Interface admin

---

**Date de création :** 30 décembre 2025
**Version :** 1.0.0
**Statut :** ✅ Opérationnel (paiement manuel)
