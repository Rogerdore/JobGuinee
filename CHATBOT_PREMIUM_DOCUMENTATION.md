# Documentation : Intégration Premium dans le Chatbot JobGuinée

## Vue d'ensemble

Le chatbot JobGuinée a été amélioré pour détecter et s'adapter au statut Premium des utilisateurs. Cette intégration permet d'offrir une expérience personnalisée aux membres Premium PRO+ tout en encourageant les utilisateurs gratuits à passer Premium.

## Architecture

### 1. Base de données

#### Table `chatbot_settings` - Nouveaux champs Premium

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `enable_premium_detection` | boolean | Active/désactive la détection Premium | `true` |
| `premium_welcome_message` | text | Message de bienvenue pour membres Premium | NULL |
| `premium_badge_text` | text | Texte affiché dans le badge Premium | `'PRO+'` |
| `show_premium_benefits` | boolean | Affiche le CTA Premium aux non-Premium | `true` |
| `premium_upsell_message` | text | Message d'encouragement à passer Premium | NULL |
| `show_credits_balance` | boolean | Affiche le solde de crédits dans le header | `true` |
| `show_premium_expiration` | boolean | Affiche les jours restants Premium | `true` |

#### Migration appliquée

Fichier : `supabase/migrations/enhance_chatbot_premium_integration.sql`

```sql
ALTER TABLE chatbot_settings
ADD COLUMN IF NOT EXISTS enable_premium_detection boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS premium_welcome_message text,
ADD COLUMN IF NOT EXISTS premium_badge_text text DEFAULT 'PRO+',
ADD COLUMN IF NOT EXISTS show_premium_benefits boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS premium_upsell_message text,
ADD COLUMN IF NOT EXISTS show_credits_balance boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_premium_expiration boolean DEFAULT true;
```

### 2. Service Layer - `chatbotService.ts`

#### Interface `UserContext`

```typescript
export interface UserContext {
  is_premium: boolean;
  premium_expiration: string | null;
  credits_balance: number;
  remaining_days?: number;
  user_type: string;
  email: string;
}
```

#### Méthode `getUserContext()`

Récupère le contexte complet de l'utilisateur :
- Statut Premium (is_premium)
- Date d'expiration Premium
- Solde de crédits IA
- Calcul automatique des jours restants
- Type d'utilisateur et email

```typescript
static async getUserContext(userId: string): Promise<UserContext | null>
```

#### Méthode `askChatbot()` améliorée

- Charge le contexte utilisateur si `enable_premium_detection` est activé
- Passe le contexte au système IA
- Le contexte influence les réponses générées

#### Méthode `generateMockAIResponse()` améliorée

Les réponses sont maintenant contextuelles :

**Pour les membres Premium :**
- Messages personnalisés avec statut Premium
- Mention de l'accès illimité aux services IA
- Affichage des jours restants
- Pas d'incitation à acheter des crédits

**Pour les utilisateurs gratuits :**
- Suggestions de passer Premium
- Liens vers la page d'abonnement Premium
- Mention des bénéfices Premium

**Exemples de réponses adaptées :**

| Sujet | Utilisateur gratuit | Utilisateur Premium |
|-------|---------------------|---------------------|
| CV | "Passez Premium PRO+ pour un accès illimité!" | "Accès illimité à nos services CV!" |
| Crédits | "Achetez des crédits ou passez Premium" | "Vous avez X crédits. En Premium, ils ne sont pas consommés!" |
| Général | "Je suis là pour vous aider!" | "Bonjour membre Premium PRO+ (30j restants)!" |

### 3. Composant Frontend - `ChatbotWindow.tsx`

#### État ajouté

```typescript
const [userContext, setUserContext] = useState<UserContext | null>(null);
```

#### Chargement du contexte

```typescript
const loadUserContext = async () => {
  if (user && settings.enable_premium_detection) {
    const context = await ChatbotService.getUserContext(user.id);
    setUserContext(context);
  }
};
```

#### Header enrichi

Le header du chatbot affiche désormais :

1. **Badge Premium** (si Premium)
   - Icône Crown
   - Texte personnalisable (défaut: "PRO+")
   - Style : fond jaune avec texte foncé

2. **Solde de crédits** (si activé)
   - Icône Zap
   - Nombre de crédits disponibles

3. **Jours restants** (si Premium et activé)
   - Format : "30j restants"

```tsx
{userContext?.is_premium && settings.enable_premium_detection && (
  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
    <Crown className="w-3 h-3" />
    {settings.premium_badge_text || 'PRO+'}
  </span>
)}
```

#### CTA Premium pour non-Premium

