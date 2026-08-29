#!/usr/bin/env node
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PUBLIC = path.join(ROOT, 'public')
const MONSTER_DIR = path.join(PUBLIC, 'monsters')
const PROVENANCE_DIR = path.join(ROOT, 'design/rebuild/asset-production/candidate-provenance')
const OUTPUT_DIR = path.join(ROOT, 'design/rebuild/asset-production/final-visual-audit')
const CONTACT_DIR = path.join(OUTPUT_DIR, 'contact-sheets')
const IDS = Array.from({ length: 238 }, (_, i) => `m${String(i + 1).padStart(3, '0')}`)
const ID_SET = new Set(IDS)
const DESCRIPTION_FILES = [
  'design/current/monsters/descriptions-001-080.json',
  'design/current/monsters/descriptions-081-160.json',
  'design/current/monsters/descriptions-161-238.json',
]
const ALPHA_VISIBLE = 8
const ALPHA_OPAQUE = 248
const NEAR_EDGE = 6

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')) }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex') }
function fmt(n, digits = 4) { return Number.isFinite(n) ? Number(n.toFixed(digits)) : null }
function familyId(no) { return `F${String(no).padStart(3, '0')}` }
function csvEscape(v) {
  if (v === null || v === undefined) return ''
  const s = Array.isArray(v) ? v.join('|') : String(v)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}
function writeCsv(file, rows, columns) {
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map((c) => csvEscape(row[c])).join(','))
  fs.writeFileSync(file, `${lines.join('\n')}\n`)
}
function cosine(a, b) {
  let dot = 0, aa = 0, bb = 0
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i] }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0
}
function median(values) {
  const s = [...values].filter(Number.isFinite).sort((a, b) => a - b)
  if (!s.length) return 0
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
function robustZ(value, values) {
  const med = median(values)
  const mad = median(values.map((v) => Math.abs(v - med))) || 1e-9
  return 0.6745 * (value - med) / mad
}
function contentType(filePath) {
  if (filePath.endsWith('.webp')) return 'image/webp'
  if (filePath.endsWith('.json')) return 'application/json'
  return 'application/octet-stream'
}
function servePublic() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)
      if (pathname === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>ManaEvo audit</title>'); return }
      const target = path.normalize(path.join(PUBLIC, pathname))
      if (!target.startsWith(PUBLIC) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.statusCode = 404; res.end('not found'); return }
      res.setHeader('Content-Type', contentType(target)); fs.createReadStream(target).pipe(res)
    })
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }))
  })
}

const descriptions = DESCRIPTION_FILES.flatMap(readJson)
const descById = new Map(descriptions.map((d) => [d.speciesId, d]))

