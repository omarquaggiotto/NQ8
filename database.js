/* =========================================================
   NQ8 - DATABASE
   Database locale tramite IndexedDB
   ========================================================= */

const DB_NAME = "NQ8_Database";
const DB_VERSION = 1;
const STORE_NAME = "lavori";

let db;


/* =========================================================
   APERTURA DATABASE
   ========================================================= */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );


        /* ---------------------------------------------
           CREAZIONE / AGGIORNAMENTO DATABASE
        --------------------------------------------- */

        request.onupgradeneeded = function (event) {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                const store = database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id",
                        autoIncrement: true
                    }
                );


                /* Indice per il nome del cliente */

                store.createIndex(
                    "cliente",
                    "cliente",
                    {
                        unique: false
                    }
                );


                /* Indice per la data */

                store.createIndex(
                    "data",
                    "data",
                    {
                        unique: false
                    }
                );

            }

        };


        /* ---------------------------------------------
           DATABASE APERTO
        --------------------------------------------- */

        request.onsuccess = function (event) {

            db = event.target.result;

            console.log(
                "NQ8: database aperto correttamente."
            );

            resolve(db);

        };


        /* ---------------------------------------------
           ERRORE
        --------------------------------------------- */

        request.onerror = function (event) {

            console.error(
                "NQ8: errore apertura database.",
                event.target.error
            );

            reject(event.target.error);

        };

    });

}


/* =========================================================
   AGGIUNTA LAVORO
   ========================================================= */

function addJob(job) {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error(
                    "Database non inizializzato."
                )
            );

            return;
        }


        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.add(job);


        transaction.oncomplete = function () {

            resolve(request.result);

        };


        transaction.onabort = function () { reject(transaction.error || new Error("Salvataggio annullato.")); };

        request.onerror = function (event) {

            reject(event.target.error);

        };

    });

}


/* =========================================================
   MODIFICA LAVORO
   ========================================================= */

function updateJob(job) {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error(
                    "Database non inizializzato."
                )
            );

            return;
        }


        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.put(job);


        transaction.oncomplete = function () {

            resolve(request.result);

        };


        transaction.onabort = function () { reject(transaction.error || new Error("Salvataggio annullato.")); };

        request.onerror = function (event) {

            reject(event.target.error);

        };

    });

}


/* =========================================================
   ELIMINAZIONE LAVORO
   ========================================================= */

function deleteJob(id) {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error(
                    "Database non inizializzato."
                )
            );

            return;
        }


        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.delete(id);


        transaction.oncomplete = function () {

            resolve();

        };


        transaction.onabort = function () { reject(transaction.error || new Error("Salvataggio annullato.")); };

        request.onerror = function (event) {

            reject(event.target.error);

        };

    });

}


/* =========================================================
   RECUPERA UN SINGOLO LAVORO
   ========================================================= */

function getJob(id) {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error(
                    "Database non inizializzato."
                )
            );

            return;
        }


        const transaction = db.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.get(id);


        request.onsuccess = function () {

            resolve(request.result);

        };


        request.onerror = function (event) {

            reject(event.target.error);

        };

    });

}


/* =========================================================
   RECUPERA TUTTI I LAVORI
   ========================================================= */

function getAllJobs() {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error(
                    "Database non inizializzato."
                )
            );

            return;
        }


        const transaction = db.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.getAll();


        request.onsuccess = function () {

            resolve(
                request.result || []
            );

        };


        request.onerror = function (event) {

            reject(event.target.error);

        };

    });

}


/* =========================================================
   ELIMINA TUTTI I LAVORI
   ========================================================= */

function clearAllJobs() {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error(
                    "Database non inizializzato."
                )
            );

            return;
        }


        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );


        const request = store.clear();


        transaction.oncomplete = function () {

            resolve();

        };


        transaction.onabort = function () { reject(transaction.error || new Error("Salvataggio annullato.")); };

        request.onerror = function (event) {

            reject(event.target.error);

        };

    });

}


/* =========================================================
   INSERIMENTO MULTIPLO
   Utilizzato durante l'importazione del backup
   ========================================================= */

function addMultipleJobs(jobs, replaceExisting = false) {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error(
                    "Database non inizializzato."
                )
            );

            return;
        }


        const transaction = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(
            STORE_NAME
        );


        transaction.oncomplete = function () {

            resolve();

        };


        transaction.onerror = function (event) {

            reject(event.target.error);

        };


        transaction.onabort = function () {

            reject(
                new Error(
                    "Importazione annullata."
                )
            );

        };


        try {
            // Clear and insert in one transaction: an error rolls back both.
            if (replaceExisting) store.clear();
            jobs.forEach(job => store.add(job));
        } catch (error) {
            transaction.abort();
            reject(error);
        }

    });

}


/* =========================================================
   INIZIALIZZAZIONE
   ========================================================= */

async function initializeDatabase() {

    try {

        await openDatabase();

        console.log(
            "NQ8: database pronto."
        );

        return true;

    } catch (error) {

        console.error(
            "NQ8: impossibile inizializzare il database.",
            error
        );

        return false;

    }

}