Si l'utilisateur n'est pas Premium et que `show_premium_benefits` est activé, un bandeau apparaît après quelques messages :

```tsx
<div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
      <Crown className="w-5 h-5 text-white" />
    </div>
    <div>
      <h4 className="font-bold text-gray-900">Passez Premium PRO+</h4>
      <p className="text-sm text-gray-700">{settings.premium_upsell_message}</p>
      <button onClick={() => onNavigate('premium-subscribe')}>
        Découvrir Premium PRO+
      </button>
    </div>
  </div>
</div>
```

#### Message de bienvenue personnalisé

Le chatbot affiche :
- `premium_welcome_message` pour les membres Premium
- `welcome_message` pour les utilisateurs gratuits

### 4. Interface Admin - `AdminChatbot.tsx`

Une nouvelle section "Paramètres Premium" a été ajoutée à l'onglet Général :

#### Champs configurables

1. **Activer la détection Premium** (checkbox)
   - Active/désactive toute la logique Premium

2. **Message de bienvenue Premium** (textarea)
   - Message personnalisé pour les membres Premium
   - Exemple : "Bienvenue membre Premium PRO+! Je suis là pour vous aider..."

3. **Texte du badge Premium** (input)
   - Personnalise le texte du badge
   - Défaut : "PRO+"

4. **Afficher le solde de crédits** (checkbox)
   - Montre/cache le solde dans le header

5. **Afficher les jours restants** (checkbox)
   - Montre/cache le compte à rebours Premium

6. **Afficher le CTA Premium** (checkbox)
   - Active/désactive le bandeau d'upsell

7. **Message d'upsell Premium** (textarea)
   - Message encourageant à passer Premium
   - Exemple : "Accédez à tous nos services IA sans limite pour 350,000 GNF/mois!"

## Flux d'utilisation

### Pour un utilisateur Premium

1. L'utilisateur ouvre le chatbot
2. Le système détecte son statut Premium via `getUserContext()`
3. Le header affiche :
   - Badge "PRO+" doré
   - Solde de crédits (optionnel)
   - Jours restants (ex: "25j restants")
4. Message de bienvenue Premium s'affiche
5. Les réponses du bot sont personnalisées :
   - Mention de l'accès illimité
   - Pas de suggestion d'achat de crédits
   - Encouragements spécifiques Premium

### Pour un utilisateur gratuit

1. L'utilisateur ouvre le chatbot
2. Pas de badge Premium
3. Message de bienvenue standard
4. Les réponses incluent :
   - Suggestions de passer Premium
   - Liens vers services payants
   - Mention des bénéfices Premium
5. Après 2-3 messages, un bandeau CTA Premium apparaît

## Intégration avec le système de crédits

Le chatbot respecte la logique de bypass des crédits pour Premium :

- **Utilisateurs Premium** : Aucun crédit consommé (géré par `use_ai_credits()` RPC)
- **Utilisateurs gratuits** : Consommation normale selon `service_credit_costs`

Le chatbot **ne gère pas directement** la consommation de crédits. Il se contente d'afficher le statut et d'adapter les réponses. La consommation réelle se fait via la fonction `use_ai_credits()` qui vérifie automatiquement le statut Premium.

## Configuration recommandée

### Messages par défaut suggérés

**Premium Welcome Message :**
```
Bienvenue membre Premium PRO+! 🌟 Vous bénéficiez d'un accès illimité à tous nos services IA. Comment puis-je vous aider aujourd'hui ?
```

**Premium Upsell Message :**
```
Accédez à tous nos services IA sans limite, recevez 100 crédits bonus, profitez de 10GB de stockage cloud et d'un support prioritaire 24/7 pour seulement 350,000 GNF/mois!
```

### Paramètres conseillés

| Paramètre | Valeur recommandée | Raison |
|-----------|-------------------|---------|
| `enable_premium_detection` | `true` | Active l'expérience Premium |
| `show_credits_balance` | `true` | Rappelle le solde disponible |
| `show_premium_expiration` | `true` | Crée urgence pour renouvellement |
| `show_premium_benefits` | `true` | Encourage conversion gratuit → Premium |
| `premium_badge_text` | `"PRO+"` | Court, visible, professionnel |

## Tests et validation

### Scénarios de test

1. **Utilisateur non connecté**
   - Chatbot fonctionne normalement
   - Pas de détection Premium
   - Messages standards

2. **Utilisateur gratuit connecté**
   - Pas de badge Premium
   - Message de bienvenue standard
   - CTA Premium affiché après 3 messages
   - Réponses encouragent à passer Premium

3. **Utilisateur Premium actif**
   - Badge "PRO+" visible
   - Jours restants affichés (ex: "30j restants")
   - Solde de crédits visible
   - Message de bienvenue Premium
   - Réponses personnalisées Premium
   - Pas de CTA upsell

