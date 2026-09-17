/* =========================================================
   NQ8 - APP
   ========================================================= */


/* =========================================================
   STATO APPLICAZIONE
   ========================================================= */

const state = {

    jobs: [],

    currentPage: "summary",

    editingJobId: null,

    deletingJobId: null

};


/* =========================================================
   ELEMENTI DOM
   ========================================================= */

const elements = {};


/* =========================================================
   AVVIO APP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


async function initializeApp() {

    cacheElements();

    setupNavigation();

    setupModalEvents();

    setupJobForm();

    setupFilters();

    setupSummary();

    setupSettings();

    setDefaultDate();

    await initializeDatabase();

    await refreshJobs();

    updateSummary();

    updateMonthOptions();

}


/* =========================================================
   CACHE ELEMENTI
   ========================================================= */

function cacheElements() {

    elements.pages =
        document.querySelectorAll(".page");


    elements.navButtons =
        document.querySelectorAll(".nav-button");


    elements.newJobButton =
        document.getElementById("newJobButton");


    elements.settingsButton =
        document.getElementById("settingsButton");


    elements.jobModal =
        document.getElementById("jobModal");


    elements.deleteModal =
        document.getElementById("deleteModal");


    elements.closeJobModal =
        document.getElementById("closeJobModal");


    elements.cancelJob =
        document.getElementById("cancelJob");


    elements.jobForm =
        document.getElementById("jobForm");


    elements.jobModalTitle =
        document.getElementById("jobModalTitle");


    elements.jobId =
        document.getElementById("jobId");


    elements.clientName =
        document.getElementById("clientName");

   elements.jobDescription =
    document.getElementById("jobDescription");


    elements.jobDate =
        document.getElementById("jobDate");


    elements.jobCost =
        document.getElementById("jobCost");


    elements.jobRevenue =
        document.getElementById("jobRevenue");


    elements.jobProfitPreview =
        document.getElementById(
            "jobProfitPreview"
        );


    elements.jobsList =
        document.getElementById("jobsList");


    elements.filterYear =
        document.getElementById("filterYear");


    elements.filterMonth =
        document.getElementById("filterMonth");


    elements.filterDay =
        document.getElementById("filterDay");


    elements.filterClient =
        document.getElementById("filterClient");


    elements.resetFilters =
        document.getElementById(
            "resetFilters"
        );


    elements.cancelDelete =
        document.getElementById(
            "cancelDelete"
        );


    elements.confirmDelete =
        document.getElementById(
            "confirmDelete"
        );


    elements.exportData =
        document.getElementById(
            "exportData"
        );


    elements.importData =
        document.getElementById(
            "importData"
        );


    elements.importFile =
        document.getElementById(
            "importFile"
        );

}


/* =========================================================
   NAVIGAZIONE
   ========================================================= */

function setupNavigation() {

    elements.navButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;

                if (page) {

                    showPage(page);

                }

            }
        );

    });


    elements.settingsButton.addEventListener(
        "click",
        () => {

            showPage("settings");

        }
    );


    elements.newJobButton.addEventListener(
        "click",
        () => {

            openNewJobModal();

        }
    );

}


function showPage(pageName) {

    state.currentPage =
        pageName;


    elements.pages.forEach(page => {

        page.classList.remove(
            "active"
        );

    });


    const targetPage =
        document.getElementById(
            `page-${pageName}`
        );


    if (targetPage) {

        targetPage.classList.add(
            "active"
        );

    }


    elements.navButtons.forEach(button => {

        button.classList.remove(
            "active"
        );


        if (
            button.dataset.page ===
            pageName
        ) {

            button.classList.add(
                "active"
            );

        }

    });


    if (pageName === "summary") {

        updateSummary();

    }


    if (pageName === "jobs") {

        renderJobs();

    }

}


/* =========================================================
   MODALE NUOVO / MODIFICA
   ========================================================= */

