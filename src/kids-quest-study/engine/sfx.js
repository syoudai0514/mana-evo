import { getCtx, unlockAudio } from './audioCtx.js'

let enabled = true

function ac() { return getCtx() }

export function setSfxEnabled(v) { enabled = v }
export function isSfxEnabled() { return enabled }
export function unlockSfx() { unlockAudio() }

function tone(freq, start, dur, type = 'sine', gain = 0.18, slideTo = null) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g); g.connect(a.destination); osc.start(t0); osc.stop(t0 + dur + 0.05)
}

function toneEcho(freq, start, dur, type = 'triangle', gain = 0.18) {
  tone(freq, start, dur, type, gain)
  tone(freq, start + 0.16, dur, type, gain * 0.4)
  tone(freq * 2, start + 0.32, dur * 0.8, 'sine', gain * 0.18)
}

function noiseHit(start, dur = 0.16, gain = 0.22, freq = 700) {
  const a = ac(); if (!a) return
  const t0 = a.currentTime + start
  const len = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = a.createBufferSource(); src.buffer = buf
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq
  const g = a.createGain(); g.gain.value = gain
  src.connect(f); f.connect(g); g.connect(a.destination); src.start(t0)
}

export const sfx = {
  tap() { if (!enabled) return; tone(620,0,.06,'triangle',.1); tone(930,.03,.08,'sine',.07) },
  correct() { if (!enabled) return; tone(523,0,.1,'triangle',.16); tone(659,.08,.1,'triangle',.16); toneEcho(784,.16,.22,'triangle',.2) },
  wrongSoft() { if (!enabled) return; tone(392,0,.12,'sine',.12,523); tone(523,.11,.12,'triangle',.07) },
  reward() { if (!enabled) return; tone(659,0,.1,'triangle',.16); tone(784,.09,.1,'triangle',.16); tone(988,.18,.1,'triangle',.16); toneEcho(1319,.28,.4,'triangle',.22) },
  levelUp() { if (!enabled) return; tone(523,0,.09,'square',.1); tone(659,.07,.09,'square',.1); tone(784,.14,.09,'square',.1); tone(1047,.22,.3,'square',.14); toneEcho(1568,.34,.4,'sine',.14); tone(400,0,.5,'sine',.06,1600) },
  fanfare() { if (!enabled) return; for (const [f,t] of [[523,0],[659,.11],[784,.22],[1047,.36]]) { tone(f,t,.16,'triangle',.2); tone(f*.5,t,.16,'triangle',.1) } tone(784,.56,.1,'triangle',.14); toneEcho(1047,.66,.5,'triangle',.24) },
  hit() { if (!enabled) return; noiseHit(0,.12,.16,1400); tone(330,0,.09,'triangle',.14,180); tone(660,0,.06,'sine',.06) },
  hitBig() { if (!enabled) return; noiseHit(0,.16,.24,1800); tone(392,0,.1,'triangle',.16,196); tone(784,.02,.14,'triangle',.1); tone(1319,.06,.18,'sine',.08) },
  swoosh() { if (!enabled) return; tone(1200,0,.28,'sine',.1,180); noiseHit(.02,.22,.06,2000) },
  pop() { if (!enabled) return; tone(400,0,.06,'sine',.16,900) },
  star() { if (!enabled) return; toneEcho(1047,0,.1,'triangle',.14) },
  cry(seed=0) { if (!enabled) return; const base=300+(seed%7)*60; const wob=1+((seed>>3)%3)*.3; tone(base,0,.12,'square',.1,base*1.4); tone(base*1.5,.12,.16,'square',.1,base*wob) }
}
