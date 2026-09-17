# NQ8

Versione personale 1.0 — sviluppo concluso il 17 settembre 2026.

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

La versione commerciale è solo un'eventualità futura, da progettare separatamente se emergeranno clienti. Account, sincronizzazione cloud e pagamenti non sono implementati.