function setupModalEvents() {

    const updateModalViewport = () => {
        const viewport = window.visualViewport;
        document.documentElement.style.setProperty("--modal-viewport-height", `${viewport ? viewport.height : window.innerHeight}px`);
        document.documentElement.style.setProperty("--modal-viewport-top", `${viewport ? viewport.offsetTop : 0}px`);
    };
    updateModalViewport();
    window.addEventListener("resize", updateModalViewport);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateModalViewport);
        window.visualViewport.addEventListener("scroll", updateModalViewport);
    }
    const modalObserver = new MutationObserver(() => {
        const open = !elements.jobModal.classList.contains("hidden") ||
            !elements.deleteModal.classList.contains("hidden");
        document.body.classList.toggle("modal-open", open);
        if (open) updateModalViewport();
    });
    [elements.jobModal, elements.deleteModal].forEach(modal => {
        modalObserver.observe(modal, {attributes: true, attributeFilter: ["class"]});
    });

    elements.closeJobModal.addEventListener(
        "click",
        closeJobModal
    );


    elements.cancelJob.addEventListener(
        "click",
        closeJobModal
    );


    elements.jobModal
        .querySelector(".modal-overlay")
        .addEventListener(
            "click",
            closeJobModal
        );


    elements.deleteModal
        .querySelector(".modal-overlay")
        .addEventListener(
            "click",
            closeDeleteModal
        );


    elements.cancelDelete.addEventListener(
        "click",
        closeDeleteModal
    );


    elements.confirmDelete.addEventListener(
        "click",
        confirmDelete
    );

}


function openNewJobModal() {

    state.editingJobId =
        null;


    elements.jobModalTitle.textContent =
        "Nuovo lavoro";


    elements.jobForm.reset();


    elements.jobId.value =
        "";


    setDefaultDate();


    updateProfitPreview();


    elements.jobModal.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        elements.clientName.focus();

    }, 100);

}


function openEditJobModal(id) {

    const job =
        state.jobs.find(
            item => item.id === id
        );


    if (!job) {

        return;

    }


    state.editingJobId =
        id;


    elements.jobModalTitle.textContent =
        "Modifica lavoro";


    elements.jobId.value =
        job.id;


    elements.clientName.value =
        job.cliente;

    elements.jobDescription.value =
        job.descrizione || "";

    elements.jobDate.value =
        job.data;


    elements.jobCost.value =
        job.costo;


    elements.jobRevenue.value =
        job.ricavo;


    updateProfitPreview();


    elements.jobModal.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        elements.clientName.focus();

    }, 100);

}


function closeJobModal() {

    elements.jobModal.classList.add(
        "hidden"
    );

    state.editingJobId =
        null;

}


/* =========================================================
   FORM LAVORO
   ========================================================= */

function setupJobForm() {

    elements.jobForm.addEventListener(
        "submit",
        saveJob
    );


    elements.jobCost.addEventListener(
        "input",
        updateProfitPreview
    );


    elements.jobRevenue.addEventListener(
        "input",
        updateProfitPreview
    );

}


function saveJob(event) {

    event.preventDefault();


    const cliente =
        elements.clientName.value.trim();

    const descrizione =
        elements.jobDescription.value.trim();

    const data =
        elements.jobDate.value;


    const costo =
        parseFloat(
            elements.jobCost.value
        ) || 0;


    const ricavo =
        parseFloat(
            elements.jobRevenue.value
        ) || 0;


    if (!cliente) {

        alert(
            "Inserisci il nome del cliente."
        );

        return;

    }


    if (!data) {

        alert(
            "Inserisci la data del lavoro."
        );

        return;

    }


    if (costo < 0 || ricavo < 0) {

        alert(
            "Costo e ricavo non possono essere negativi."
        );

        return;

    }


    const now =
        new Date().toISOString();


    if (state.editingJobId !== null) {

        const existingJob =
            state.jobs.find(
                job =>
                    job.id ===
                    state.editingJobId
            );


        if (!existingJob) {

            return;

        }


        const updatedJob = {

            ...existingJob,

            cliente,

            data,

            descrizione,

            costo,

            ricavo,

            modificatoIl: now

        };


        updateJob(updatedJob)
            .then(async () => {

                closeJobModal();

                await refreshJobs();

                showPage("jobs");

            })
            .catch(handleDatabaseError);


    } else {

        const newJob = {

            cliente,

            descrizione,

            data,

            costo,

            ricavo,

            creatoIl: now,

            modificatoIl: now

        };


        addJob(newJob)
            .then(async () => {

                closeJobModal();

                await refreshJobs();

                updateSummary();

                showPage("summary");

            })
            .catch(handleDatabaseError);

    }

}


/* =========================================================
   CALCOLO GUADAGNO
   ========================================================= */

