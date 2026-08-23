// Kids Quest / ManaEvo 共通の「聞き取りやすい間」をブラウザ再生層で保証する。
//
// つくよみちゃんは長い説明をiPhone向けに短いWAVへ分割して順番に再生する。
// 分割自体はメモリ保護に必要だが、WAV同士を無音時間なしで連結すると
// 「説明が終わった瞬間に次の説明が入る」ように聞こえる。
// また端末SpeechSynthesisも、直前の発話終了直後に次の発話を開始すると
// 子どもには文の境目が分かりにくい。
//
// TTS本文や教材文は変更せず、再生開始の間隔だけを共通で整える。

export const NARRATOR_GAP_MS = 320
export const DEVICE_SPEECH_GAP_MS = 360

let installed = false

function nowMs() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
}

function installNarratorMediaPacing() {
  if (typeof window === 'undefined' || typeof HTMLMediaElement === 'undefined') return
  const proto = HTMLMediaElement.prototype
  if (proto.__manaEvoPacedPlay) return

  const nativePlay = proto.play
  let lastEndedAt = -Infinity

  const isNarratorMedia = (media) => {
    const attr = media.getAttribute?.('src') || ''
    const src = attr || media.currentSrc || media.src || ''
    return media instanceof HTMLAudioElement && src.startsWith('blob:') && media.playsInline === true
  }

  proto.play = function pacedPlay(...args) {
    if (!isNarratorMedia(this)) return nativePlay.apply(this, args)

    if (!this.__manaEvoNarratorEndBound) {
      this.__manaEvoNarratorEndBound = true
      const markEnded = () => { lastEndedAt = nowMs() }
      this.addEventListener('ended', markEnded)
      this.addEventListener('error', markEnded)
    }

    const wait = Math.max(0, NARRATOR_GAP_MS - (nowMs() - lastEndedAt))
    if (wait <= 0) return nativePlay.apply(this, args)

    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        // cancelSpeak() は待機中のaudioからsrcを外す。キャンセル後に
        // 古い音声を再生し直さないよう、その場合は何もせず完了扱いにする。
        if (!this.getAttribute?.('src')) return resolve()
        Promise.resolve(nativePlay.apply(this, args)).then(resolve, reject)
      }, wait)
    })
  }
  proto.__manaEvoPacedPlay = true
}

function installDeviceSpeechPacing() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const synth = window.speechSynthesis
  if (synth.__manaEvoPacedSpeak) return

  const nativeSpeak = synth.speak.bind(synth)
  const nativeCancel = synth.cancel.bind(synth)
  const timers = new Set()
  let generation = 0
  let lastEndedAt = -Infinity

  synth.speak = (utterance) => {
    if (!utterance) return
    const myGeneration = generation
    const originalEnd = utterance.onend
    const originalError = utterance.onerror
    const markEnded = (handler, event) => {
      lastEndedAt = nowMs()
      if (typeof handler === 'function') handler.call(utterance, event)
    }
    utterance.onend = (event) => markEnded(originalEnd, event)
    utterance.onerror = (event) => markEnded(originalError, event)

    const wait = Math.max(0, DEVICE_SPEECH_GAP_MS - (nowMs() - lastEndedAt))
    if (wait <= 0) {
      nativeSpeak(utterance)
      return
    }

    const timer = window.setTimeout(() => {
      timers.delete(timer)
      if (myGeneration !== generation) return
      nativeSpeak(utterance)
    }, wait)
    timers.add(timer)
  }

  synth.cancel = () => {
    generation += 1
    timers.forEach((timer) => window.clearTimeout(timer))
    timers.clear()
    nativeCancel()
  }
  synth.__manaEvoPacedSpeak = true
}

export function installSpeechPacing() {
  if (installed || typeof window === 'undefined') return
  installed = true
  installNarratorMediaPacing()
  installDeviceSpeechPacing()
}

installSpeechPacing()