function buildInventoryGate() {
  const seen = new Map()
  for (const d of descriptions) seen.set(d.speciesId, (seen.get(d.speciesId) || 0) + 1)
  const duplicateSpeciesAssignment = [...seen.entries()].filter(([, count]) => count !== 1).map(([id]) => id)
  const descriptionMissing = IDS.filter((id) => seen.get(id) !== 1)
  const webpFiles = fs.readdirSync(MONSTER_DIR).filter((f) => /^m\d{3}\.webp$/.test(f))
  const activeWebpIds = webpFiles.map((f) => f.replace('.webp', ''))
  const missing = IDS.filter((id) => !fs.existsSync(path.join(MONSTER_DIR, `${id}.webp`)))
  const extraActiveSpecies = activeWebpIds.filter((id) => !ID_SET.has(id))
  const m239Present = fs.existsSync(path.join(MONSTER_DIR, 'm239.webp'))
  const rows = IDS.map((speciesId) => {
    const d = descById.get(speciesId)
    const candidatePath = `public/monsters/${speciesId}.webp`
    const abs = path.join(ROOT, candidatePath)
    const provPath = `design/rebuild/asset-production/candidate-provenance/${speciesId}.json`
    const exists = fs.existsSync(abs)
    const provenanceExists = fs.existsSync(path.join(ROOT, provPath))
    let bytes = null, digest = null, headerFormat = null, provenanceCandidateMatches = false
    if (exists) {
      const buf = fs.readFileSync(abs); bytes = buf.length; digest = sha256(buf)
      headerFormat = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP' ? 'WEBP' : 'UNKNOWN'
    }
    if (provenanceExists && exists) {
      try {
        const prov = JSON.parse(fs.readFileSync(path.join(ROOT, provPath), 'utf8'))
        const last = prov.events?.at(-1)?.candidate
        provenanceCandidateMatches = !!last && last.repositoryPath === candidatePath && last.sha256 === digest && Number(last.bytes) === bytes
      } catch { provenanceCandidateMatches = false }
    }
    return {
      speciesId, family: d ? familyId(d.familyNo) : null, stage: d?.stage ?? null, attribute: d?.type ?? null,
      candidatePath, binaryExists: exists, provenancePath: provPath, provenanceExists, provenanceCandidateMatches,
      rawBytes: bytes, sha256: digest, headerFormat,
    }
  })
  const badProv = rows.filter((r) => !r.provenanceExists || !r.provenanceCandidateMatches).map((r) => r.speciesId)
  const gate = {
    expectedSpecies: 238,
    speciesDescriptions: descriptions.length,
    uniqueActiveDescriptionIds: [...seen.keys()].filter((id) => ID_SET.has(id)).length,
    binaryPresent: rows.filter((r) => r.binaryExists).length,
    missing,
    duplicateSpeciesAssignment,
    descriptionMissing,
    extraActiveSpecies,
    m239AbsentFromActiveScope: !m239Present && !seen.has('m239'),
    provenanceFailures: badProv,
  }
  gate.pass = gate.speciesDescriptions === 238 && gate.uniqueActiveDescriptionIds === 238 && gate.binaryPresent === 238 && !missing.length && !duplicateSpeciesAssignment.length && !descriptionMissing.length && !extraActiveSpecies.length && gate.m239AbsentFromActiveScope && !badProv.length
  return { gate, rows }
}