function calculateProfit(job) {

    return (
        Number(job.ricavo || 0) -
        Number(job.costo || 0)
    );

}


function updateProfitPreview() {

    const costo =
        parseFloat(
            elements.jobCost.value
        ) || 0;


    const ricavo =
        parseFloat(
            elements.jobRevenue.value
        ) || 0;


    const profit =
        ricavo - costo;


    elements.jobProfitPreview.textContent =
        formatCurrency(profit);

}


/* =========================================================
   DEFAULT DATA
   ========================================================= */

function setDefaultDate() {

    if (!elements.jobDate) {

        return;

    }


    if (
        !elements.jobDate.value ||
        state.editingJobId === null
    ) {

        elements.jobDate.value =
            getLocalDateString();

    }

}


function getLocalDateString(date = new Date()) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   REFRESH LAVORI
   ========================================================= */

async function refreshJobs() {

    try {

        state.jobs =
            await getAllJobs();


        state.jobs.sort(
            (a, b) => {

                if (a.data !== b.data) {

                    return b.data.localeCompare(
                        a.data
                    );

                }

                return (
                    Number(b.id) -
                    Number(a.id)
                );

            }
        );


        updateFilterOptions();

        renderJobs();

        updateSummary();

    } catch (error) {

        handleDatabaseError(error);

    }

}


/* =========================================================
   RENDER LAVORI
   ========================================================= */

function renderJobs() {

    if (!elements.jobsList) {

        return;

    }


    const filteredJobs =
        getFilteredJobs();


    if (filteredJobs.length === 0) {

        elements.jobsList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    Nessun lavoro
                </h3>

                <p>
                    Non ci sono lavori
                    corrispondenti ai filtri.
                </p>

            </div>

        `;

        return;

    }


    elements.jobsList.innerHTML =
        filteredJobs
            .map(renderJobCard)
            .join("");


    attachJobCardEvents();

}


function renderJobCard(job) {

    const profit =
        calculateProfit(job);


    return `

        <article
            class="job-card"
            data-job-id="${job.id}"
        >

            <div class="job-card-header">

                <div class="job-client">
                    ${escapeHtml(job.cliente)}
                </div>

                <div class="job-date">
                    ${formatDate(job.data)}
                </div>

            </div>

               ${job.descrizione ? `
                <div class="job-description">
                    ${escapeHtml(job.descrizione)}
                      </div>
               ` : ""}

            <div class="job-details">

                <div class="job-detail">

                    <span>
                        Costo
                    </span>

                    <strong>
                        ${formatCurrency(job.costo)}
                    </strong>

                </div>


                <div class="job-detail">

                    <span>
                        Ricavo
                    </span>

                    <strong>
                        ${formatCurrency(job.ricavo)}
                    </strong>

                </div>


                <div class="job-detail profit">

                    <span>
                        Guadagno
                    </span>

                    <strong>
                        ${formatCurrency(profit)}
                    </strong>

                </div>

            </div>


            <div class="job-actions">

                <button
                    class="job-action-button edit-job-button"
                    data-edit-id="${job.id}"
                    type="button"
                >
                    Modifica
                </button>


                <button
                    class="job-action-button delete-job-button"
                    data-delete-id="${job.id}"
                    type="button"
                >
                    Elimina
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   EVENTI SCHEDE LAVORI
   ========================================================= */

function attachJobCardEvents() {

    const editButtons =
        document.querySelectorAll(
            ".edit-job-button"
        );


    editButtons.forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const id =
                    Number(
                        button.dataset.editId
                    );


                openEditJobModal(id);

            }
        );

    });


    const deleteButtons =
        document.querySelectorAll(
            ".delete-job-button"
        );


    deleteButtons.forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const id =
                    Number(
                        button.dataset.deleteId
                    );


                openDeleteModal(id);

            }
        );

    });

}


/* =========================================================
   ELIMINAZIONE
   ========================================================= */

function openDeleteModal(id) {

    const job =
        state.jobs.find(
            item => item.id === id
        );


    if (!job) {

        return;

    }


    state.deletingJobId =
        id;


    elements.deleteModal.classList.remove(
        "hidden"
    );

}


function closeDeleteModal() {

    elements.deleteModal.classList.add(
        "hidden"
    );

    state.deletingJobId =
        null;

}


