#!/bin/bash

# Liste des fichiers à migrer (pages principales)
FILES=(
  "src/pages/AdminJobList.tsx"
  "src/pages/AdminPremiumSubscriptions.tsx"
  "src/pages/CMSAdmin.tsx"
  "src/pages/CreditStore.tsx"
  "src/pages/AdminCreditPurchases.tsx"
  "src/pages/AdminFormationBoost.tsx"
  "src/pages/AdminCandidateVerifications.tsx"
  "src/pages/AdminDiffusionSettings.tsx"
  "src/pages/AdminEnterpriseSubscriptions.tsx"
  "src/pages/AdminEmailTemplates.tsx"
  "src/pages/AdminCreditsIA.tsx"
  "src/pages/AdminCommunicationTemplates.tsx"
  "src/pages/AdminJobCreate.tsx"
  "src/pages/AdminSecurityLogs.tsx"
  "src/pages/AdminChatbot.tsx"
  "src/pages/AdminCommunicationCreate.tsx"
  "src/pages/AdminSEOLandingPages.tsx"
  "src/pages/AdminCVThequePricing.tsx"
  "src/pages/AdminHomepageContent.tsx"
  "src/pages/AdminIAConfig.tsx"
  "src/pages/AdminCreditStoreSettings.tsx"
  "src/pages/AdminProfilePurchases.tsx"
  "src/pages/AdminIATemplates.tsx"
  "src/pages/AdminCommunications.tsx"
  "src/pages/AdminIAPremiumQuota.tsx"
  "src/pages/AdminAutomationRules.tsx"
  "src/pages/AdminFormationList.tsx"
  "src/pages/PremiumSubscribe.tsx"
  "src/pages/PremiumAIServices.tsx"
  "src/pages/Home.tsx"
  "src/pages/Blog.tsx"
  "src/pages/Jobs.tsx"
  "src/pages/CVDesigner.tsx"
  "src/pages/CandidateDashboard.tsx"
  "src/pages/RecruiterDashboard.tsx"
)

echo "🚀 Batch migration des alertes vers modales modernes"
echo "=================================================="
echo ""

MIGRATED=0

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    # Compte les alertes dans le fichier
    ALERT_COUNT=$(grep -c "alert(" "$FILE" 2>/dev/null || echo "0")
    CONFIRM_COUNT=$(grep -c "confirm(" "$FILE" 2>/dev/null || echo "0")
    TOTAL=$((ALERT_COUNT + CONFIRM_COUNT))

    if [ $TOTAL -gt 0 ]; then
      echo "📝 $FILE: $TOTAL alert/confirm trouvés"
      MIGRATED=$((MIGRATED + 1))
    fi
  else
    echo "⚠️  File not found: $FILE"
  fi
done

echo ""
echo "=================================================="
echo "✅ $MIGRATED fichiers nécessitent une migration"
