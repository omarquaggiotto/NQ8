/* Pagamenti additivi: ricavo resta l'unica fonte del totale lavoro.
   Per scelta di Omar, i record precedenti sono pagati con data sconosciuta. */
const PAYMENT_LABELS = {unpaid: "Da pagare", partial: "Acconto ricevuto", paid: "Pagato"};

function paymentRecord(job) {
    return job.pagamento === undefined ? {stato: "paid", acconto: 0,
        dataAcconto: null, dataPagamento: null, storico: true} : job.pagamento;
}

function paymentCents(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
        !Number.isSafeInteger(Math.round(value * 100))) throw new Error("Importo pagamento non valido.");
    return Math.round(value * 100);
}

function validatePayment(job) {
    if (job.pagamento === undefined) return;
    const p = job.pagamento;
    if (!p || !Object.hasOwn(PAYMENT_LABELS, p.stato)) throw new Error("Stato pagamento non valido.");
    const total = paymentCents(Number(job.ricavo));
    const deposit = paymentCents(p.acconto);
    if (Math.abs(p.acconto * 100 - deposit) > 0.000001 || deposit > total || (p.stato === "unpaid" && deposit !== 0) ||
        (p.stato === "partial" && deposit >= total)) throw new Error("Acconto incoerente con il totale lavoro.");
    for (const key of ["dataAcconto", "dataPagamento"]) {
        const value = p[key];
        if (value !== null && (typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
            !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value)) {
            throw new Error("Data pagamento non valida.");
        }
    }
    const historical = p.storico === true && p.stato === "paid" && deposit === 0 && p.dataPagamento === null;
    if ((p.storico !== undefined && !historical) || (deposit > 0) !== (p.dataAcconto !== null) ||
        (!historical && (p.stato === "paid") !== (p.dataPagamento !== null)) ||
        (p.dataAcconto && p.dataPagamento && p.dataAcconto > p.dataPagamento)) {
        throw new Error("Date incoerenti con il pagamento.");
    }
}

function paymentAmounts(job) {
    validatePayment(job);
    const total = paymentCents(Number(job.ricavo));
    const p = paymentRecord(job);
    const received = p.stato === "paid" ? total : paymentCents(p.acconto);
    return {known: true, received: received / 100, remaining: (total - received) / 100};
}

function buildPayment(previous, total, status, deposit, now = new Date().toISOString()) {
    const totalCents = paymentCents(total);
    const old = previous ? paymentRecord(previous) : null;
    if (old?.storico && status === "paid" && paymentCents(Number(previous.ricavo)) === totalCents) return {...old};
    let amount = status === "partial" ? paymentCents(deposit) :
        status === "paid" ? paymentCents(old?.acconto || 0) : 0;
    if (status === "partial" && Math.abs(deposit * 100 - amount) > 0.000001) throw new Error("Usa al massimo due decimali per l’acconto.");
    if (amount > totalCents) throw new Error("L’acconto non può superare il totale lavoro.");
    if (status === "partial" && amount === totalCents) status = "paid";
    const p = {
        stato: status,
        acconto: amount / 100,
        dataAcconto: amount > 0 ? old?.dataAcconto || now : null,
        dataPagamento: status === "paid" ?
            (old?.stato === "paid" && paymentCents(Number(previous.ricavo)) === totalCents ? old.dataPagamento : now) : null
    };
    validatePayment({ricavo: total, pagamento: p});
    return p;
}

function paymentTotals(jobs) {
    return jobs.reduce((totals, job) => {
        const amount = paymentAmounts(job);
        if (!amount.known) totals.unknown++;
        else {
            totals.received += paymentCents(amount.received);
            totals.remaining += paymentCents(amount.remaining);
        }
        return totals;
    }, {received: 0, remaining: 0, unknown: 0});
}