async function confirmDelete() {

    if (state.deletingJobId === null) {

        return;

    }


    try {

        await deleteJob(
            state.deletingJobId
        );


        closeDeleteModal();

        await refreshJobs();

        showPage("jobs");

    } catch (error) {

        handleDatabaseError(error);

    }

}


/* =========================================================
   FILTRI
   ========================================================= */

function setupFilters() {

    elements.filterYear.addEventListener(
        "change",
        () => {

            updateDayFilter();

            renderJobs();

        }
    );


    elements.filterMonth.addEventListener(
        "change",
        () => {

            updateDayFilter();

            renderJobs();

        }
    );


    elements.filterDay.addEventListener(
        "change",
        renderJobs
    );


    elements.filterClient.addEventListener(
        "input",
        renderJobs
    );


    elements.resetFilters.addEventListener(
        "click",
        resetFilters
    );

}


function getFilteredJobs() {

    const year =
        elements.filterYear.value;


    const month =
        elements.filterMonth.value;


    const day =
        elements.filterDay.value;


    const client =
        elements.filterClient.value
            .trim()
            .toLowerCase();


    return state.jobs.filter(job => {

        const parts =
            job.data.split("-");


        const jobYear =
            parts[0];


        const jobMonth =
            parts[1];


        const jobDay =
            parts[2];


        if (
            year &&
            jobYear !== year
        ) {

            return false;

        }


        if (
            month &&
            jobMonth !== month
        ) {

            return false;

        }


        if (
            day &&
            jobDay !== day
        ) {

            return false;

        }


        if (
            client &&
            !job.cliente
                .toLowerCase()
                .includes(client)
        ) {

            return false;

        }


        return true;

    });

}


function resetFilters() {

    elements.filterYear.value =
        "";

    elements.filterMonth.value =
        "";

    elements.filterDay.innerHTML = `

        <option value="">
            Tutti
        </option>

    `;

    elements.filterDay.value =
        "";

    elements.filterClient.value =
        "";

    renderJobs();

}


/* =========================================================
   OPZIONI FILTRI
   ========================================================= */

