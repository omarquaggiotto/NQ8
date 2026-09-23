/* =========================================================
   NQ8 - BACKUP
   Esportazione e importazione dei dati
   ========================================================= */


/* =========================================================
   VERSIONE BACKUP
   ========================================================= */

const BACKUP_VERSION = 2;


/* =========================================================
   ESPORTAZIONE DATABASE
   ========================================================= */

async function exportDatabaseBackup(jobs, safety = false) {

    try {

        if (!Array.isArray(jobs)) {

            throw new Error(
                "Dati non validi."
            );

        }


        /* ---------------------------------------------
           CREAZIONE FILE BACKUP
        --------------------------------------------- */

        jobs.forEach(validatePayment);
        const backupData = {

            app: "NQ8",

            version:
                BACKUP_VERSION,

            createdAt:
                new Date().toISOString(),

            jobs:
                jobs

        };


        const json =
            JSON.stringify(
                backupData,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        /* ---------------------------------------------
           NOME FILE
        --------------------------------------------- */

        const date =
            new Date();


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );


        const filename =
            `NQ8_${safety ? "sicurezza_" : ""}backup_${year}-${month}-${day}${safety ? "_" + Date.now() : ""}.nq8`;


        /* ---------------------------------------------
           DOWNLOAD
        --------------------------------------------- */

        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        URL.revokeObjectURL(
            url
        );


        if (!safety) alert("Backup esportato correttamente.");
        return true;


    } catch (error) {

        console.error(
            "NQ8 - Errore esportazione:",
            error
        );


        alert(
            "Impossibile esportare i dati."
        );
        return false;

    }

}


/* =========================================================
   IMPORTAZIONE BACKUP
   ========================================================= */

function importDatabaseBackup(file) {

    return new Promise(
        (resolve, reject) => {

            if (!file) {

                reject(
                    new Error(
                        "Nessun file selezionato."
                    )
                );

                return;

            }


            const reader =
                new FileReader();


            /* -----------------------------------------
               LETTURA FILE
            ------------------------------------------ */

            reader.onload = function(event) {

                try {

                    const content =
                        event.target.result;


                    const backup =
                        JSON.parse(
                            content
                        );


                    /* ---------------------------------
                       CONTROLLO FILE
                    ---------------------------------- */

                    if (
                        !backup ||
                        typeof backup !==
                            "object"
                    ) {

                        throw new Error(
                            "Formato non valido."
                        );

                    }


                    if (
                        backup.app !==
                        "NQ8"
                    ) {

                        throw new Error(
                            "Il file non appartiene a NQ8."
                        );

                    }


                    if (
                        !Array.isArray(
                            backup.jobs
                        )
                    ) {

                        throw new Error(
                            "Il backup non contiene lavori validi."
                        );

                    }


                    /* ---------------------------------
                       NORMALIZZAZIONE DATI
                    ---------------------------------- */

                    if (backup.version !== undefined && ![1, BACKUP_VERSION].includes(backup.version)) {
                        throw new Error("Versione del backup non supportata.");
                    }
                    const ids = new Set();
                    const jobs = backup.jobs.map((job, index) => {
                        if (!job || typeof job !== "object") throw new Error("Lavoro non valido.");
                        const id = Number(job.id);
                        const cliente = String(job.cliente || "").trim();
                        const data = String(job.data || "");
                        const date = new Date(data + "T12:00:00Z");
                        const costo = Number(job.costo);
                        const ricavo = Number(job.ricavo);
                        if (!Number.isSafeInteger(id) || id <= 0 || ids.has(id) || !cliente ||
                            !/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(date.getTime()) ||
                            date.toISOString().slice(0, 10) !== data ||
                            job.costo == null || job.ricavo == null ||
                            !Number.isFinite(costo) || !Number.isFinite(ricavo) || costo < 0 || ricavo < 0) {
                            throw new Error("Dati non validi nel lavoro " + (index + 1));
                        }
                        validatePayment({...job, ricavo});
                        ids.add(id);
                        return {
                            ...job,
                            id, cliente, data, costo, ricavo,
                            descrizione: String(job.descrizione || ""),
                            creatoIl: job.creatoIl || new Date().toISOString(),
                            modificatoIl: job.modificatoIl || new Date().toISOString()
                        };
                    });

                    resolve(
                        jobs
                    );


                } catch (error) {

                    reject(
                        error
                    );

                }

            };


            /* -----------------------------------------
               ERRORE LETTURA
            ------------------------------------------ */

            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "Impossibile leggere il file."
                        )
                    );

                };


            reader.readAsText(
                file
            );

        }
    );

}