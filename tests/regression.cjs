/* node tests/regression.cjs; richiede Playwright e Microsoft Edge (o CHROME_PATH). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const code = name => fs.readFileSync(path.join(root, name), 'utf8');
let passed = 0;
async function test(name, run) { await run(); console.log('PASS ' + name); passed++; }
const sandbox = vm.createContext({console});
vm.runInContext(code('payments.js'), sandbox);
const run = expression => JSON.parse(JSON.stringify(vm.runInContext(expression, sandbox)));
async function main() {
 await test('500 unpaid / 200 deposit / balance; existing economic value untouched', () => {
  const x = run(`(() => { const a={ricavo:500,pagamento:buildPayment(null,500,'unpaid',0)};
   const b={...a,pagamento:buildPayment(a,500,'partial',200)};
   const c={...b,pagamento:buildPayment(b,500,'paid',0)};
   return [paymentAmounts(a),paymentAmounts(b),paymentAmounts(c),c.ricavo,c.pagamento.acconto]; })()`);
  assert.deepEqual(x.map(v=>v?.remaining).slice(0,3),[500,300,0]);
  assert.equal(x[1].received,200); assert.equal(x[3],500); assert.equal(x[4],200);
 });
 await test('dates: first deposit retained; paid edit retained; reopening and new balance', () => {
  const x=run(`(() => { const t='2026-09-20T10:00:00.000Z', u='2026-09-21T10:00:00.000Z';
   const a={ricavo:500,pagamento:buildPayment(null,500,'partial',200,t)};
   const b={ricavo:500,pagamento:buildPayment(a,500,'partial',250,u)};
   const c={ricavo:500,pagamento:buildPayment(b,500,'paid',0,u)};
   return [b.pagamento.dataAcconto,buildPayment(c,500,'paid',0).dataPagamento,
    buildPayment(c,500,'partial',200).dataPagamento,buildPayment(c,600,'paid',0,t).dataPagamento]; })()`);
  assert.deepEqual(x,['2026-09-20T10:00:00.000Z','2026-09-21T10:00:00.000Z',null,'2026-09-20T10:00:00.000Z']);
 });
 await test('invalid amounts, invalid dates, malformed payment states rejected', () => {
  for(const amount of ['-1','501','NaN','Infinity','200.001']) assert.throws(()=>run(`buildPayment(null,500,'partial',${amount})`));
  assert.throws(()=>run(`buildPayment({ricavo:500,pagamento:buildPayment(null,500,'partial',200)},100,'partial',200)`));
  assert.throws(()=>run(`validatePayment({ricavo:500,pagamento:{stato:'paid',acconto:0,dataAcconto:null,dataPagamento:'yesterday'}})`));
  assert.throws(()=>run(`validatePayment({ricavo:500,pagamento:null})`));
 });
 await test('direct paid, full deposit normalization, cents and historical paid without fake date', () => {
  assert.equal(run(`buildPayment(null,500,'partial',500).stato`),'paid');
  assert.equal(run(`paymentAmounts({ricavo:0.3,pagamento:buildPayment(null,0.3,'partial',0.1)}).remaining`),0.2);
  assert.equal(run(`paymentAmounts({ricavo:500,pagamento:buildPayment(null,500,'paid',0)}).remaining`),0);
  assert.equal(run(`paymentAmounts({ricavo:500}).received`),500);
  assert.deepEqual(run(`buildPayment({ricavo:500},500,'paid',0)`),{stato:'paid',acconto:0,dataAcconto:null,dataPagamento:null,storico:true});
 });
 const errors=[];
 let baseline = null;
 const server=http.createServer((req,res)=>{
  const relative=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'')||'index.html';
  const target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep) || !fs.existsSync(target)) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(target)]||'text/plain');
  res.setHeader('Cache-Control','no-store');res.end(baseline?.[relative] || fs.readFileSync(target));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 let browser;
 try {
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 let page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 await page.goto(url);await page.waitForFunction(()=>typeof state!=='undefined' && !!db);
 async function create(name,status,amount=0) {
  await page.locator('#newJobButton').click();await page.locator('#clientName').fill(name);
  await page.locator('#jobCost').fill('100');await page.locator('#jobRevenue').fill('500');
  await page.locator('#paymentStatus').selectOption(status);
  if(status==='partial') await page.locator('#paymentDeposit').fill(String(amount));
  await page.locator('#jobForm button[type=submit]').click();
  await page.waitForFunction(()=>document.getElementById('jobModal').classList.contains('hidden'));
 }
 await test('UI creates unpaid and partial; summary links open work; overpayment blocks save',async()=>{
  await create('Da pagare','unpaid');await create('Acconto','partial',200);
  assert.match(await page.locator('#paymentRemaining').innerText(),/800/);
  assert.equal(await page.locator('#paymentReceived').count(),0);
  assert.equal(await page.evaluate(()=>paymentTotals(state.jobs).received),20000);
  assert.equal(await page.locator('#unpaidCount').innerText(),'2 lavori');
  assert.equal(await page.locator('.unpaid-job').count(),2);
  await page.locator('.unpaid-job').filter({hasText:'Acconto'}).click();
  await page.locator('#jobRevenue').fill('150');
  assert.equal(await page.locator('#paymentDeposit').evaluate(e=>e.checkValidity()),false);
  await page.locator('#jobForm button[type=submit]').click();
  assert.equal(await page.locator('#jobModal').isVisible(),true);
  await page.locator('#jobRevenue').fill('600');
  await page.locator('#jobForm button[type=submit]').click();await page.waitForFunction(()=>state.jobs.some(j=>j.cliente==='Acconto' && j.ricavo===600));
 });
 await test('quick balance removes insolvent; direct paid never insolvent; full deposit UX',async()=>{
  await page.locator('[data-page=summary]').click();
  await page.locator('.unpaid-item').filter({hasText:'Acconto'}).locator('[data-receivable-paid]').click();
  await page.waitForFunction(()=>state.jobs.find(j=>j.cliente==='Acconto').pagamento.stato==='paid');
  assert.equal(await page.locator('.unpaid-job').count(),1);
  await create('Subito pagato','paid');await create('Acconto completo','partial',500);
  assert.equal(await page.locator('.unpaid-job').count(),1);
  const jobs=await page.evaluate(()=>state.jobs);
  assert.equal(jobs.find(j=>j.cliente==='Acconto completo').pagamento.stato,'paid');
 });
 await test('IndexedDB close/reopen, reload and legacy DB v1 retain records and dates',async()=>{
  await page.evaluate(async()=>{await addJob({cliente:'Storico',data:'2024-02-29',costo:50,ricavo:300,descrizione:'Legacy',custom:'preserve'});await refreshJobs();});
  const before=await page.evaluate(()=>getAllJobs());
  await page.evaluate(()=>db.close());await page.reload();await page.waitForFunction(()=>!!db && state.jobs.length===5);
  assert.deepEqual(await page.evaluate(()=>getAllJobs()),before);
  assert.equal(await page.evaluate(()=>db.version),1);
  await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(url);await page.waitForFunction(()=>state.jobs.length===5);
  assert.deepEqual(await page.evaluate(()=>getAllJobs()),before);
  assert.equal(await page.evaluate(()=>paymentAmounts(state.jobs.find(j=>j.cliente==='Storico')).received),300);
 });
 await test('v2 export/restore roundtrip and automatic safety backup retain payments and extra fields',async()=>{
  const before=await page.evaluate(()=>getAllJobs());
  const downloadPromise=page.waitForEvent('download');
  await page.evaluate(()=>exportDatabaseBackup(state.jobs));
  const download=await downloadPromise;
  const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(backup.version,2);
  assert.deepEqual(backup.jobs.find(j=>j.cliente==='Acconto').pagamento,before.find(j=>j.cliente==='Acconto').pagamento);
  const safetyPromise=page.waitForEvent('download');
  await page.locator('#importFile').setInputFiles({name:'new.nq8',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  const safety=await safetyPromise;
  assert.match(safety.suggestedFilename(),/sicurezza/);
  assert.deepEqual(JSON.parse(fs.readFileSync(await safety.path(),'utf8')).jobs,before);
  await page.waitForFunction(()=>state.jobs.length===5);
  const restored=await page.evaluate(()=>getAllJobs());
  for(const job of before) {
   const actual=restored.find(j=>j.id===job.id);
   assert.equal(actual.custom,job.custom);
   assert.deepEqual(actual.pagamento,job.pagamento);
  }
 });
 await test('legacy backup paid without timestamp; invalid backup and transactional rollback lose no data',async()=>{
  const result=await page.evaluate(async()=>{
   const legacy={id:90,cliente:'Vecchio backup',data:'2020-01-01',costo:0,ricavo:500};
   const parsed=await importDatabaseBackup(new File([JSON.stringify({app:'NQ8',version:1,jobs:[legacy]})],'old.nq8'));
   const before=await getAllJobs();let rejected=false;
   try {await addMultipleJobs([parsed[0],parsed[0]],true);}catch {rejected=true;}
   const after=await getAllJobs();
   let invalid=false;
   try {await importDatabaseBackup(new File([JSON.stringify({app:'NQ8',version:2,jobs:[{...legacy,pagamento:{stato:'partial',acconto:900}}]})],'bad.nq8'));}catch{invalid=true;}
   return {rejected,invalid,same:JSON.stringify(before)===JSON.stringify(after),paid:paymentAmounts(parsed[0]),date:paymentRecord(parsed[0]).dataPagamento};
  });
  assert.equal(result.rejected,true);assert.equal(result.invalid,true);assert.equal(result.same,true);assert.equal(result.paid.received,500);assert.equal(result.date,null);
 });
 await test('existing economic summary and periods/filters still mean job value',async()=>{
  await page.locator('#summaryPeriod').selectOption('all');
  assert.match(await page.locator('#summaryRevenue').innerText(),/2\.?400/);
  assert.match(await page.locator('#summaryCosts').innerText(),/450/);
  assert.match(await page.locator('#summaryProfit').innerText(),/1\.?950/);
  await page.locator('#summaryPeriod').selectOption('year');await page.locator('#summaryYear').selectOption('2024');
  assert.equal(await page.locator('#summaryJobs').innerText(),'1');
  await page.locator('#viewSummaryJobs').click();assert.equal(await page.locator('.job-card').count(),1);
  assert.match(await page.locator('.job-card').innerText(),/Storico/);
  await page.locator('#resetFilters').click();assert.equal(await page.locator('.job-card').count(),5);
  await page.locator('#filterClient').fill('Subito');assert.equal(await page.locator('.job-card').count(),1);
  await page.locator('.delete-job-button').click();await page.locator('#confirmDelete').click();
  await page.waitForFunction(()=>state.jobs.length===4);
  await page.locator('[data-page=summary]').click();
 });
 await test('mobile form and summary at 320, 390 and desktop; zero horizontal overflow',async()=>{
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  for(const [width,height] of [[320,568],[390,400],[390,844],[1440,900]]) {
   await page.setViewportSize({width,height});await page.locator('#newJobButton').click();
   await page.locator('#paymentStatus').selectOption('partial');
   await page.locator('#paymentDeposit').scrollIntoViewIfNeeded();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:path.join(root,`test-results/form-${width}x${height}.png`)});
   await page.locator('#cancelJob').click();
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(root,'test-results/summary.png'),fullPage:true});
 });
 await test('regression: leap day, month, empty period/archive and safety-backup failure',async()=>{
  await page.locator('#summaryPeriod').selectOption('day');await page.locator('#summaryDate').fill('2024-02-29');
  await page.locator('#summaryDate').dispatchEvent('change');
  assert.equal(await page.locator('#summaryJobs').innerText(),'1');
  await page.locator('#summaryPeriod').selectOption('month');
  assert.equal(await page.locator('#summaryJobs').innerText(),'1');
  await page.locator('#summaryMonth').selectOption('03');assert.equal(await page.locator('#summaryJobs').innerText(),'0');
  const result=await page.evaluate(async()=>{
   const before=await getAllJobs();const original=exportDatabaseBackup;
   exportDatabaseBackup=async()=>false;
   try {await handleImportFile({target:{files:[new File([JSON.stringify({app:'NQ8',version:2,jobs:[]})],'empty.nq8')],value:''}});}
   finally {exportDatabaseBackup=original;}
   return JSON.stringify(before)===JSON.stringify(await getAllJobs());
  });
  assert.equal(result,true);
  const saved=await page.evaluate(async()=>{const jobs=await getAllJobs();await addMultipleJobs([],true);await refreshJobs();return jobs;});
  await page.locator('#summaryPeriod').selectOption('all');assert.equal(await page.locator('#summaryJobs').innerText(),'0');
  assert.equal(await page.locator('#summaryYear').isDisabled(),true);
  assert.equal(await page.locator('.unpaid-job').count(),0);
  assert.equal(await page.locator('#paymentTotalCard').isVisible(),false);
  await page.evaluate(async jobs=>{await addMultipleJobs(jobs,true);await refreshJobs();},saved);
 });
 await test('PWA cached payments module and offline reload retains payment state',async()=>{
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller && state.jobs.length===4);
  assert.equal(await page.evaluate(async()=>!!await caches.match('./payments.js')),true);
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>state.jobs.length===4);
  assert.equal(await page.evaluate(()=>paymentTotals(state.jobs).remaining),50000);
  await context.setOffline(false);
 });
 assert.deepEqual(errors,[]);
 await context.close();
 if(process.argv.includes('--upgrade')) await test('real PWA upgrade / DB v1, data intact online and offline', async()=>{
  baseline={};
  for(const file of ['app.js','database.js','backup.js','index.html','style.css','service-worker.js']) {
   baseline[file]=process.env.NQ8_BASELINE_DIR ? fs.readFileSync(path.join(process.env.NQ8_BASELINE_DIR,file)) : execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-C',root,'show','e4a0762:'+file]);
  }
  const oldContext=await browser.newContext();const oldPage=await oldContext.newPage();
  await oldPage.goto(url);await oldPage.waitForFunction(()=>typeof db!=='undefined' && !!db);
  const oldRecords=await oldPage.evaluate(async()=>{
   await addJob({cliente:'Prima dell’aggiornamento',data:'2024-02-29',costo:100,ricavo:500,descrizione:'Conservare',creatoIl:'2024-02-29T12:00:00.000Z',modificatoIl:'2024-02-29T12:00:00.000Z'});
   await navigator.serviceWorker.ready;
   return getAllJobs();
  });
  await oldPage.reload();await oldPage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  baseline=null;
  await oldPage.evaluate(async()=>{
   const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
   const registration=await navigator.serviceWorker.getRegistration();await registration.update();await changed;
  });
  await oldPage.reload();await oldPage.waitForFunction(()=>typeof paymentAmounts==='function' && state.jobs.length===1);
  assert.deepEqual(await oldPage.evaluate(()=>getAllJobs()),oldRecords);
  assert.equal(await oldPage.evaluate(()=>db.version),1);
  assert.equal(await oldPage.evaluate(()=>paymentTotals(state.jobs).received),50000);
  assert.equal(await oldPage.locator('#paymentTotalCard').isVisible(),false);
  assert.equal(await oldPage.locator('.unpaid-job').count(),0);
  assert.equal(await oldPage.evaluate(async()=>(await caches.keys()).includes('nq8-cache-v7-stable')),false);
  assert.equal(await oldPage.evaluate(async()=>(await caches.keys()).includes('nq8-cache-v8-payments')),false);
  await oldContext.setOffline(true);await oldPage.reload();await oldPage.waitForFunction(()=>state.jobs.length===1);
  assert.deepEqual(await oldPage.evaluate(()=>getAllJobs()),oldRecords);
  await oldContext.close();
 });
 console.log(`ALL ${passed} TEST GROUPS PASSED`);
 } finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