async function inspectPixels(page, origin, speciesId) {
  return page.evaluate(async ({ src, visibleThreshold, opaqueThreshold, nearEdge }) => {
    const img = new Image(); img.src = src; await img.decode()
    const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const w = canvas.width, h = canvas.height, total = w * h
    let alphaMin = 255, alphaMax = 0, transparent = 0, opaque = 0, visible = 0, semi = 0
    let minX = w, minY = h, maxX = -1, maxY = -1, weightedX = 0, weightedY = 0, alphaWeight = 0
    let edgeVisible = 0, edgeOpaque = 0, nearEdgeVisible = 0, lumSum = 0, satSum = 0, rgbWeight = 0
    const cornerAlpha = [], cornerRgb = []
    const corners = [[0,0],[w-1,0],[0,h-1],[w-1,h-1]]
    for (const [x,y] of corners) {
      const i = (y*w+x)*4; cornerAlpha.push(data[i+3]); cornerRgb.push([data[i],data[i+1],data[i+2]])
    }
    const gridN = 12, shapeGrid = Array(gridN * gridN).fill(0), colorHist = Array(16).fill(0)
    let gradientSum = 0, gradientCount = 0
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y*w+x)*4, r=data[i], g=data[i+1], b=data[i+2], a=data[i+3]
        alphaMin = Math.min(alphaMin,a); alphaMax = Math.max(alphaMax,a)
        if (a === 0) transparent += 1
        if (a >= opaqueThreshold) opaque += 1
        if (a > visibleThreshold) {
          visible += 1; if (a < opaqueThreshold) semi += 1
          minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y)
          weightedX += x*a; weightedY += y*a; alphaWeight += a
          const onEdge = x===0||y===0||x===w-1||y===h-1
          const near = x<nearEdge||y<nearEdge||x>=w-nearEdge||y>=h-nearEdge
          if (onEdge) edgeVisible += 1
          if (near) nearEdgeVisible += 1
          if (onEdge && a >= opaqueThreshold) edgeOpaque += 1
          const max=Math.max(r,g,b), min=Math.min(r,g,b), lum=(r+g+b)/3, sat=max===0?0:(max-min)/max
          lumSum += lum*a; satSum += sat*a; rgbWeight += a
          const gx=Math.min(gridN-1,Math.floor(x/w*gridN)), gy=Math.min(gridN-1,Math.floor(y/h*gridN)); shapeGrid[gy*gridN+gx] += a/255
          const hueBin = max===min ? 0 : (()=>{ let h0; if(max===r) h0=(g-b)/(max-min); else if(max===g) h0=2+(b-r)/(max-min); else h0=4+(r-g)/(max-min); h0=(h0*60+360)%360; return 1+Math.min(11,Math.floor(h0/30)) })()
          const lumBin = lum < 85 ? 0 : lum < 170 ? 1 : 2
          const idx = hueBin===0 ? 12+lumBin : hueBin-1
          colorHist[idx] += a/255
        }
        if (x > 0 && y > 0 && a > visibleThreshold) {
          const li=(y*w+x-1)*4, ui=((y-1)*w+x)*4
          const l0=(r+g+b)/3, ll=(data[li]+data[li+1]+data[li+2])/3, lu=(data[ui]+data[ui+1]+data[ui+2])/3
          gradientSum += Math.abs(l0-ll)+Math.abs(l0-lu); gradientCount += 2
        }
      }
    }
    const norm = (arr) => { const s=arr.reduce((a,b)=>a+b,0)||1; return arr.map((v)=>v/s) }
    const bboxWidth = maxX>=minX ? maxX-minX+1 : 0, bboxHeight = maxY>=minY ? maxY-minY+1 : 0
    const cx = alphaWeight ? weightedX/alphaWeight : w/2, cy = alphaWeight ? weightedY/alphaWeight : h/2
    const visibleMask = new Uint8Array(total)
    for (let p=0;p<total;p+=1) if (data[p*4+3] > visibleThreshold) visibleMask[p]=1
    const visited=new Uint8Array(total), queue=new Int32Array(total); let componentCount=0, largest=0
    for (let p=0;p<total;p+=1) {
      if (!visibleMask[p]||visited[p]) continue
      componentCount+=1; let qh=0,qt=0,size=0; queue[qt++]=p; visited[p]=1
      while(qh<qt){ const cur=queue[qh++], x=cur%w, y=Math.floor(cur/w); size+=1
        const ns=[]; if(x>0)ns.push(cur-1); if(x<w-1)ns.push(cur+1); if(y>0)ns.push(cur-w); if(y<h-1)ns.push(cur+w)
        for(const n of ns) if(visibleMask[n]&&!visited[n]){visited[n]=1;queue[qt++]=n}
      }
      if(size>largest)largest=size
    }
    const opaqueCorners = cornerAlpha.filter((a)=>a>=opaqueThreshold).length
    const cornerLum = cornerRgb.map(([r,g,b])=>(r+g+b)/3), meanCornerLum=cornerLum.reduce((a,b)=>a+b,0)/4
    const cornerLumSd=Math.sqrt(cornerLum.reduce((s,v)=>s+(v-meanCornerLum)**2,0)/4)
    const bboxTouches = bboxWidth ? [minX===0,maxX===w-1,minY===0,maxY===h-1].filter(Boolean).length : 0
    const nearlyOpaqueCanvas = opaque/total >= 0.97
    const fullyOpaqueCanvas = alphaMin === 255 || opaque/total >= 0.995
    const uniformOpaqueBorder = opaqueCorners >= 3 && cornerLumSd < 18
    const whiteRect = uniformOpaqueBorder && meanCornerLum > 232
    const blackRect = uniformOpaqueBorder && meanCornerLum < 28
    const grayRect = uniformOpaqueBorder && meanCornerLum >= 28 && meanCornerLum <= 232
    return {
      canvasWidth:w, canvasHeight:h, alphaMin, alphaMax,
      transparentPixelRatio:transparent/total, opaquePixelRatio:opaque/total, visiblePixelRatio:visible/total,
      alphaFringeRatio:semi/total,
      bbox:bboxWidth?{minX,minY,maxX,maxY,width:bboxWidth,height:bboxHeight}:null,
      bboxWidthRatio:bboxWidth/w, bboxHeightRatio:bboxHeight/h,
      topMargin:minY/h, bottomMargin:(h-1-maxY)/h, leftMargin:minX/w, rightMargin:(w-1-maxX)/w,
      visibleCentroidX:cx/w, visibleCentroidY:cy/h,
      centerOffsetX:(cx-w/2)/w, centerOffsetY:(cy-h/2)/h,
      edgeContact:edgeVisible>0, nearEdgeContact:nearEdgeVisible>0, edgeVisiblePixels:edgeVisible, edgeOpaquePixels:edgeOpaque, bboxTouchesEdges:bboxTouches,
      cornerOpacity:cornerAlpha, opaqueCornerCount:opaqueCorners, fullyOpaqueCanvas, nearlyOpaqueCanvas,
      rectangularBackgroundSuspicion:nearlyOpaqueCanvas && (uniformOpaqueBorder || bboxTouches>=3), whiteRectangleSuspicion:whiteRect, grayRectangleSuspicion:grayRect, blackRectangleSuspicion:blackRect,
      connectedComponentCount:componentCount, largestVisibleComponentRatio:visible?largest/visible:0,
      lowDensitySuspicion:visible/total<0.09 || bboxHeight/h<0.56,
      meanLuminance:rgbWeight?lumSum/rgbWeight:0, meanSaturation:rgbWeight?satSum/rgbWeight:0, edgeDensity:gradientCount?gradientSum/gradientCount/255:0,
      shapeGrid:norm(shapeGrid), colorHistogram:norm(colorHist),
    }
  }, { src: `${origin}/monsters/${speciesId}.webp`, visibleThreshold: ALPHA_VISIBLE, opaqueThreshold: ALPHA_OPAQUE, nearEdge: NEAR_EDGE })
}

