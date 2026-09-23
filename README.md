# NQ8

Versione personale 1.2 — Da incassare e saldo rapido, 23 settembre 2026. Rilascio su GitHub Pages autorizzato da Omar.

Da pagare, Acconto ricevuto e Pagato nel form e nelle schede. Da incassare mostra solo totale residuo e lavori ancora da saldare, con cliente, importo e comando Segna come pagato. Lista a blocchi di 50, stile chiaro NQ8; eliminati il riquadro Incassato e i testi superflui. Ricavi, Costi e Guadagno mantengono il significato precedente. Per scelta del proprietario, i lavori precedenti (anche da backup v1) sono considerati pagati, senza inventare date di saldo.

Backup v2 con pagamenti e lettura dei backup v1; ripristino sempre sostitutivo e atomico, preceduto dal download di un backup di sicurezza. Nessun merge. Dettagli e verifiche in [REPORT-PAGAMENTI.md](REPORT-PAGAMENTI.md).

[Apri l'app](https://omarquaggiotto.github.io/NQ8/) · [Stato tecnico e ripresa dello sviluppo](STATO-SVILUPPO.md)

Gestione locale dei lavori: clienti, descrizioni, costi, ricavi e guadagno. Riepilogo per giorno, mese, anno o Sempre; filtri e modifica dei lavori; backup importabili su un altro dispositivo.

## Uso e backup

- L'app funziona offline dopo il primo caricamento online.
- I lavori sono salvati nel browser/dispositivo con IndexedDB: non vengono caricati su GitHub.
- Esporta regolarmente i dati dalle Impostazioni e conserva il file `.nq8` anche fuori dal telefono.
- Importa dati sostituisce l'archivio dopo conferma. Il ripristino è una transazione unica: in caso di errore vengono mantenuti i dati precedenti.
- Per salvare il software: dal repository GitHub, Code → Download ZIP. Questo ZIP non contiene i lavori del telefono.

## Manutenzione

App senza dipendenze di produzione, basata su HTML, CSS e JavaScript. Pubblicazione automatica da `main` con GitHub Pages. Per modifiche future leggere prima `STATO-SVILUPPO.md`, partire dai file correnti e aggiornare la versione cache nel service worker.

La versione commerciale è solo un'eventualità futura, da progettare separatamente se emergeranno clienti. Account, sincronizzazione cloud e riscossione online non sono implementati; gli stati di pagamento sono annotazioni locali.
