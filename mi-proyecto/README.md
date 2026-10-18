# Maquinaria CR — aplicación

Esta carpeta es la raíz del proyecto Vite. **La documentación del proyecto vive en el [README de la raíz del repositorio](../README.md)**, para no mantener dos copias que se desincronizan.

```bash
npm install
npm run dev
```

La búsqueda necesita un archivo `.env` en **esta** carpeta (no versionado):

```bash
VITE_ALGOLIA_APP_ID=...
VITE_ALGOLIA_SEARCH_KEY=...     # search-only, pública por diseño

ALGOLIA_APP_ID=...              # solo para el seed, en local
ALGOLIA_ADMIN_KEY=...           # NUNCA en el repo ni en el bundle
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run deploy` | Publica `dist/` en GitHub Pages |
| `npm run seed-algolia` | Indexa `data/` en Algolia |