function deriveFlags(row) {
  const centerMag = Math.hypot(row.centerOffsetX, row.centerOffsetY)
  const hardBackground = row.fullyOpaqueCanvas && row.rectangularBackgroundSuspicion
  const backgroundSuspicion = hardBackground || row.whiteRectangleSuspicion || row.grayRectangleSuspicion || row.blackRectangleSuspicion || (row.nearlyOpaqueCanvas && row.opaqueCornerCount >= 3)
  const cropRisk = row.edgeContact && (row.bboxTouchesEdges >= 2 || row.bboxHeightRatio > 0.985 || row.bboxWidthRatio > 0.985)
  const scaleOutlier = row.bboxHeightRatio < 0.68 || row.visiblePixelRatio < 0.12 || (row.bboxHeightRatio < 0.72 && row.bboxWidthRatio < 0.60)
  const normalizeCandidate = !backgroundSuspicion && !cropRisk && (scaleOutlier || centerMag > 0.085 || Math.max(row.topMargin,row.bottomMargin,row.leftMargin,row.rightMargin)>0.22)
  return { backgroundSuspicion, hardBackground, cropRisk, scaleOutlier, centerMag, normalizeCandidate }
}

function classify(row, familyConcern, styleOutlier) {
  const f = deriveFlags(row)
  const reasons=[]
  if (f.hardBackground) { reasons.push('fully/nearly opaque rectangular canvas; pixel-level background cleanup required'); return ['REPAIR',reasons] }
  if (f.backgroundSuspicion) { reasons.push('opaque border/corner pattern suggests baked background but requires visual confirmation'); return ['MANUAL_REVIEW',reasons] }
  if (f.cropRisk) { reasons.push('visible content contacts canvas edge with possible clipping'); return ['MANUAL_REVIEW',reasons] }
  if (familyConcern) { reasons.push('family continuity/stage heuristic flagged; compare family contact sheet'); return ['MANUAL_REVIEW',reasons] }
  if (styleOutlier) { reasons.push('cross-roster rendering/color/density outlier; visual confirmation required'); return ['MANUAL_REVIEW',reasons] }
  if (f.normalizeCandidate) {
    if (f.scaleOutlier) reasons.push('apparent character scale/transparent whitespace is outside preferred roster range')
    if (f.centerMag > 0.085) reasons.push('visible centroid is materially off-center')
    return ['NORMALIZE',reasons]
  }
  reasons.push('no destructive/background/crop/family/style concern detected by audit evidence')
  return ['KEEP',reasons]
}

