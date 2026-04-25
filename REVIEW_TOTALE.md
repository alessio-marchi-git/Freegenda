# Review totale Freegenda (proposte modifiche)

## Scope
- Audit statico repo (`index.html`, `script.js`, `styles.css`, docs).
- Nessuna modifica runtime/applicativa in questa PR: solo piano interventi prioritizzato.

## Priorità Alta

### 1) Event listener duplicati nel pannello suggerimenti
Problema: click/tastiera su attività possono triggerare handler multipli dopo vari render.
Causa: `renderSuggestions()` registra `addEventListener` ad ogni render.
Fix: spostare bind listener in init (una sola volta) oppure guardia con flag (`listenersBound`).
Verifica: seleziona/deseleziona stessa attività 20 volte, 1 solo toggle per input.
Riferimento: `script.js:461-503`.

### 2) Accessibilità incompleta in Month view
Problema: celle mese cliccabili ma non raggiungibili via tastiera.
Causa: `div.month-day` senza `tabIndex`, `role="button"`, keydown Enter/Space.
Fix: rendere interattive le celle con semantica/keyboard; opz. convertire a `<button>`.
Verifica: navigazione solo tastiera su celle mese + attivazione Enter/Space.
Riferimento: `script.js:357-393`, `styles.css:405-408`.

### 3) Accessibilità incompleta in Week view header
Problema: header giorno in week view cliccabile ma non keyboard-friendly.
Causa: `div.week-day-header` con listener click ma senza semantica interattiva.
Fix: aggiungere `tabIndex=0` + role/button + gestione Enter/Space (o usare `<button>`).
Verifica: focus visibile + attivazione da tastiera su ciascun header settimana.
Riferimento: `script.js:276-294`, `styles.css:306-309`.

## Priorità Media

### 4) Ruoli ARIA tab incompleti per view switcher
Problema: `role="tablist"/"tab"` parziali, possibile annuncio SR non corretto.
Causa: mancano `id`, `aria-controls`, `tabIndex` coerente, gestione frecce in tablist.
Fix: completare pattern WAI-ARIA Tabs o rimuovere role tab e usare pulsanti normali.
Verifica: NVDA/VoiceOver annuncia tab attiva + frecce cambiano tab (se pattern Tabs).
Riferimento: `index.html:16-20`, `script.js:451-456`.

### 5) Regole CSS duplicate
Problema: duplicazione `.nav-button:focus-visible` e `.view-button:focus-visible`.
Causa: blocchi ripetuti a fine file.
Fix: mantenere una sola definizione.
Verifica: diff CSS minimale, nessuna regressione visuale focus ring.
Riferimento: `styles.css:126-134`, `styles.css:643-651`.

### 6) Hardening parsing stato da localStorage
Problema: input storage non validato in profondità (shape attività/allocazioni).
Causa: `loadState()` valida solo presenza/tipi superficiali.
Fix: validazione stretta di ogni activity (`id,name,duration`) e allocation hour range.
Verifica: inietta JSON malformato in localStorage, app resta stabile e resetta dati invalidi.
Riferimento: `script.js:130-147`.

## Priorità Bassa

### 7) Coerenza stile JS vs linee guida contributo
Problema: guida suggerisce single quote “where practical”, codice usa prevalente double quote.
Causa: assenza formatter/linter configurato.
Fix: definire standard unico (ESLint+Prettier) ed applicarlo in CI.
Verifica: `npm run lint` (o equivalente) green su PR future.
Riferimento: `CONTRIBUTING.md:28`, `script.js` globale.

### 8) Mancano test automatizzati base
Problema: regressioni possibili su date logic/scheduling.
Causa: progetto statico senza test harness.
Fix: aggiungere suite minima (es. Vitest/Jest) per helper puri: date, sorting, allocation.
Verifica: test unit pass su funzioni pure critiche.
Riferimento: `script.js:626-750`.

### 9) CSP minimale ma non estesa
Problema: policy presente ma senza direttive hardening ulteriori.
Causa: meta CSP limitata a `default/style/script`.
Fix: valutare aggiunta `base-uri 'none'`, `object-src 'none'`, `frame-ancestors 'none'`.
Verifica: nessuna rottura app + scanner CSP baseline.
Riferimento: `index.html:6`.

## Piano operativo consigliato (ordine)
1. Fix listener duplicati + keyboard a11y month/week.
2. Rifinitura ARIA tabs.
3. Cleanup CSS duplicata.
4. Hardening localStorage parse.
5. Setup lint/test minimi + CI.
6. Hardening CSP.