4. **Utilisateur Premium expiré**
   - Détecté comme non-Premium (is_premium = false)
   - Comportement identique à utilisateur gratuit
   - CTA Premium affiché

### Commandes de test

```bash
# Build du projet
npm run build

# Vérifier les tables
SELECT * FROM chatbot_settings;

# Vérifier un utilisateur Premium
SELECT id, email, is_premium, premium_expiration, credits_balance
FROM profiles
WHERE is_premium = true;
```

## Sécurité et performances

### Sécurité

- Le statut Premium est vérifié côté serveur (table `profiles`)
- Pas de manipulation possible côté client
- RLS Supabase protège l'accès aux données sensibles
- Le bypass de crédits est géré au niveau base de données (fonction RPC)

### Performances

- Le contexte utilisateur est chargé **une seule fois** à l'ouverture du chatbot
- Mise en cache côté composant (state React)
- Pas de requêtes répétées à chaque message
- Impact minimal sur les performances

## Maintenance

### Ajout de nouvelles réponses Premium

Pour ajouter une réponse contextuelle Premium dans `generateMockAIResponse()` :

```typescript
if (questionLower.includes('nouveau_sujet')) {
  if (isPremium) {
    return {
      answer: 'Réponse pour Premium...',
      tokens_used: 60,
      intent_detected: 'nouveau_sujet',
      suggested_links: [{ label: 'Lien Premium', page: 'page' }]
    };
  }
  return {
    answer: 'Réponse standard + suggestion Premium...',
    tokens_used: 60,
    intent_detected: 'nouveau_sujet',
    suggested_links: [
      { label: 'Lien standard', page: 'page' },
      { label: 'Passer Premium', page: 'premium-subscribe' }
    ]
  };
}
```

### Modification des styles Premium

Le badge et le CTA utilisent des classes Tailwind. Pour personnaliser :

**Badge Premium :**
```tsx
// Actuel : bg-yellow-500 text-yellow-900
// Alternative or : bg-amber-500 text-amber-900
// Alternative bleu : bg-blue-500 text-blue-900
```

**CTA Premium :**
```tsx
// Actuel : bg-gradient-to-r from-yellow-50 to-orange-50
// Alternative : bg-gradient-to-r from-blue-50 to-indigo-50
```

## Dépendances

### Packages utilisés

- `react` : Composants UI
- `lucide-react` : Icônes (Crown, Zap)
- `@supabase/supabase-js` : Accès base de données

### Tables dépendantes

- `profiles` : Statut Premium, crédits, expiration
- `chatbot_settings` : Configuration Premium
- `premium_subscriptions` : Historique abonnements (lecture seule)

## Évolutions futures possibles

### Court terme

1. Ajout d'un aperçu visuel dans l'admin (preview du chatbot)
2. Statistiques d'usage Premium vs gratuit
3. A/B testing des messages d'upsell

### Moyen terme

1. Réponses IA personnalisées basées sur l'historique Premium
2. Suggestions proactives pour utilisateurs Premium
3. Intégration avec système de notifications Premium

### Long terme

1. Chatbot vocal pour membres Premium
2. Assistant IA personnel avec mémoire pour Premium
3. Intégration avec services tiers (calendrier, email)

## Support et dépannage

### Problème : Badge Premium ne s'affiche pas

**Solutions :**
1. Vérifier que `enable_premium_detection` est `true`
2. Vérifier que l'utilisateur a `is_premium = true` ET `premium_expiration > NOW()`
3. Vérifier les logs console du navigateur

### Problème : Mauvais solde de crédits affiché

**Solutions :**
1. Vérifier la valeur dans `profiles.credits_balance`
2. Rafraîchir le chatbot (fermer/rouvrir)
3. Vérifier que `show_credits_balance` est `true`

### Problème : CTA Premium s'affiche pour un utilisateur Premium

**Solutions :**
1. Vérifier la date d'expiration : `SELECT premium_expiration FROM profiles WHERE id = 'user_id'`
2. Si expiré, c'est normal : l'utilisateur doit renouveler
3. Sinon, vérifier `is_premium` dans la base

## Conclusion

L'intégration Premium dans le chatbot JobGuinée offre une expérience utilisateur différenciée qui :

- Valorise les membres Premium avec un traitement VIP
- Encourage la conversion des utilisateurs gratuits
- S'intègre parfaitement au système de crédits existant
- Est entièrement configurable via l'interface admin

Cette fonctionnalité contribue directement à la monétisation de la plateforme en créant de la valeur perçue pour l'abonnement Premium PRO+.
