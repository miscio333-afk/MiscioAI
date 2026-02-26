# Miscio - Chat AI per Studenti

Un assistente AI chat progettato per aiutare gli studenti con francese, matematica, informatica, tecnologia e coding.

## Caratteristiche

- 💬 **Chat in tempo reale** con streaming delle risposte
- 🇫🇷 **Francese bilingue** - risposte in francese + italiano
- 🧮 **Metodo socratico** - guida lo studente a ragionare prima di dare la soluzione
- 🌐 **Ricerca web** - informazioni aggiornate da internet
- 📝 **Markdown support** - grassetto, corsivo, codice, liste, link
- 📋 **Copia risposte** - pulsante per copiare le risposte
- 🎨 **Dark neon theme** - design moderno minimal

## Prerequisiti

- Node.js 18+
- API key OpenRouter (gratuita)

## Setup

1. **Clona il progetto:**
```bash
git clone https://github.com/TUO_USERNAME/miscio-chat.git
cd miscio-chat
```

2. **Installa le dipendenze:**
```bash
npm install
```

3. **Configura la API key:**

Crea un file `.env.local` nella root del progetto:
```env
OPENROUTER_API_KEY=la_tua_api_key
```

Ottieni la API key gratuita da: https://openrouter.ai/keys

4. **Avvia il server:**
```bash
npm run dev
```

5. **Apri nel browser:**
```
http://localhost:3000
```

## Personalizzazione

### Modifica la personalità di Miscio

Edita il file `src/components/ChatContainer.tsx` e modifica la costante `SYSTEM_MESSAGE` per cambiare:
- Nome e descrizione
- Materie di competenza
- Regole di risposta
- Tono e stile

### Aggiungi bottoni suggerimento

Modifica l'array `SUGGESTION_BUTTONS` in `src/components/ChatContainer.tsx`.

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS
- **AI:** OpenRouter API (modelli gratuiti)
- **Markdown:** react-markdown

## Deployment

### Vercel (consigliato)

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm run build
# Deploy la cartella .next
```

## Note

- Il modello gratuito potrebbe avere rate limits
- Le conversazioni non sono salvate permanentemente
- Per salvare le chat, considera l'aggiunta di localStorage o un database

## Licenza

MIT