function familyReview(rows) {
  const groups = new Map()
  for (const r of rows) { if (!groups.has(r.family)) groups.set(r.family, []); groups.get(r.family).push(r) }
  const reviews=[]
  for (const [family, members0] of [...groups.entries()].sort()) {
    const members=[...members0].sort((a,b)=>a.stage-b.stage)
    const adjacent=[]
    for(let i=1;i<members.length;i+=1){
      adjacent.push({
        pair:`${members[i-1].speciesId}-${members[i].speciesId}`,
        shape:cosine(members[i-1].shapeGrid,members[i].shapeGrid),
        palette:cosine(members[i-1].colorHistogram,members[i].colorHistogram),
        sizeDelta:members[i].bboxHeightRatio-members[i-1].bboxHeightRatio,
      })
    }
    const minShape=adjacent.length?Math.min(...adjacent.map((x)=>x.shape)):1
    const minPalette=adjacent.length?Math.min(...adjacent.map((x)=>x.palette)):1
    const tooSimilar=adjacent.filter((x)=>x.shape>0.992&&x.palette>0.992).map((x)=>x.pair)
    const identityBreak=adjacent.filter((x)=>x.shape<0.20&&x.palette<0.28).map((x)=>x.pair)
    const concerns=[]
    if(tooSimilar.length) concerns.push(`adjacent stages unusually similar: ${tooSimilar.join(', ')}`)
    if(identityBreak.length) concerns.push(`adjacent stages show weak silhouette+palette continuity: ${identityBreak.join(', ')}`)
    const stages=members.map((m)=>m.stage)
    for(let s=1;s<stages.length;s+=1) if(stages[s]!==stages[s-1]+1) concerns.push('stage sequence is non-contiguous')
    const concern=concerns.length>0
    reviews.push({
      family, attribute:members[0]?.attribute, speciesIds:members.map((m)=>m.speciesId), stages,
      minAdjacentShapeSimilarity:fmt(minShape), minAdjacentPaletteSimilarity:fmt(minPalette),
      continuityConcern:concern, concernReason:concerns.join('; ') || 'none detected by silhouette/palette/stage heuristics',
      reviewStatus:concern?'MANUAL_REVIEW':'METRICS_CLEAR',
    })
  }
  return reviews
}

async function saveSheet(page, origin, rows, outPath, title) {
  if (!rows.length) return
  const cards=rows.map((r)=>`<div class="card"><div class="id">${r.speciesId} · ${r.family} · S${r.stage} · ${r.attribute}</div><div class="checker"><img src="${origin}/monsters/${r.speciesId}.webp"></div><div class="meta">H ${(r.bboxHeightRatio*100).toFixed(1)}% · W ${(r.bboxWidthRatio*100).toFixed(1)}%<br><b>${r.classification}</b></div></div>`).join('')
  const cols=Math.min(4,Math.max(1,rows.length))
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:18px;font-family:Arial,sans-serif;background:#eef1f4;color:#17212b}h1{font-size:20px;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px}.card{background:#fff;border:1px solid #cdd5dc;border-radius:10px;padding:8px}.id{font:700 12px ui-monospace,monospace;margin-bottom:6px}.checker{aspect-ratio:1;border-radius:7px;overflow:hidden;background-color:#fff;background-image:linear-gradient(45deg,#dfe4e8 25%,transparent 25%),linear-gradient(-45deg,#dfe4e8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#dfe4e8 75%),linear-gradient(-45deg,transparent 75%,#dfe4e8 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0}img{width:100%;height:100%;object-fit:contain;display:block}.meta{font-size:11px;line-height:1.35;margin-top:5px}</style></head><body><h1>${title}</h1><div class="grid">${cards}</div></body></html>`
  await page.setViewportSize({width:1080,height:1400}); await page.setContent(html,{waitUntil:'networkidle'})
  const png=await page.screenshot({type:'png',fullPage:true})
  const dataUrl=`data:image/png;base64,${png.toString('base64')}`
  const webp=await page.evaluate(async ({dataUrl})=>{const img=new Image();img.src=dataUrl;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);return c.toDataURL('image/webp',0.78)},{dataUrl})
  fs.mkdirSync(path.dirname(outPath),{recursive:true}); fs.writeFileSync(outPath,Buffer.from(webp.split(',')[1],'base64'))
}
function chunk(arr,n){const out=[];for(let i=0;i<arr.length;i+=n)out.push(arr.slice(i,i+n));return out}

