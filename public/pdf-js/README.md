# PDF.js Worker

Ce dossier contient le worker PDF.js nécessaire pour le rendu et l'extraction de contenu des fichiers PDF.

## Fichier

- `pdf.worker.min.mjs` - Worker PDF.js (version minifiée)

## Pourquoi ce fichier est nécessaire ?

PDF.js utilise un Web Worker pour traiter les fichiers PDF de manière asynchrone sans bloquer l'interface utilisateur. Ce worker doit être accessible via une URL publique.

## Utilisation

Le worker est configuré dans :
- `src/components/forms/RichTextEditor.tsx`
- `src/services/cvUploadParserService.ts`

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-js/pdf.worker.min.mjs';
```

## Mise à jour

Pour mettre à jour le worker lors d'une mise à jour de `pdfjs-dist` :

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf-js/
```

## Note

Ce fichier est automatiquement copié dans `dist/pdf-js/` lors du build par Vite.
