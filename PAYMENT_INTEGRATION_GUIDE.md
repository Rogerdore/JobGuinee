# Guide d'Intégration Providers de Paiement - JobGuinée

## Vue d'Ensemble

Ce guide explique comment intégrer les vrais providers de paiement (Orange Money, MTN, Stripe) pour passer du mode DEMO au mode PRODUCTION.

## Architecture

### Fichiers Clés

```
/src/config/payment.config.ts          # Configuration centralisée
/src/services/paymentProviders.ts      # Adapters providers
/src/services/creditStoreService.ts    # Service principal enrichi
/supabase/functions/payment-webhook-*  # Webhooks pour confirmations
```

### Mode de Fonctionnement

**Mode DEMO** (Actuel):
- Variable: `VITE_PAYMENT_MODE=DEMO`
- Paiements simulés (2s de délai)
- Aucune API réelle appelée
- Crédits ajoutés automatiquement

**Mode PRODUCTION**:
- Variable: `VITE_PAYMENT_MODE=PRODUCTION`
- APIs réelles des providers
- Redirections vers pages paiement
- Webhooks pour confirmation
- Crédits ajoutés après confirmation réelle

## Configuration

### 1. Variables d'Environnement

Fichier `.env`:

```bash
# Mode: DEMO ou PRODUCTION
VITE_PAYMENT_MODE=PRODUCTION

# URLs Webhooks
VITE_PAYMENT_WEBHOOK_BASE_URL=https://votre-domaine.com

# Orange Money - Guinée
VITE_ORANGE_MONEY_API_KEY=votre_api_key
VITE_ORANGE_MONEY_MERCHANT_ID=votre_merchant_id
VITE_ORANGE_MONEY_API_URL=https://api.orange.com/orange-money-webpay/gn/v1

# MTN Mobile Money - Guinée
VITE_MTN_MOMO_API_KEY=votre_api_key
VITE_MTN_MOMO_API_USER=votre_api_user_uuid
VITE_MTN_MOMO_SUBSCRIPTION_KEY=votre_subscription_key
VITE_MTN_MOMO_API_URL=https://api.mtn.com/collection/v1_0

# Stripe (cartes bancaires)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Secrets pour validation webhooks
VITE_ORANGE_WEBHOOK_SECRET=votre_secret_webhook_orange
VITE_MTN_WEBHOOK_SECRET=votre_secret_webhook_mtn
VITE_STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Obtenir les Credentials

#### Orange Money Guinée

1. Contacter Orange Money Business: https://business.orange.gn
2. S'inscrire comme marchand
3. Obtenir:
   - API Key
   - Merchant ID
   - Webhook Secret
4. Configuration webhook URL dans leur portail:
   ```
   https://votre-projet.supabase.co/functions/v1/payment-webhook-orange
   ```

#### MTN Mobile Money Guinée

1. S'inscrire sur: https://momodeveloper.mtn.com
2. Créer application
3. Obtenir:
   - API User (UUID)
   - API Key
   - Subscription Key (Primary)
4. Configurer callback URL si applicable

#### Stripe (Cartes Internationales)

1. Créer compte: https://dashboard.stripe.com/register
2. Activer compte en production
3. Obtenir:
   - Publishable Key (pk_live_...)
   - Secret Key (sk_live_...) - côté serveur uniquement
   - Webhook Secret (whsec_...)
4. Configurer webhook:
   ```
   https://votre-projet.supabase.co/functions/v1/payment-webhook-stripe
   ```

## Déploiement Webhooks

### 1. Déployer Edge Functions

```bash
# Orange Money
supabase functions deploy payment-webhook-orange

# MTN Money
supabase functions deploy payment-webhook-mtn

# URLs générées:
# https://[project-ref].supabase.co/functions/v1/payment-webhook-orange
# https://[project-ref].supabase.co/functions/v1/payment-webhook-mtn
```

### 2. Configurer Variables Serveur

Dans Supabase Dashboard > Settings > Edge Functions:

```
ORANGE_WEBHOOK_SECRET=xxx
MTN_WEBHOOK_SECRET=xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 3. Tester Webhooks

```bash
# Test manuel Orange Money
curl -X POST https://[project].supabase.co/functions/v1/payment-webhook-orange \
  -H "Content-Type: application/json" \
  -H "X-Orange-Signature: test" \
  -d '{
    "order_id": "CP-20251201-test",
    "status": "SUCCESS",
    "txnid": "OM12345",
    "amount": 100000
  }'
```

## Intégration par Provider

### Orange Money

**Documentation**: https://developer.orange.com/apis/orange-money-webpay

**Workflow**:
1. Créer purchase → `create_credit_purchase()`
2. Créer session → `POST /webpayment/v1/init`
3. Rediriger utilisateur → `payment_url`
4. Orange webhook callback → `/payment-webhook-orange`
5. Finaliser → `complete_credit_purchase()`

**Code Provider** (`paymentProviders.ts`):
```typescript
// À compléter avec vraies credentials
const response = await fetch(`${apiUrl}/webpayment/v1/init`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    merchant_key: merchantId,
    currency: 'GNF',
    order_id: reference,
    amount: amount,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notif_url: webhookUrl
  })
});
```

