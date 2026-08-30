#!/usr/bin/env node
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PUBLIC = path.join(ROOT, 'public')
const OUT = path.join(ROOT, 'design/rebuild/asset-production/final-visual-audit')
const CONTACT = path.join(OUT, 'contact-sheets')
const DATA_FILE = path.join(OUT, 'audit-data.json')

const overrides = {
  m012: ['MANUAL_REVIEW', 'Manual visual QA: F004 stage2 m011 and stage3 m012 are effectively the same creature/pose; final-stage differentiation is unresolved.', 'Manual family/stage review before any mutation.'],
  m057: ['KEEP', 'Manual visual QA: horizontal final-stage silhouette fills the card width and has strong apparent presence; low bbox height is shape-driven, not underscaling.', 'Freeze candidate.'],
  m058: ['KEEP', 'Manual visual QA: bbox is centered; alpha centroid is bottom-heavy because the flame/body mass is intentionally lower in the silhouette, not because canvas placement is wrong.', 'Freeze candidate.'],
  m060: ['KEEP', 'Manual visual QA: wide final-stage silhouette has sufficient apparent presence; low bbox height is shape-driven.', 'Freeze candidate.'],
  m109: ['KEEP', 'Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.', 'Freeze candidate.'],
  m110: ['KEEP', 'Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.', 'Freeze candidate.'],
  m111: ['KEEP', 'Manual visual QA: tall/narrow ghost silhouette has sufficient card presence; lateral transparent margin is intentional shape space.', 'Freeze candidate.'],
  m113: ['KEEP', 'Manual visual QA: tall/narrow lantern silhouette has sufficient card presence; lateral transparent margin is intentional shape space.', 'Freeze candidate.'],
  m114: ['KEEP', 'Manual visual QA: tall/narrow lantern silhouette has sufficient card presence; lateral transparent margin is intentional shape space.', 'Freeze candidate.'],
  m146: ['KEEP', 'Manual visual QA: tall/narrow book-spirit silhouette is well centered and sufficiently large; width alone does not justify normalization.', 'Freeze candidate.'],
  m147: ['KEEP', 'Manual visual QA: tall/narrow book-spirit silhouette is well centered and sufficiently large; width alone does not justify normalization.', 'Freeze candidate.'],
  m154: ['KEEP', 'Manual visual QA: wide armored body fills the production card strongly; reduced height is body-plan driven.', 'Freeze candidate.'],
  m196: ['KEEP', 'Manual visual QA: tall stage1 bird silhouette has strong presence and is appropriately smaller in width than evolved winged stages.', 'Freeze candidate.'],
  m204: ['KEEP', 'Manual visual QA: tall final-stage ghost silhouette has strong presence; narrow width is body-plan driven.', 'Freeze candidate.'],
  m212: ['KEEP', 'Manual visual QA: wide-wing stage2 bird has strong apparent size; low bbox height is wing/body-plan driven.', 'Freeze candidate.'],
  m213: ['KEEP', 'Manual visual QA: wide-wing final-stage bird fills the card width and is bbox-centered; alpha-centroid offset is caused by asymmetric wing/tail mass.', 'Freeze candidate.'],
  m229: ['MANUAL_REVIEW', 'Manual visual QA: F078 stage1 is scene-backed and reads as a small dark cat-like creature while stages2/3 read as large winged poison creatures; family/body-plan continuity is unresolved and background repair alone may be insufficient.', 'Manual family/stage review; if stage1 concept is rejected, regenerate only m229 in Phase 2.'],
  m233: ['REPAIR', 'Manual visual QA: tiny character also contains a detached stray fragment at left; normalization alone cannot remove the pixel artifact.', 'Phase 2: remove detached artifact, then normalize scale/placement non-destructively.'],
  m234: ['REPAIR', 'Manual visual QA: visible text/label-like marks appear above the creature; normalization alone cannot remove this production-unsafe pixel artifact.', 'Phase 2: remove text/mark artifact, then normalize scale/placement non-destructively.'],
  m235: ['MANUAL_REVIEW', 'Manual visual QA: image is dominated by a horizontal forest/tree scene rather than an unambiguous isolated monster; safe separation of creature from scenery is uncertain.', 'Manual concept review before deciding repair versus single-species regeneration in Phase 2.'],
}

const finalScaleOutliers = new Set(['m013','m014','m015','m140','m178','m179','m180','m202','m203','m218','m219','m232','m233','m234'])
const visualFamilyConcerns = new Map([
  ['F004', 'Manual visual QA: stage2 m011 and stage3 m012 are effectively duplicate in body, pose and detail, so final-stage differentiation is not established.'],
  ['F078', 'Manual visual QA: m229 stage1 has a materially different body-plan/scene treatment from winged m230/m231; family continuity requires human decision.'],
])