function updateFilterOptions() {

    const currentYear =
        elements.filterYear.value;


    const years =
        [
            ...new Set(
                [currentYear, ...state.jobs.map(
                    job =>
                        job.data.substring(
                            0,
                            4
                        )
                )].filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                Number(b) -
                Number(a)
        );


    elements.filterYear.innerHTML = `

        <option value="">
            Tutti
        </option>

        ${years
            .map(
                year =>
                    `<option value="${year}">
                        ${year}
                    </option>`
            )
            .join("")}

    `;


    if (
        years.includes(currentYear)
    ) {

        elements.filterYear.value =
            currentYear;

    }


    updateDayFilter();

}


function updateDayFilter() {

    const selectedYear =
        elements.filterYear.value;


    const selectedMonth =
        elements.filterMonth.value;


    const currentDay =
        elements.filterDay.value;


    let days = [];


    state.jobs.forEach(job => {

        const parts =
            job.data.split("-");


        const year =
            parts[0];


        const month =
            parts[1];


        const day =
            parts[2];


        if (
            selectedYear &&
            year !== selectedYear
        ) {

            return;

        }


        if (
            selectedMonth &&
            month !== selectedMonth
        ) {

            return;

        }


        days.push(day);

    });


    const maxDay = selectedMonth
        ? new Date(Number(selectedYear) || 2000, Number(selectedMonth), 0).getDate()
        : 31;
    if (currentDay && Number(currentDay) <= maxDay) days.push(currentDay);

    days =
        [
            ...new Set(days)
        ]
        .sort(
            (a, b) =>
                Number(a) -
                Number(b)
        );


    elements.filterDay.innerHTML = `

        <option value="">
            Tutti
        </option>

        ${days
            .map(
                day =>
                    `<option value="${day}">
                        ${Number(day)}
                    </option>`
            )
            .join("")}

    `;


    if (
        days.includes(currentDay)
    ) {

        elements.filterDay.value =
            currentDay;

    }

}


/* =========================================================
   RIEPILOGO
   ========================================================= */

function setupSummary() {
    ["summaryPeriod", "summaryDate", "summaryMonth", "summaryYear",
     "summaryDateField", "summaryMonthField", "summaryYearField",
     "viewSummaryJobs", "summaryEmpty", "summaryError"].forEach(id => {
        elements[id] = document.getElementById(id);
    });
    const today = getLocalDateString();
    elements.summaryDate.value = today;
    elements.summaryYear.value = today.slice(0, 4);
    for (let month = 1; month <= 12; month++) {
        const label = new Intl.DateTimeFormat("it-IT", {month: "long"})
            .format(new Date(2000, month - 1, 1));
        elements.summaryMonth.add(new Option(label, String(month).padStart(2, "0")));
    }
    elements.summaryMonth.value = today.slice(5, 7);
    elements.summaryPeriod.addEventListener("change", updateSummary);
    elements.summaryDate.addEventListener("change", () => {
        if (elements.summaryDate.value && elements.summaryDate.validity.valid) {
            elements.summaryYear.value = elements.summaryDate.value.slice(0, 4);
            elements.summaryMonth.value = elements.summaryDate.value.slice(5, 7);
        }
        updateSummary();
    });
    const syncDate = () => {
        const year = Number(elements.summaryYear.value);
        const month = Number(elements.summaryMonth.value);
        if (elements.summaryYear.validity.valid && year >= 1 && year <= 9999) {
            const date = new Date(2000, month, 0);
            date.setFullYear(year);
            // Recompute month end after setting the year (including leap years).
            date.setMonth(month, 0);
            const day = Math.min(Number(elements.summaryDate.value.slice(8, 10)) || 1, date.getDate());
            elements.summaryDate.value = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
        updateSummary();
    };
    elements.summaryMonth.addEventListener("change", syncDate);
    elements.summaryYear.addEventListener("change", syncDate);
    elements.viewSummaryJobs.addEventListener("click", openSummaryJobs);
}

function getSummaryPeriod() {
    const mode = elements.summaryPeriod.value;
    if (mode === "all") return {year: "", month: "", day: "", prefix: "", label: "Sempre"};
    if (mode === "day") {
        const date = elements.summaryDate.value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !elements.summaryDate.validity.valid) return null;
        const [year, month, day] = date.split("-");
        return {year, month, day, prefix: date, label: formatDate(date)};
    }
    const input = elements.summaryYear;
    const number = Number(input.value);
    if (!input.value || !input.validity.valid || !Number.isInteger(number) || number < 1 || number > 9999) return null;
    const year = String(number).padStart(4, "0");
    if (mode === "month") {
        const month = elements.summaryMonth.value;
        const label = elements.summaryMonth.selectedOptions[0].textContent;
        return {year, month, day: "", prefix: `${year}-${month}-`, label: `${label} ${year}`};
    }
    return {year, month: "", day: "", prefix: `${year}-`, label: year};
}

function updateSummary() {
    if (!elements.summaryPeriod) return;
    updateSummaryYears();
    setText("summaryDateDisplay", formatDate(elements.summaryDate.value) || "Seleziona data");
    const mode = elements.summaryPeriod.value;
    elements.summaryDateField.hidden = mode !== "day";
    elements.summaryMonthField.hidden = mode !== "month";
    elements.summaryYearField.hidden = mode === "day" || mode === "all";
    const period = getSummaryPeriod();
    const jobs = period ? state.jobs.filter(job => job.data.startsWith(period.prefix)) : [];
    const totals = calculateSummary(jobs);
    const noYears = elements.summaryYear.disabled && (mode === "month" || mode === "year");
    setText("summaryHeading", period ? period.label : noYears ? "Nessun lavoro registrato" : "Periodo non valido");
    setText("summaryJobs", period || noYears ? totals.jobs : "—");
    for (const [id, key] of [["summaryCosts", "costs"], ["summaryRevenue", "revenue"], ["summaryProfit", "profit"]]) {
        setText(id, period || noYears ? formatCurrency(totals[key]) : "—");
    }
    elements.summaryEmpty.hidden = !period || jobs.length > 0;
    elements.summaryError.hidden = Boolean(period) || noYears;
    elements.viewSummaryJobs.disabled = !period;
    setText("viewSummaryJobs", {day: "Vedi lavori del giorno", month: "Vedi lavori del mese", year: "Vedi lavori dell’anno", all: "Vedi tutti i lavori"}[mode]);
}

function updateSummaryYears() {
    const select = elements.summaryYear;
    const previous = select.value;
    const years = [...new Set(state.jobs.map(job => job.data.slice(0, 4)))].sort((a, b) => Number(b) - Number(a));
    const available = Array.from(select.options).map(option => option.value);
    if (available.join(",") !== years.join(",") || select.disabled !== (years.length === 0)) {
        select.replaceChildren();
        years.forEach(year => select.add(new Option(year, year)));
        if (!years.length) select.add(new Option("Nessun anno disponibile", ""));
    }
    select.disabled = years.length === 0;
    const dateYear = elements.summaryDate.value.slice(0, 4);
    const currentYear = getLocalDateString().slice(0, 4);
    select.value = [previous, dateYear, currentYear, years[0]].find(year => years.includes(year)) || "";
}

function selectFilterValue(select, value) {
    if (value && !Array.from(select.options).some(option => option.value === value)) {
        select.add(new Option(String(Number(value)), value));
    }
    select.value = value;
}

function openSummaryJobs() {
    const period = getSummaryPeriod();
    if (!period) return;
    selectFilterValue(elements.filterYear, period.year);
    elements.filterMonth.value = period.month;
    elements.filterDay.value = "";
    updateDayFilter();
    selectFilterValue(elements.filterDay, period.day);
    elements.filterClient.value = "";
    showPage("jobs");
    window.scrollTo(0, 0);
}


function calculateSummary(jobs) {

    let costs = 0;
    let revenue = 0;


    jobs.forEach(job => {

        costs +=
            Number(job.costo) || 0;


        revenue +=
            Number(job.ricavo) || 0;

    });


    return {

        jobs: jobs.length,

        costs,

        revenue,

        profit:
            revenue - costs

    };

}


/* =========================================================
   DATE LABELS
   ========================================================= */

function updateMonthOptions() {

    const months = [

        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre"

    ];


    const current =
        elements.filterMonth.value;


    elements.filterMonth.innerHTML = `

        <option value="">
            Tutti
        </option>

        ${months
            .map(
                (month, index) => {

                    const value =
                        String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        );


                    return `
                        <option value="${value}">
                            ${month}
                        </option>
                    `;

                }
            )
            .join("")}

    `;


    elements.filterMonth.value =
        current;

}


/* =========================================================
   IMPOSTAZIONI
   ========================================================= */

function setupSettings() {

    elements.exportData.addEventListener(
        "click",
        async () => {

            if (
                typeof exportDatabaseBackup ===
                "function"
            ) {

                await exportDatabaseBackup(
                    state.jobs
                );

            }

        }
    );


    elements.importData.addEventListener(
        "click",
        () => {

            elements.importFile.click();

        }
    );


    elements.importFile.addEventListener(
        "change",
        handleImportFile
    );

}


async function handleImportFile(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    if (
        typeof importDatabaseBackup !==
        "function"
    ) {

        alert(
            "Funzione di importazione non disponibile."
        );

        return;

    }


    try {

        const importedJobs =
            await importDatabaseBackup(
                file
            );


        if (
            !Array.isArray(
                importedJobs
            )
        ) {

            throw new Error(
                "Backup non valido."
            );

        }


        const confirmed =
            confirm(
                `Il backup contiene ${importedJobs.length} lavori.\n\n` +
                `Vuoi sostituire i dati presenti sul dispositivo?`
            );


        if (!confirmed) {

            event.target.value =
                "";

            return;

        }


        await addMultipleJobs(importedJobs, true);

        await refreshJobs();


        alert(
            "Importazione completata."
        );


        showPage("summary");

    } catch (error) {

        console.error(
            "Errore importazione:",
            error
        );


        alert(
            "Impossibile importare il backup."
        );

    }


    event.target.value =
        "";

}


/* =========================================================
   FORMATTAZIONE
   ========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return new Intl.NumberFormat(
        "it-IT",
        {
            style: "currency",
            currency: "EUR"
        }
    ).format(number);

}


function formatDate(dateString) {

    if (!dateString) {

        return "";

    }


    const parts =
        dateString.split("-");


    if (
        parts.length !== 3
    ) {

        return dateString;

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


/* =========================================================
   TESTO SICURO HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   HELPER DOM
   ========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   ERRORI DATABASE
   ========================================================= */

function handleDatabaseError(error) {

    console.error(
        "NQ8 - Errore:",
        error
    );


    alert(
        "Si è verificato un errore. Riprova."
    );

}