async function main() {
  fs.rmSync(OUTPUT_DIR,{recursive:true,force:true}); fs.mkdirSync(OUTPUT_DIR,{recursive:true})
  const { gate, rows: inventoryRows } = buildInventoryGate()
  fs.writeFileSync(path.join(OUTPUT_DIR,'inventory.json'),`${JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),scope:{first:'m001',last:'m238',expected:238,excluded:['m239']},gate,assets:inventoryRows},null,2)}\n`)
  if(!gate.pass){
    fs.writeFileSync(path.join(OUTPUT_DIR,'audit-summary.md'),`# ManaEvo Final Visual Audit\n\nInventory gate: **FAIL**\n\n\`\`\`json\n${JSON.stringify(gate,null,2)}\n\`\`\`\n`)
    console.error('Inventory gate failed; visual audit intentionally not started.'); process.exitCode=2; return
  }

  const {server,origin}=await servePublic(); const browser=await chromium.launch({headless:true})
  let page
  try {
    page=await browser.newPage(); await page.goto(origin)
    const metrics=[]
    for(const inv of inventoryRows){ const m=await inspectPixels(page,origin,inv.speciesId); metrics.push({...inv,...m}) }

    const styleFields=['edgeDensity','meanSaturation','meanLuminance','visiblePixelRatio','alphaFringeRatio']
    const values=Object.fromEntries(styleFields.map((f)=>[f,metrics.map((r)=>r[f])]))
    for(const r of metrics){
      r.styleOutlierFields=styleFields.filter((f)=>Math.abs(robustZ(r[f],values[f]))>4.25)
      r.styleQualityOutlier=r.styleOutlierFields.length>=2
    }
    const famReviews=familyReview(metrics)
    const famConcern=new Set(famReviews.filter((f)=>f.continuityConcern).flatMap((f)=>f.speciesIds))
    for(const r of metrics){
      const [classification,reasons]=classify(r,famConcern.has(r.speciesId),r.styleQualityOutlier)
      const flags=deriveFlags(r); Object.assign(r,flags,{classification,reason:reasons.join('; '),recommendedAction:classification==='KEEP'?'freeze candidate':classification==='NORMALIZE'?'Phase 2: scale/padding/centering only':classification==='REPAIR'?'Phase 2: background/alpha cleanup only':classification==='REGENERATE'?'Phase 2: regenerate this species only':'manual visual review before any mutation'})
    }

    const metricCols=['speciesId','family','stage','attribute','candidatePath','rawBytes','sha256','canvasWidth','canvasHeight','alphaMin','alphaMax','transparentPixelRatio','opaquePixelRatio','visiblePixelRatio','alphaFringeRatio','bboxWidthRatio','bboxHeightRatio','topMargin','bottomMargin','leftMargin','rightMargin','visibleCentroidX','visibleCentroidY','centerOffsetX','centerOffsetY','edgeContact','nearEdgeContact','bboxTouchesEdges','opaqueCornerCount','fullyOpaqueCanvas','nearlyOpaqueCanvas','rectangularBackgroundSuspicion','whiteRectangleSuspicion','grayRectangleSuspicion','blackRectangleSuspicion','connectedComponentCount','largestVisibleComponentRatio','lowDensitySuspicion','meanLuminance','meanSaturation','edgeDensity','styleQualityOutlier','styleOutlierFields']
    writeCsv(path.join(OUTPUT_DIR,'metrics.csv'),metrics.map((r)=>Object.fromEntries(metricCols.map((c)=>[c,Array.isArray(r[c])?r[c].join('|'):typeof r[c]==='number'?fmt(r[c],6):r[c]]))),metricCols)
    const classCols=['speciesId','family','stage','attribute','classification','bboxHeightRatio','bboxWidthRatio','centerOffsetX','centerOffsetY','transparentRatio','edgeContact','backgroundSuspicion','reason','recommendedAction']
    writeCsv(path.join(OUTPUT_DIR,'classification.csv'),metrics.map((r)=>({speciesId:r.speciesId,family:r.family,stage:r.stage,attribute:r.attribute,classification:r.classification,bboxHeightRatio:fmt(r.bboxHeightRatio,6),bboxWidthRatio:fmt(r.bboxWidthRatio,6),centerOffsetX:fmt(r.centerOffsetX,6),centerOffsetY:fmt(r.centerOffsetY,6),transparentRatio:fmt(r.transparentPixelRatio,6),edgeContact:r.edgeContact,backgroundSuspicion:r.backgroundSuspicion,reason:r.reason,recommendedAction:r.recommendedAction})),classCols)
    const famCols=['family','attribute','speciesIds','stages','minAdjacentShapeSimilarity','minAdjacentPaletteSimilarity','continuityConcern','concernReason','reviewStatus']
    writeCsv(path.join(OUTPUT_DIR,'family-review.csv'),famReviews,famCols)

    const counts=Object.fromEntries(['KEEP','NORMALIZE','REPAIR','REGENERATE','MANUAL_REVIEW'].map((k)=>[k,metrics.filter((r)=>r.classification===k).length]))
    const idsFor=(k)=>metrics.filter((r)=>r.classification===k).map((r)=>r.speciesId)
    const smallest=[...metrics].sort((a,b)=>a.bboxHeightRatio-b.bboxHeightRatio).slice(0,20)
    const largest=[...metrics].sort((a,b)=>b.bboxHeightRatio-a.bboxHeightRatio).slice(0,20)
    const centered=[...metrics].sort((a,b)=>b.centerMag-a.centerMag).slice(0,20)
    const bg=metrics.filter((r)=>r.backgroundSuspicion), crop=metrics.filter((r)=>r.cropRisk), scale=metrics.filter((r)=>r.scaleOutlier), style=metrics.filter((r)=>r.styleQualityOutlier), concerns=famReviews.filter((f)=>f.continuityConcern)
    const rowList=(rows)=>rows.map((r)=>`- ${r.speciesId} (${r.family}, S${r.stage}, ${r.attribute}) — H ${(r.bboxHeightRatio*100).toFixed(1)}%`).join('\n')||'- none'
    const md=`# ManaEvo Monster Art Final Visual QA — Phase 1\n\nGenerated from actual decoded candidate pixels on PR #108 branch. **Audit only; no candidate mutation.**\n\n## Inventory gate\n\n- species: 238 / 238\n- missing: 0\n- duplicate species assignment: 0\n- extra active species: 0\n- m239: absent from active scope\n- provenance matched to candidate bytes/SHA: 238 / 238\n\n## Classification\n\nTOTAL: 238\n\nKEEP: ${counts.KEEP}\n\nNORMALIZE: ${counts.NORMALIZE}\n\nREPAIR: ${counts.REPAIR}\n\nREGENERATE: ${counts.REGENERATE}\n\nMANUAL_REVIEW: ${counts.MANUAL_REVIEW}\n\n### KEEP\n${idsFor('KEEP').join(', ')||'none'}\n\n### NORMALIZE\n${idsFor('NORMALIZE').join(', ')||'none'}\n\n### REPAIR\n${idsFor('REPAIR').join(', ')||'none'}\n\n### REGENERATE\n${idsFor('REGENERATE').join(', ')||'none'}\n\n### MANUAL_REVIEW\n${idsFor('MANUAL_REVIEW').join(', ')||'none'}\n\n## Key findings\n\n- background suspicion: ${bg.length} — ${bg.map((r)=>r.speciesId).join(', ')||'none'}\n- crop risk: ${crop.length} — ${crop.map((r)=>r.speciesId).join(', ')||'none'}\n- scale outlier: ${scale.length} — ${scale.map((r)=>r.speciesId).join(', ')||'none'}\n- family continuity concerns: ${concerns.length} — ${concerns.map((f)=>f.family).join(', ')||'none'}\n- style-quality outliers: ${style.length} — ${style.map((r)=>r.speciesId).join(', ')||'none'}\n\n## Smallest apparent species — TOP 20\n${rowList(smallest)}\n\n## Largest apparent species — TOP 20\n${rowList(largest)}\n\n## Strongest center offset — TOP 20\n${centered.map((r)=>`- ${r.speciesId} (${r.family}) — offset ${r.centerMag.toFixed(4)} (x ${r.centerOffsetX.toFixed(4)}, y ${r.centerOffsetY.toFixed(4)})`).join('\n')}\n\n## Background suspicion species\n${bg.map((r)=>`- ${r.speciesId}: ${r.reason}`).join('\n')||'- none'}\n\n## Crop-risk species\n${crop.map((r)=>`- ${r.speciesId}: bbox ${(r.bboxWidthRatio*100).toFixed(1)}% × ${(r.bboxHeightRatio*100).toFixed(1)}%, touches ${r.bboxTouchesEdges} edges`).join('\n')||'- none'}\n\n## Family continuity concerns\n${concerns.map((f)=>`- ${f.family} (${f.speciesIds.join('/')}) — ${f.concernReason}`).join('\n')||'- none'}\n\n## Style-quality outliers\n${style.map((r)=>`- ${r.speciesId}: ${r.styleOutlierFields.join(', ')}`).join('\n')||'- none'}\n\n## Method / conservatism\n\n- Pixel metrics are decoded from the actual WebP candidates, not manifest metadata alone.\n- Alpha/background, bbox, centroid, edge contact, connected components, color/saturation/luminance and rendering-density proxies are machine-measured.\n- Family continuity uses silhouette occupancy + palette similarity as a **screening heuristic**. Semantic identity/material/signature-feature judgments are not inferred from numbers; suspicious families are routed to MANUAL_REVIEW and family contact sheets.\n- Apparent-height guidance (roughly 70–85%, preferred ~72–82%) is not a hard fail gate.\n- REGENERATE is intentionally not assigned from ambiguous machine evidence. Uncertain cases become MANUAL_REVIEW.\n- No FORMAL promotion is performed.\n\nCanonical-Impact: none\n\nCanonical-Reason: Adds non-destructive final visual audit evidence and tooling under the existing CURRENT Monster Art contract; no product/art semantics changed.\n`
    fs.writeFileSync(path.join(OUTPUT_DIR,'audit-summary.md'),md)

    const tilePage=await browser.newPage()
    let i=0; for(const group of chunk(metrics,24)){i+=1;await saveSheet(tilePage,origin,group,path.join(CONTACT_DIR,`overview-${String(i).padStart(2,'0')}.webp`),`ManaEvo overview ${i}`)}
    const byAttr=new Map(); for(const r of metrics){if(!byAttr.has(r.attribute))byAttr.set(r.attribute,[]);byAttr.get(r.attribute).push(r)}
    for(const [attr,rs] of [...byAttr.entries()].sort()){let j=0;for(const g of chunk(rs,24)){j+=1;await saveSheet(tilePage,origin,g,path.join(CONTACT_DIR,'by-attribute',`${attr}-${String(j).padStart(2,'0')}.webp`),`Attribute: ${attr}`)}}
    const byFam=new Map(); for(const r of metrics){if(!byFam.has(r.family))byFam.set(r.family,[]);byFam.get(r.family).push(r)}
    for(const [fam,rs] of [...byFam.entries()].sort()) await saveSheet(tilePage,origin,[...rs].sort((a,b)=>a.stage-b.stage),path.join(CONTACT_DIR,'by-family',`${fam}.webp`),`Family: ${fam}`)
    const review=metrics.filter((r)=>r.classification!=='KEEP'); let j=0; for(const g of chunk(review,24)){j+=1;await saveSheet(tilePage,origin,g,path.join(CONTACT_DIR,'review-needed',`review-${String(j).padStart(2,'0')}.webp`),`Review needed ${j}`)}
    fs.writeFileSync(path.join(OUTPUT_DIR,'audit-data.json'),`${JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),counts,metrics,familyReview:famReviews},null,2)}\n`)
    console.log(JSON.stringify({inventory:'PASS',scope:'238/238',counts,backgroundSuspicion:bg.length,cropRisk:crop.length,scaleOutlier:scale.length,familyConcerns:concerns.length,styleOutliers:style.length},null,2))
  } finally { await browser.close(); server.close() }
}
main().catch((e)=>{console.error(e);process.exitCode=1})
