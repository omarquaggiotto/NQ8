# NQ8 1.1 — Gestione pagamenti

23 settembre 2026. Implementazione completata su repository `omarquaggiotto/NQ8`, base `e4a0762` (versione personale 1.0). Nessuna modifica a ML. Dopo il collaudo locale Omar ha autorizzato la pubblicazione della 1.1; `main` pubblica automaticamente su GitHub Pages.

## Analisi e modello dati

App HTML/CSS/JavaScript senza dipendenze di produzione. `ricavo` rappresenta il valore complessivo del lavoro; `costo` la spesa; il guadagno resta `ricavo - costo`. Nessun secondo totale introdotto.

IndexedDB `NQ8_Database`, versione 1, store `lavori`, chiave numerica `id`, indici cliente/data. CRUD e importazione restano nelle funzioni esistenti. Non sono presenti store separati per clienti, appuntamenti, impostazioni o storico: non sono stati introdotti. I campi ulteriori dei record sono conservati nell'importazione.

L'oggetto facoltativo `pagamento` contiene:

```json
{
  "stato": "partial",
  "acconto": 200,
  "dataAcconto": "2026-09-23T10:00:00.000Z",
  "dataPagamento": null
}
```

Stati: `unpaid`, `partial`, `paid`. Acconto non negativo, massimo due decimali e non superiore al totale. Calcoli monetari in centesimi; residuo e incassato sono derivati, mai duplicati nel record. Pagato implica incassato uguale al totale e residuo zero. Dopo il saldo, l'acconto precedente resta come informazione storica e non viene sommato di nuovo al totale.

Il primo acconto positivo registra la data ISO; modifiche successive dell'acconto positivo mantengono questa prima data. Acconto azzerato o ritorno a Da pagare cancellano la data acconto. Il saldo registra automaticamente la data; modifiche non economiche la conservano. Cambiare il totale di un lavoro Pagato registra una nuova data di saldo coerente con il nuovo importo. Tornare a uno stato non pagato cancella la data saldo. Un totale inferiore all'acconto è bloccato e richiede correggere esplicitamente il pagamento. Acconto uguale al totale diventa Pagato al salvataggio, con avviso visibile nel form.

## Legacy: decisione ricevuta e compatibilità

Omar ha richiesto esplicitamente: **«considera tutti i lavori precedenti pagati»**. I record senza `pagamento` vengono quindi letti come Pagato, acconto zero, data saldo sconosciuta. Lo stesso vale per i backup precedenti. Entrano in Incassato, mai in Da incassare.

Non viene eseguita una migrazione distruttiva né una riscrittura automatica dei record. Schema DB invariato perché gli object store possono già contenere i campi aggiuntivi. Modificando un lavoro storico senza cambiare il totale si memorizza `storico: true`, con data saldo `null`; nessuna data fittizia viene assegnata. Lo stato può essere corretto manualmente nel form.

## Interfaccia

- Stato nel form; campo Acconto ricevuto (€) solo quando pertinente; Totale lavoro e Residuo calcolati. Date già registrate visibili nel form di modifica.
- Stato compatto nelle schede, con acconto e residuo quando necessari.
- Segna come pagato nelle schede con residuo positivo; aggiornamento immediato dei totali.
- Da incassare nel Riepilogo, lista compatta che apre il lavoro, totale residui e Incassato. Riguarda **tutto l'archivio**, esplicitato nella UI, indipendentemente dal filtro del riepilogo economico precedente. Non è un report dei flussi per data di incasso.
- Costi, Ricavi, Guadagno e filtri originali mantengono il significato e il comportamento precedenti.

## Backup / restore

Formato v2, con lettura dei backup v1 e di quelli precedenti senza versione già accettati dall'app. Esportazione completa dei record; importazione valida stato, importi, coerenza delle date e preserva i campi aggiuntivi. Versioni future sconosciute sono rifiutate.

Il comportamento reale di NQ8 era già **replace-only atomico**: non esiste un merge e non è stato aggiunto. Prima di sostituire un archivio non vuoto, viene scaricato `NQ8_sicurezza_backup_...nq8`, completo dei pagamenti. Se la funzione di esportazione segnala un errore, il ripristino si ferma. Come per ogni download web, la conferma dell'effettiva conservazione del file dipende dal browser/dispositivo. Cancellazione e inserimenti avvengono nella stessa transazione; un errore ripristina l'archivio precedente.