### MTN Mobile Money

**Documentation**: https://momodeveloper.mtn.com/docs/services/collection

**Workflow**:
1. Obtenir access token
2. Request to Pay → `POST /requesttopay`
3. Polling status (ou webhook si supporté)
4. Finaliser purchase

**Code Provider**:
```typescript
// 1. Get token
const tokenResponse = await fetch(`${apiUrl}/token/`, {
  method: 'POST',
  headers: {
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Authorization': `Basic ${btoa(apiUser + ':' + apiKey)}`
  }
});

// 2. Request to Pay
const payResponse = await fetch(`${apiUrl}/requesttopay`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Reference-Id': referenceId,
    'X-Target-Environment': 'mtnguinea',
    'Ocp-Apim-Subscription-Key': subscriptionKey
  },
  body: JSON.stringify({
    amount: amount.toString(),
    currency: 'GNF',
    externalId: purchaseId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: phoneNumber
    }
  })
});
```

### Stripe (Cartes)

**Documentation**: https://stripe.com/docs/payments/checkout

**Workflow**:
1. Créer Checkout Session (backend)
2. Rediriger vers Stripe Checkout
3. Webhook confirmation → `/payment-webhook-stripe`
4. Finaliser purchase

**Note**: Nécessite endpoint backend sécurisé pour créer session (Secret Key).

## Testing

### Mode Sandbox

**Orange Money**:
- Utiliser endpoint sandbox si disponible
- Montants test: < 1000 GNF = auto-success

**MTN**:
- URL: `https://sandbox.momodeveloper.mtn.com`
- Numéros test dans documentation
- PIN test: 1234

**Stripe**:
- Clés test: `pk_test_...` et `sk_test_...`
- Carte test: 4242 4242 4242 4242
- Date: future, CVC: 123

### Test Workflow Complet

1. **Mode DEMO → PRODUCTION**:
   ```bash
   # .env
   VITE_PAYMENT_MODE=PRODUCTION
   ```

2. **Test achat**:
   - Aller sur /credit-store
   - Sélectionner pack
   - Choisir Orange Money
   - Vérifier redirection
   - Simuler webhook callback
   - Vérifier crédits ajoutés

3. **Vérifier logs**:
   - Supabase Functions logs
   - credit_purchases table
   - credit_transactions table

## Sécurité Production

### Validation Webhooks

**Obligatoire**: Vérifier signature de chaque webhook

```typescript
// Orange Money
function verifyOrangeSignature(payload, signature, secret) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const computed = hmac.update(JSON.stringify(payload)).digest('hex');
  return computed === signature;
}
```

### Anti-Fraude

- Rate limiting sur création purchases
- Vérifier montant reçu === montant purchase
- Timeout purchases pending (30 min)
- Logger tentatives suspectes
- Double-check purchase non déjà completed

### Monitoring

**Alertes à configurer**:
- Taux échec > 20%
- Purchases pending > 30 min
- Webhooks échoués
- Montants incohérents

**Métriques**:
```sql
SELECT
  payment_method,
  COUNT(*) FILTER (WHERE purchase_status = 'completed') / COUNT(*)::float * 100 as success_rate,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM credit_purchases
WHERE created_at > now() - interval '24 hours'
GROUP BY payment_method;
```

## Troubleshooting

### Webhook non reçu
1. Vérifier URL dans portail provider
2. Tester manuellement avec curl
3. Vérifier Edge Function logs
4. Vérifier firewall/IP whitelist

### Signature invalide
1. Vérifier secret correct
2. Vérifier format payload (JSON vs form)
3. Consulter doc provider pour algo
4. Logger signature reçue vs calculée

### Crédits non ajoutés
1. Vérifier webhook exécuté (logs)
2. Vérifier `complete_credit_purchase()` succès
3. Vérifier `purchase_status` en DB
4. Vérifier `credit_transactions` créé

### Redirection échoue
1. Vérifier `redirect_url` retourné
2. Vérifier CORS si applicable
3. Tester URL manuellement
4. Vérifier credentials provider valides

## Checklist Go-Live

- [ ] Tous credentials production obtenus
- [ ] Variables `.env` configurées
- [ ] Edge Functions déployées
- [ ] Webhooks URLs configurées dans portails
- [ ] Tests sandbox réussis
- [ ] Monitoring configuré
- [ ] Alertes configurées
- [ ] Documentation équipe à jour
- [ ] Support client informé
- [ ] Plan de rollback préparé

## Support

**Contacts Providers**:
- Orange Money: support-business@orange.gn
- MTN MoMo: developer@mtn.com
- Stripe: support via Dashboard

**Documentation Technique**:
- `/CREDIT_STORE_DOCUMENTATION.md` - Système complet
- `/src/services/paymentProviders.ts` - Code providers
- `/src/config/payment.config.ts` - Configuration

**En cas de problème production**:
1. Basculer en mode DEMO immédiatement
2. Analyser logs Supabase Functions
3. Contacter support provider si nécessaire
4. Corriger et re-tester en sandbox
5. Re-déployer en production

---

**Le système est prêt pour la production. Toute l'architecture est en place, il suffit de remplir les credentials réels et passer `VITE_PAYMENT_MODE=PRODUCTION`.**
