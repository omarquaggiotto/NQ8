# NQ8 — Stato dello sviluppo

Aggiornato il 17 settembre 2026.

## Progetto

- Repository: https://github.com/omarquaggiotto/NQ8
- App pubblicata: https://omarquaggiotto.github.io/NQ8/
- Branch di sviluppo e pubblicazione: `main`; GitHub Pages pubblica automaticamente i commit.
- Ultimo commit funzionale al momento di questa nota: `e679c3c53800e3123b9170d2d9e8624f37592c49` (Sempre e anni disponibili).
- App per la gestione dei lavori di un antennista: HTML, CSS, JavaScript, PWA e IndexedDB locale. Nessun backend operativo.

## Funzioni presenti

- Nuovo lavoro dal pulsante +: cliente, descrizione, data, costo, ricavo e guadagno calcolato.
- Pagina Lavori: ricerca cliente, filtri anno/mese/giorno, modifica ed eliminazione.
- Impostazioni: esportazione e importazione completa tramite file `.nq8`.
- Riepilogo dinamico: Giorno, Mese, Anno e Sempre; numero lavori, costi, ricavi, guadagno.
- Per Mese e Anno, l'anno è un menu contenente solo gli anni presenti nei lavori. Con soli lavori del 2026 compare solo 2026. L'elenco si aggiorna al caricamento e dopo modifiche ai dati.
- Sempre mostra i totali dell'intero archivio e nasconde i selettori del periodo.
- Vedi lavori trasferisce il periodo ai filtri della pagina Lavori, azzerando la ricerca cliente precedente. Vedi tutti i lavori azzera tutti i filtri.
- I periodi senza risultati mostrano zero lavori. In un archivio vuoto il menu anni è disabilitato; Sempre resta disponibile.

## Correzioni recenti

1. Sostituiti i tre riepiloghi fissi con un unico riepilogo selezionabile.
2. Campo data del riepilogo: contenitore di altezza fissa, testo formattato e input nativo trasparente sovrapposto per mantenere il calendario senza dipendere dalla resa grafica iOS.
3. Popup sopra la navigazione (`z-index: 10000`, barra 9999), altezza limitata e scorrimento.
4. Dopo ulteriori segnalazioni nell'app installata su iPhone: altezza e posizione del popup basate su `visualViewport`, barra inferiore nascosta durante i popup, modulo scorrevole e pulsanti sticky. La classe `body.modal-open` segue l'apertura/chiusura dei popup tramite MutationObserver.
5. Service worker: corretta una virgola mancante nell'elenco dei file; pulizia limitata alle cache NQ8. Cache corrente: `nq8-cache-v6-summary-all`.

## Test e limiti

- Test automatici locali in Microsoft Edge con 8 lavori fittizi distribuiti tra 2024, 2025, 2026 e 2027.
- Verificati totali, trasferimento filtri, ricerca cliente azzerata, periodi vuoti, 29 febbraio, Sempre, anni disponibili e archivio vuoto.
- Verificati IndexedDB, importazione dei dati demo, riapertura offline e layout tra 320 e 1440 pixel.
- Verificato salvataggio nel popup a 390×844, 320×568 e 390×400 pixel.
- Le pubblicazioni sono state controllate su GitHub Pages. L'HTML dell'ultima modifica coincide con la versione testata.
- NON è stata effettuata una verifica su un iPhone reale. L'utente aveva confermato problemi nell'app installata, non risolti dalla sola correzione dello z-index. Manca ancora la sua conferma definitiva sulla correzione basata su visualViewport.
- Non presumere che emulare una larghezza mobile in Chromium equivalga a provare Safari/PWA iOS.

## File principali

- `index.html`: schermate, form e selettori.
- `style.css`: layout, input data, popup e navigazione.
- `app.js`: interfaccia, filtri, riepilogo e gestione popup.
- `database.js`: IndexedDB (`NQ8_Database`, store `lavori`).
- `backup.js`: formato e import/export dei backup.
- `service-worker.js`: cache offline; incrementare il nome cache dopo aggiornamenti dell'app.
- `manifest.json`, `assets/`: installazione e icone.

## Come riprendere da un altro dispositivo

1. Aprire questo repository e leggere questa nota; recuperare i file correnti da `main`, evitando di ripartire da vecchi ZIP o codice copiato nelle chat.
2. Controllare eventuali commit successivi a questa nota prima di modificare i file.
3. Chiedere quale modifica fare; non ci sono altre funzionalità già concordate da implementare automaticamente.
4. Per il problema iPhone, verificare prima che sia arrivata la versione aggiornata: aprendo +, la barra inferiore deve scomparire. Usare questa distinzione per separare cache obsoleta e problemi reali di layout.
5. Dopo le modifiche, eseguire test mirati, pubblicare su GitHub secondo le istruzioni dell'utente e aggiornare questa nota.

## Dati e idee future

- GitHub conserva il software, non i lavori reali: questi restano nel database del singolo browser/dispositivo.
- Per trasferire i lavori usare Esporta dati e Importa dati. L'importazione esistente sostituisce i dati dopo conferma.
- I lavori demo sono stati usati in un browser di test isolato e non inseriti nell'app dell'utente né nel codice pubblicato.
- Supabase come backup/sincronizzazione separata è stato discusso solo come idea futura; non è implementato e non va aggiunto senza una nuova richiesta.
- Questa app è NQ8, distinta dall'altra app per le multe della squadra.

Questa nota condivide lo stato tecnico attraverso GitHub; non sincronizza automaticamente la conversazione o i dati dei lavori tra dispositivi.