## File modificati e aggiunti

| File | Modifica |
| --- | --- |
| `payments.js` | Nuovo modulo condiviso: stati, validazione, date, compatibilità legacy e calcoli |
| `app.js` | Integrazione nel CRUD/form, schede, saldo rapido, riepilogo e backup di sicurezza |
| `database.js` | Validazione dei pagamenti prima delle scritture e nelle importazioni atomiche |
| `backup.js` | Formato v2, compatibilità v1, validazione e conservazione dei campi |
| `index.html` | Controlli pagamento, riepilogo, modulo condiviso e versione 1.1 |
| `style.css` | Stile dei controlli e della lista compatta, azioni adattabili su mobile |
| `service-worker.js` | Precache di payments.js e cache v8-payments |
| `tests/regression.cjs` | Suite ripetibile di 14 gruppi, inclusi browser, IndexedDB e PWA |
| `.gitignore` | Esclusione dipendenze di test e screenshot generati |
| `README.md`, `STATO-SVILUPPO.md`, `REPORT-PAGAMENTI.md` | Stato, comportamento, limiti e istruzioni di verifica |

## Test eseguiti

Non esisteva una suite automatica versionata nel repository; erano documentate verifiche precedenti. La nuova suite include regressioni delle funzioni esistenti. **14 gruppi superati**, unit test e Microsoft Edge headless con IndexedDB/Service Worker reali in un contesto isolato:

1. Totale 500 Da pagare → residuo 500; acconto 200 → incassato 200, residuo 300; saldo → residuo zero.
2. Date del primo acconto e saldo, modifiche successive, riapertura del pagamento e modifica totale.
3. Importi negativi, superiori al totale, non finiti o con decimali eccessivi; date e stati malformati rifiutati.
4. Subito Pagato; acconto completo; aritmetica in centesimi; legacy pagato senza data inventata.
5. Form reale, link dalla lista, blocco salvataggio quando il totale scende sotto l'acconto.
6. Saldo rapido, uscita dalla lista, pagamento immediato e acconto completo dalla UI.
7. Chiusura e riapertura DB/pagina, refresh, record e date conservati, schema v1 invariato.
8. Esportazione e ripristino v2 e download di sicurezza, pagamenti e campi aggiuntivi conservati.
9. Backup legacy; backup non valido rifiutato; errore durante sostituzione atomica senza perdita dei dati precedenti.
10. Costi/Ricavi/Guadagno invariati, anno/Sempre, apertura lavori, ricerca, azzeramento filtri ed eliminazione.
11. Form a 320×568, 390×400, 390×844 e 1440×900; assenza di overflow orizzontale; screenshot ispezionati.
12. Giorno bisestile, mese, periodi e archivio vuoti; fallimento del backup di sicurezza blocca la sostituzione.
13. Modulo pagamenti in cache, reload offline e persistenza dei dati.
14. Aggiornamento effettivo dalla base 1.0 / cache v7 / DB v1 alla 1.1 / cache v8: record identici prima/dopo, cache precedente rimossa, uso offline riuscito.

Il caso merge non è applicabile. Non sono stati usati né modificati dati operativi dell'utente.

Per ripetere: Node.js, Playwright (verificato con 1.62.1), Git e Microsoft Edge. Rendere Playwright risolvibile da Node (installazione di sviluppo oppure `NODE_PATH` verso il runtime già fornito). Dalla cartella NQ8 eseguire `node tests/regression.cjs --upgrade`. La prova di aggiornamento richiede la storia Git contenente `e4a0762`. Con il solo ZIP eseguire senza `--upgrade`. Per un altro browser Chromium usare `CHROME_PATH`. Screenshot generati in `test-results/`.

## Verifiche manuali e pubblicazione

Da effettuare su dispositivi fisici: Safari/PWA iPhone e Android, tastiera e scorrimento del form, download/ripristino del backup di sicurezza, aggiornamento della PWA installata. L'emulazione delle dimensioni in Edge non sostituisce queste prove.

Versione risultante **1.1**, backup **2**, IndexedDB **1**, cache **nq8-cache-v8-payments**. **Pubblicazione autorizzata da Omar il 23 settembre 2026**. Verificare su GitHub Pages la versione 1.1 e la cache v8 al termine della distribuzione automatica.
