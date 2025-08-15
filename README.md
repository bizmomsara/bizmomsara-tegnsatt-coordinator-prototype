# Tegnsatt — Koordinator prototype (Next.js + Tailwind)

Dette er en enkel klikkbar prototype med filtrering (type, status, dato) og sortering.

## Kjør lokalt
1) Installer Node LTS (18/20).  
2) I terminal:
```bash
npm install
npm run dev
```
Åpne http://localhost:3000

## Deploy til Vercel (anbefalt)
1) Gå til https://vercel.com/import og velg **Upload**.  
2) Last opp ZIP-filen av prosjektet.  
3) Vercel vil bygge automatisk og gi deg en URL (gratis plan holder).

Alternativ: push til GitHub og “New Project” i Vercel → velg repo.

## Hva kan du teste?
- Filter **Type**: Tegnspråk / Skrivetolking / Tegn som støtte / Døvblinde
- Filter **Status**: Åpne / Delvis bemannet / Bemannet
- **Dato**: fra–til (viser oppdrag som overlapper intervallet)
- **Sortering**: Dato ↑/↓
- **Søk**: i tittel/kunde/sted

## Neste steg
- Koble til Firebase for ekte data + e-post/SMS.
- Legge til innlogging (Admin/Tolk) og roller.