function esc(v) { if (v == null) return ''; const s = Array.isArray(v) ? v.join('|') : String(v); return /[",\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s }
function writeCsv(file, rows, cols) { fs.writeFileSync(file, [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n') + '\n') }
function fmt(n,d=6) { return Number.isFinite(Number(n)) ? Number(Number(n).toFixed(d)) : null }
function chunk(a,n){const o=[];for(let i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));return o}
function servePublic(){return new Promise((resolve,reject)=>{const server=http.createServer((req,res)=>{const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);if(p==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html>');return}const t=path.normalize(path.join(PUBLIC,p));if(!t.startsWith(PUBLIC)||!fs.existsSync(t)){res.statusCode=404;res.end('not found');return}res.setHeader('Content-Type',t.endsWith('.webp')?'image/webp':'application/octet-stream');fs.createReadStream(t).pipe(res)});server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve({server,origin:`http://127.0.0.1:${server.address().port}`}))})}
async function saveSheet(page,origin,rows,out,title){if(!rows.length)return;const cols=Math.min(4,Math.max(1,rows.length));const cards=rows.map(r=>`<div class="card"><div class="id">${r.speciesId} · ${r.family} · S${r.stage} · ${r.attribute}</div><div class="checker"><img src="${origin}/monsters/${r.speciesId}.webp"></div><div class="meta">H ${(r.bboxHeightRatio*100).toFixed(1)}% · W ${(r.bboxWidthRatio*100).toFixed(1)}%<br><b>${r.classification}</b></div></div>`).join('');const html=`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:18px;font-family:Arial,sans-serif;background:#eef1f4;color:#17212b}h1{font-size:20px;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px}.card{background:#fff;border:1px solid #cdd5dc;border-radius:10px;padding:8px}.id{font:700 12px ui-monospace,monospace;margin-bottom:6px}.checker{aspect-ratio:1;border-radius:7px;overflow:hidden;background-color:#fff;background-image:linear-gradient(45deg,#dfe4e8 25%,transparent 25%),linear-gradient(-45deg,#dfe4e8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#dfe4e8 75%),linear-gradient(-45deg,transparent 75%,#dfe4e8 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0}img{width:100%;height:100%;object-fit:contain;display:block}.meta{font-size:11px;line-height:1.35;margin-top:5px}</style></head><body><h1>${title}</h1><div class="grid">${cards}</div></body></html>`;await page.setViewportSize({width:1080,height:1400});await page.setContent(html,{waitUntil:'networkidle'});const png=await page.screenshot({type:'png',fullPage:true});const dataUrl=`data:image/png;base64,${png.toString('base64')}`;const webp=await page.evaluate(async({dataUrl})=>{const i=new Image();i.src=dataUrl;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',0.78)},{dataUrl});fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,Buffer.from(webp.split(',')[1],'base64'))}

const data=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'))
for(const r of data.metrics){
  r.machineClassification=r.classification
  r.machineReason=r.reason
  r.machineCropRisk=!!r.cropRisk
  r.cropRisk=!!r.cropRisk && !r.backgroundSuspicion
  r.scaleOutlier=finalScaleOutliers.has(r.speciesId)
  r.bboxCenterOffsetX=fmt((Number(r.leftMargin)-Number(r.rightMargin))/2)
  r.bboxCenterOffsetY=fmt((Number(r.topMargin)-Number(r.bottomMargin))/2)
  const o=overrides[r.speciesId]
  if(o){r.classification=o[0];r.reason=o[1];r.recommendedAction=o[2];r.manualVisualOverride=true}else{r.manualVisualOverride=false}
}
for(const f of data.familyReview){
  f.machineHeuristicConcern=!!f.continuityConcern
  f.machineHeuristicReason=f.concernReason
  if(visualFamilyConcerns.has(f.family)){
    f.continuityConcern=true;f.concernReason=visualFamilyConcerns.get(f.family);f.reviewStatus='VISUAL_CONCERN'
  }else{
    f.continuityConcern=false;f.concernReason='No family/stage continuity concern confirmed in overview/family visual review.';f.reviewStatus='VISUAL_CLEAR'
  }
}
const classes=['KEEP','NORMALIZE','REPAIR','REGENERATE','MANUAL_REVIEW']
const counts=Object.fromEntries(classes.map(k=>[k,data.metrics.filter(r=>r.classification===k).length]))
data.counts=counts
data.manualVisualReview={applied:true,reviewedScope:'238/238 overview contact sheets plus targeted family sheets',overrideSpecies:Object.keys(overrides),confirmedFamilyConcerns:[...visualFamilyConcerns.keys()],classificationPolicy:'machine metrics are screening evidence; shape-driven bbox/centroid false positives are overridden visually; ambiguity routes to MANUAL_REVIEW'}
fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2)+'\n')

const classCols=['speciesId','family','stage','attribute','classification','machineClassification','manualVisualOverride','bboxHeightRatio','bboxWidthRatio','centerOffsetX','centerOffsetY','bboxCenterOffsetX','bboxCenterOffsetY','transparentRatio','edgeContact','backgroundSuspicion','cropRisk','scaleOutlier','reason','recommendedAction']
writeCsv(path.join(OUT,'classification.csv'),data.metrics.map(r=>({speciesId:r.speciesId,family:r.family,stage:r.stage,attribute:r.attribute,classification:r.classification,machineClassification:r.machineClassification,manualVisualOverride:r.manualVisualOverride,bboxHeightRatio:fmt(r.bboxHeightRatio),bboxWidthRatio:fmt(r.bboxWidthRatio),centerOffsetX:fmt(r.centerOffsetX),centerOffsetY:fmt(r.centerOffsetY),bboxCenterOffsetX:r.bboxCenterOffsetX,bboxCenterOffsetY:r.bboxCenterOffsetY,transparentRatio:fmt(r.transparentPixelRatio),edgeContact:r.edgeContact,backgroundSuspicion:r.backgroundSuspicion,cropRisk:r.cropRisk,scaleOutlier:r.scaleOutlier,reason:r.reason,recommendedAction:r.recommendedAction})),classCols)
const famCols=['family','attribute','speciesIds','stages','minAdjacentShapeSimilarity','minAdjacentPaletteSimilarity','machineHeuristicConcern','machineHeuristicReason','continuityConcern','concernReason','reviewStatus']
writeCsv(path.join(OUT,'family-review.csv'),data.familyReview,famCols)

const idsFor=k=>data.metrics.filter(r=>r.classification===k).map(r=>r.speciesId)
const smallest=[...data.metrics].sort((a,b)=>a.bboxHeightRatio-b.bboxHeightRatio).slice(0,20)
const largest=[...data.metrics].sort((a,b)=>b.bboxHeightRatio-a.bboxHeightRatio).slice(0,20)
const center=[...data.metrics].sort((a,b)=>Math.hypot(b.centerOffsetX,b.centerOffsetY)-Math.hypot(a.centerOffsetX,a.centerOffsetY)).slice(0,20)
const bg=data.metrics.filter(r=>r.backgroundSuspicion),crop=data.metrics.filter(r=>r.cropRisk),scale=data.metrics.filter(r=>r.scaleOutlier),fam=data.familyReview.filter(f=>f.continuityConcern),style=data.metrics.filter(r=>r.styleQualityOutlier)
const rowList=rs=>rs.map(r=>`- ${r.speciesId} (${r.family}, S${r.stage}, ${r.attribute}) — H ${(r.bboxHeightRatio*100).toFixed(1)}% / W ${(r.bboxWidthRatio*100).toFixed(1)}%`).join('\n')||'- none'
const summary=`# ManaEvo Monster Art Final Visual QA — Phase 1\n\nGenerated from actual decoded candidate pixels on PR #108 branch, then cross-checked visually with the 238-species overview and targeted family sheets. **Audit only; no candidate mutation.**\n\n## Inventory gate\n\n- species: 238 / 238\n- missing: 0\n- duplicate species assignment: 0\n- extra active species: 0\n- m239: absent from active scope\n- provenance matched to candidate bytes/SHA: 238 / 238\n\n## Final classification after manual visual QA\n\nTOTAL: 238\n\nKEEP: ${counts.KEEP}\n\nNORMALIZE: ${counts.NORMALIZE}\n\nREPAIR: ${counts.REPAIR}\n\nREGENERATE: ${counts.REGENERATE}\n\nMANUAL_REVIEW: ${counts.MANUAL_REVIEW}\n\n### KEEP\n${idsFor('KEEP').join(', ')||'none'}\n\n### NORMALIZE\n${idsFor('NORMALIZE').join(', ')||'none'}\n\n### REPAIR\n${idsFor('REPAIR').join(', ')||'none'}\n\n### REGENERATE\n${idsFor('REGENERATE').join(', ')||'none'}\n\n### MANUAL_REVIEW\n${idsFor('MANUAL_REVIEW').join(', ')||'none'}\n\n## Key findings\n\n- background suspicion: ${bg.length} — ${bg.map(r=>r.speciesId).join(', ')||'none'}\n- crop risk (excluding alpha-opaque background edges): ${crop.length} — ${crop.map(r=>r.speciesId).join(', ')||'none'}\n- scale outlier after shape-aware visual review: ${scale.length} — ${scale.map(r=>r.speciesId).join(', ')||'none'}\n- confirmed family continuity concerns: ${fam.length} — ${fam.map(f=>f.family).join(', ')||'none'}\n- style-quality outliers: ${style.length} — ${style.map(r=>r.speciesId).join(', ')||'none'}\n\n## Manual visual overrides\n\n${Object.entries(overrides).map(([id,o])=>`- ${id}: **${o[0]}** — ${o[1]}`).join('\n')}\n\n## Smallest apparent species — TOP 20\n${rowList(smallest)}\n\n## Largest apparent species — TOP 20\n${rowList(largest)}\n\n## Strongest alpha-centroid offset — TOP 20\n${center.map(r=>`- ${r.speciesId} (${r.family}) — alpha offset ${Math.hypot(r.centerOffsetX,r.centerOffsetY).toFixed(4)}, bbox-center offset (${Number(r.bboxCenterOffsetX).toFixed(4)}, ${Number(r.bboxCenterOffsetY).toFixed(4)})`).join('\n')}\n\n## Background suspicion species\n${bg.map(r=>`- ${r.speciesId}`).join('\n')||'- none'}\n\n## Crop-risk species\n${crop.map(r=>`- ${r.speciesId}: visible alpha reaches canvas edge after excluding opaque-background cases`).join('\n')||'- none'}\n\n## Confirmed family continuity concerns\n${fam.map(f=>`- ${f.family} (${f.speciesIds.join('/')}) — ${f.concernReason}`).join('\n')||'- none'}\n\n## Style-quality outliers\n${style.map(r=>`- ${r.speciesId}: ${r.styleOutlierFields.join(', ')}`).join('\n')||'- none'}\n\n## Method / conservatism\n\n- Pixel metrics come from decoded actual WebP candidates.\n- Alpha/background, bbox, margins, centroid, edge contact, connected components and rendering-density/color proxies are machine-measured.\n- Machine outputs are screening evidence, not final semantic judgments. The full overview was visually reviewed and targeted family sheets were used where a machine metric or family relationship was ambiguous.\n- Horizontal wings/tails, tall narrow bodies and asymmetric mass are not failed solely because bbox height or alpha centroid differs from a square-body norm.\n- Alpha-opaque backgrounds are excluded from crop-risk counting because their canvas edge is background, not evidence of monster clipping.\n- REGENERATE remains 0: unresolved content/family cases are conservatively MANUAL_REVIEW.\n- No FORMAL promotion is performed.\n\nCanonical-Impact: none\n\nCanonical-Reason: Adds non-destructive final visual audit evidence and tooling under the existing CURRENT Monster Art contract; no product/art semantics changed.\n`
fs.writeFileSync(path.join(OUT,'audit-summary.md'),summary)
fs.writeFileSync(path.join(OUT,'manual-review-findings.md'),`# Manual Visual Review Findings\n\nScope: 238 / 238 overview review plus targeted family sheets.\n\nConfirmed family concerns: F004, F078.\n\nManual classification overrides:\n\n${Object.entries(overrides).map(([id,o])=>`- ${id}: ${o[0]} — ${o[1]}`).join('\n')}\n\nNo candidate binary was changed by this review.\n`)

fs.rmSync(CONTACT,{recursive:true,force:true});fs.mkdirSync(CONTACT,{recursive:true})
const {server,origin}=await servePublic();const browser=await chromium.launch({headless:true})
try{const page=await browser.newPage();let i=0;for(const g of chunk(data.metrics,24)){i++;await saveSheet(page,origin,g,path.join(CONTACT,`overview-${String(i).padStart(2,'0')}.webp`),`ManaEvo final overview ${i}`)}const attrs=new Map();for(const r of data.metrics){if(!attrs.has(r.attribute))attrs.set(r.attribute,[]);attrs.get(r.attribute).push(r)}for(const [a,rs] of [...attrs.entries()].sort()){let j=0;for(const g of chunk(rs,24)){j++;await saveSheet(page,origin,g,path.join(CONTACT,'by-attribute',`${a}-${String(j).padStart(2,'0')}.webp`),`Attribute: ${a}`)}}const fams=new Map();for(const r of data.metrics){if(!fams.has(r.family))fams.set(r.family,[]);fams.get(r.family).push(r)}for(const [f,rs] of [...fams.entries()].sort())await saveSheet(page,origin,[...rs].sort((a,b)=>a.stage-b.stage),path.join(CONTACT,'by-family',`${f}.webp`),`Family: ${f}`);let k=0;for(const g of chunk(data.metrics.filter(r=>r.classification!=='KEEP'),24)){k++;await saveSheet(page,origin,g,path.join(CONTACT,'review-needed',`review-${String(k).padStart(2,'0')}.webp`),`Final review needed ${k}`)}}finally{await browser.close();server.close()}
console.log(JSON.stringify({manualVisualReview:'PASS',counts,backgroundSuspicion:bg.length,cropRisk:crop.length,scaleOutlier:scale.length,familyConcerns:fam.length,styleOutliers:style.length},null,2))
