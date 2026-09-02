import React, { useEffect, useState } from 'react'
import { useGame, skillOf, missedCount } from '../state/GameContext.jsx'
import { DOMAINS, domainName } from '../engine/activities.js'
import { trendLabel } from '../engine/difficulty.js'
import { TTS_RATE_PRESETS } from '../config/ttsRates.js'
import { getNarratorStatus, prepareNarratorVoice, setTtsEnabled, setTtsPreferences, speak, subscribeNarratorStatus } from '../engine/tts.js'
import { setSfxEnabled } from '../engine/sfx.js'
import { serializeForExport, parseImport } from '../engine/storage.js'
import { GRADES, MAX_GRADE, gradeOf } from '../data/grades.js'
import { AppHeader, Starfield } from '../components/common.jsx'
import { trialUnlocked, unitLabel } from '../engine/learningUnits.js'
import { importKidsQuestProgress } from '../../platform/kidsQuestImport.js'
import { openAdultCloudControls } from '../../platform/cloudUiEvents.js'
import { profileDisplayName, profileEditableName } from '../../platform/profileUi.js'
import DexArtPackControls from '../../parent/DexArtPackControls.jsx'

function Stat({ label, value, sub }) {
  return <div className="card" style={{ flex:'1 1 135px', textAlign:'center' }}><div style={{fontSize:30,fontWeight:900}}>{value}</div><div className="muted" style={{fontWeight:800}}>{label}</div>{sub && <div className="muted" style={{fontSize:11}}>{sub}</div>}</div>
}

function statusText(status) {
  if (status.state === 'ready') return '✅ つくよみちゃん じゅんびOK'
  if (status.state === 'loading') return `⏳ ${status.detail || 'じゅんび中…'}${Number.isFinite(status.progress) ? ` ${status.progress}%` : ''}`
  if (status.state === 'error') return `⚠️ ${status.error || status.detail || '音声の準備に失敗しました'}`
  if (status.state === 'not-downloaded') return '⬇️ まだ端末にダウンロードされていません'
  return status.detail || 'つくよみちゃんを使う準備ができます'
}

function jumpTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' })
}

function ProfileEditor({ id, profile, active, dispatch }) {
  const [draft, setDraft] = useState(() => profileEditableName(profile))
  useEffect(() => setDraft(profileEditableName(profile)), [id, profile?.name])
  const currentDisplay = profileDisplayName(profile)
  const clean = draft.trim()

  return <div className="parent-profile-editor">
    <span>{active ? `✓ いま使っている：${currentDisplay}` : currentDisplay}</span>
    <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="なまえを いれてね" aria-label={`${currentDisplay}の なまえ`} />
    <button className="btn btn--ghost" disabled={!clean || clean === profile?.name} onClick={() => dispatch({ type:'RENAME_PROFILE', profileId:id, name:clean })}>名前を保存</button>
    {!active && <button className="btn btn--ghost" style={{gridColumn:'1/3'}} onClick={() => dispatch({type:'SWITCH_PROFILE',profileId:id})}>この人に切り替える</button>}
  </div>
}

export default function ParentScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const [narratorStatus, setNarratorStatus] = useState(getNarratorStatus)
  const [newProfileName, setNewProfileName] = useState('')
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')
  const daily = state.daily
  const accuracy = daily.attemptsToday ? Math.round(daily.correctToday / daily.attemptsToday * 100) : 0
  const unlock = trialUnlocked(state, state.grade)
  const currentDomains = DOMAINS.filter((domain) => domain.available && domain.grades.includes(state.grade))

  useEffect(() => subscribeNarratorStatus(setNarratorStatus), [])

  const setSetting = (key, value) => {
    dispatch({ type:'SET_SETTING', key, value })
    if (key === 'tts') setTtsEnabled(value)
    if (key === 'sfx') setSfxEnabled(value)
    if (['ttsRate','ttsVolume','ttsVoice'].includes(key)) {
      setTtsPreferences({
        rate: key === 'ttsRate' ? value : state.settings.ttsRate,
        volume: key === 'ttsVolume' ? value : state.settings.ttsVolume,
        voiceStyle: key === 'ttsVoice' ? value : state.settings.ttsVoice
      })
    }
  }

  const testVoice = async () => {
    try {
      if (state.settings.ttsVoice !== 'device') await prepareNarratorVoice({ allowDownload:false })
      await speak(state.settings.ttsVoice === 'device' ? 'こんにちは。アイフォンの読み上げ音声です。' : 'こんにちは。つくよみちゃんです。いっしょに、たのしく、まなぼうね。', { voiceStyle: state.settings.ttsVoice })
    } catch {}
  }

  const downloadVoice = async () => {
    try { await prepareNarratorVoice({ allowDownload:true }) } catch {}
  }

  const exportData = async () => {
    const text = serializeForExport(state)
    try { await navigator.clipboard.writeText(text); setMessage('✅ 学習データをコピーしました') }
    catch { setMessage('下のコードをコピーして保存してください'); setImportText(text) }
  }

  const importData = () => {
    try { dispatch({ type:'IMPORT_STATE', data: parseImport(importText.trim()) }); setMessage('✅ 学習データを読み込みました') }
    catch { setMessage('⚠️ 学習データの形式を確認してください') }
  }

  const importKidsQuestData = () => {
    const result = importKidsQuestProgress(state)
    if (result.status === 'imported') {
      dispatch({ type:'IMPORT_STATE', data: result.state })
      setMessage('✅ Kids Questの学習進捗を読み込みました')
    } else if (result.status === 'already-imported') {
      setMessage('✅ このKids Questデータは読み込み済みです')
    } else if (result.status === 'not-found') {
      setMessage('Kids Questの保存データがこの端末に見つかりません')
    } else {
      setMessage('⚠️ 対応しているKids Quest学習データではありません')
    }
  }

  const cleanNewProfileName = newProfileName.trim()

  return <div className="screen fade-in parent-screen"><Starfield /><AppHeader onBack={onBack} title="👨‍👩‍👧 保護者メニュー" right={<span>🔒</span>}/>
    <div className="scroll-y parent-scroll"><div className="parent-content">
      <section className="parent-control-note">
        <strong>🔒 おとなだけが変える設定</strong>
        <p>子どもは登録済みの人を自分で切り替えられます。名前の追加・変更、学年、難易度、クラウド、TEST、復元などはここで管理します。</p>
      </section>

      <section className="parent-shortcuts">
        <button onClick={()=>jumpTo('parent-profile')}>🧒<strong>プロフィール</strong></button>
        <button onClick={()=>jumpTo('parent-grade')}>🎓<strong>学年・先取り</strong></button>
        <button onClick={()=>jumpTo('parent-difficulty')}>🔥<strong>むずかしさ</strong></button>
        <button onClick={()=>jumpTo('parent-voice')}>🌙<strong>読み上げ</strong></button>
        <button onClick={()=>jumpTo('parent-cloud')}>☁️<strong>クラウド・TEST</strong></button>
        <button onClick={()=>jumpTo('parent-monster-images')}>🖼️<strong>画像を端末保存</strong></button>
        <button onClick={()=>jumpTo('parent-backup')}>📦<strong>手動ひきつぎ</strong></button>
      </section>

      <section id="parent-profile"><h3>🧒 子どもプロフィール</h3><div className="card" style={{display:'grid',gap:10}}>
        <p className="muted" style={{margin:0,lineHeight:1.6}}>子ども画面では、ここで登録した人どうしをPINなしで切り替えられます。名前を変えても学習・モンスターのデータIDは変わりません。</p>
        <div className="parent-profile-editor-list">{Object.entries(state.profiles || {}).map(([id,profile]) => <ProfileEditor key={id} id={id} profile={profile} active={id===state.activeProfileId} dispatch={dispatch} />)}</div>
        <div className="row wrap" style={{gap:8}}><input value={newProfileName} onChange={(e)=>setNewProfileName(e.target.value)} placeholder="追加する人の なまえ" style={{minHeight:46,flex:1,borderRadius:12,padding:'0 10px'}}/><button className="btn btn--sun" disabled={!cleanNewProfileName} onClick={()=>{dispatch({type:'CREATE_PROFILE',name:cleanNewProfileName});setNewProfileName('')}}>＋ 追加</button></div>
      </div></section>

      <section id="parent-grade"><h3>🎓 学年・先取り</h3><div className="card"><p className="muted" style={{lineHeight:1.6}}>現在の学習学年: <b>{gradeOf(state.grade).short}</b> ／ 解放済み: <b>{gradeOf(state.gradeMax).short}</b> まで。子どもは学年を変更できません。通常は必須単元を別日に定着させ、ほしのしれんをクリアすると次の学年が解放されます。先取りさせる場合だけ、ここで保護者が解放してください。</p>
        <div className="row wrap" style={{gap:8}}>{state.gradeMax<MAX_GRADE && <button className="btn btn--sun" onClick={()=>dispatch({type:'FORCE_GRADE_MAX',gradeMax:state.gradeMax+1})}>⏭ {gradeOf(state.gradeMax+1).short} を先取り解放</button>}{state.gradeMax>0 && <button className="btn btn--ghost" onClick={()=>dispatch({type:'LOWER_GRADE_MAX',gradeMax:state.gradeMax-1})}>⏪ 解放を {gradeOf(state.gradeMax-1).short} まで戻す</button>}</div>
        <div style={{marginTop:14}}><strong>いま学習する学年</strong><div className="row wrap" style={{gap:6,marginTop:8}}>{GRADES.filter(g=>g.id<=state.gradeMax).map(g=><button key={g.id} className={'btn '+(g.id===state.grade?'btn--primary':'btn--ghost')} onClick={()=>dispatch({type:'SET_GRADE',grade:g.id})}>{g.emoji} {g.short}</button>)}</div></div>
      </div></section>

      <section id="parent-difficulty"><h3>🔥 むずかしさ</h3><div className="card"><p className="muted" style={{fontSize:13,lineHeight:1.6}}>子どもは難易度を選べません。通常の学習では正誤履歴からヒント量などを自動調整します。「むずかしい」は保護者が明示的にONにしたときだけ、別の習熟度・復習台帳で発展問題を出します。</p><div className="row" style={{gap:8}}><button className={'btn '+(state.settings.mode==='normal'?'btn--primary':'btn--ghost')} onClick={()=>setSetting('mode','normal')}>ふつう</button><button className={'btn '+(state.settings.mode==='hard'?'btn--pink':'btn--ghost')} onClick={()=>setSetting('mode','hard')}>🔥 むずかしい</button></div></div></section>

      <section id="parent-voice"><h3>🌙 読み上げ・つくよみちゃん</h3><div className="card" style={{display:'grid',gap:12}}>
        <p className="muted" style={{margin:0,lineHeight:1.6}}>つくよみちゃんを使う場合は、①「つくよみちゃん」を選ぶ → ②「端末に保存」 → ③「声をテスト」の順です。</p>
        <label className="row" style={{justifyContent:'space-between'}}><strong>問題を読み上げる</strong><input type="checkbox" checked={state.settings.tts} onChange={e=>setSetting('tts',e.target.checked)}/></label>
        <div className="row wrap" style={{gap:8}}><button className={'btn '+(state.settings.ttsVoice!=='device'?'btn--primary':'btn--ghost')} onClick={()=>setSetting('ttsVoice','neural')}>🌙 つくよみちゃん</button><button className={'btn '+(state.settings.ttsVoice==='device'?'btn--primary':'btn--ghost')} onClick={()=>setSetting('ttsVoice','device')}>📱 端末の声</button></div>
        <div className="pill" style={{whiteSpace:'normal',lineHeight:1.5}}>{statusText(narratorStatus)}</div>
        {state.settings.ttsVoice!=='device' && <div className="row wrap" style={{gap:8}}><button className="btn btn--sun" onClick={downloadVoice}>① ⬇️ つくよみちゃんを端末に保存</button><button className="btn btn--ghost" onClick={testVoice}>② 🔊 声をテスト</button></div>}
        {state.settings.ttsVoice==='device' && <button className="btn btn--ghost" onClick={testVoice}>🔊 声をテスト</button>}
        <div><strong>はやさ</strong><div className="row wrap" style={{gap:6,marginTop:6}}>{TTS_RATE_PRESETS.map(p=><button key={p.value} className={'btn '+(state.settings.ttsRate===p.value?'btn--primary':'btn--ghost')} onClick={()=>setSetting('ttsRate',p.value)}>{p.label}</button>)}</div></div>
        <label><strong>おおきさ {Math.round(state.settings.ttsVolume*100)}%</strong><input style={{width:'100%'}} type="range" min="0.3" max="1" step="0.1" value={state.settings.ttsVolume} onChange={e=>setSetting('ttsVolume',Number(e.target.value))}/></label>
        <p className="muted" style={{fontSize:12,lineHeight:1.6,margin:0}}>つくよみちゃんのモデルは初回だけ端末に保存します。読み上げる文章を外部サーバーへ送信しません。</p>
      </div></section>

      <section id="parent-cloud" className="parent-cloud-entry"><h3>☁️ クラウド・バックアップ・TEST</h3><div className="card" style={{display:'grid',gap:9}}><p className="muted" style={{margin:0,lineHeight:1.6}}>ログイン、端末間同期、競合確認、クラウドバックアップ、TESTデータをここからまとめて開きます。いま保護者PINを確認済みなので、同じPINをもう一度入れる必要はありません。</p><button className="btn btn--primary" onClick={openAdultCloudControls}>☁️ クラウド・TESTをひらく</button></div></section>

      <section><h3>📊 きょうの がんばり</h3><div className="row wrap"><Stat label="クリアした タスク" value={daily.tasksClearedToday}/><Stat label="といた もんだい" value={daily.attemptsToday}/><Stat label="せいかい率" value={`${accuracy}%`}/><Stat label="追加チケット" value={daily.ticketsEarnedToday}/><Stat label="連続日数" value={`${state.streak}日`}/><Stat label="克服した数" value={state.conquered}/></div></section>

      <section><h3>🌱 ほしのしれんまで</h3><div className="card">{unlock.missing.length ? <div className="muted" style={{lineHeight:1.7}}>あと {unlock.missing.length}こ：{unlock.missing.slice(0,12).map(unitLabel).join('、')}{unlock.missing.length>12?'…':''}</div> : <strong>必須単元はそろっています。しれんに ちょうせんできます。</strong>}</div></section>

      <section><h3>📈 とくい・にがて</h3><div style={{display:'grid',gap:8}}>{currentDomains.map((domain)=>{const sk=skillOf(state,domain.id);const today=daily.perDomainToday?.[domain.id];return <div key={domain.id} className="card row" style={{alignItems:'center',gap:12}}><span style={{fontSize:28}}>{domain.emoji}</span><div className="grow"><strong>{domainName(domain,state.grade)}</strong><div className="muted" style={{fontSize:12}}>内部レベル {Math.floor(sk.level)} ・ きょう {today?`${today.correct}/${today.attempts}`:'0/0'}</div></div><span className="pill">{trendLabel(sk)}</span></div>})}</div><p className="muted" style={{fontSize:12}}>この内部レベルは問題選択のための自動指標で、子どもが変更するものではありません。復習予定は「とっくん」に出ます（現在 {missedCount(state)}こ）。</p></section>

      <section><h3>🔊 効果音</h3><div className="card"><label className="row" style={{justifyContent:'space-between'}}><strong>効果音を使う</strong><input type="checkbox" checked={state.settings.sfx} onChange={e=>setSetting('sfx',e.target.checked)}/></label></div></section>

      <section><h3>💗 どうとく</h3><div className="card"><label className="row" style={{justifyContent:'space-between',gap:10}}><div><strong>高学年で「生き物の死」も扱う</strong><div className="muted" style={{fontSize:12}}>保護者がONにした場合だけ出題候補に入ります。</div></div><input type="checkbox" checked={state.settings.showLifeEndTopics} onChange={e=>setSetting('showLifeEndTopics',e.target.checked)}/></label></div></section>

      <section id="parent-monster-images"><h3>🖼️ モンスター画像を端末に保存</h3><DexArtPackControls /></section>

      <section id="parent-backup"><h3>📦 手動の学習データひきつぎ</h3><div className="card" style={{display:'grid',gap:8}}><button className="btn btn--ghost" onClick={exportData}>📋 学習データをコピー</button><textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="バックアップコードを貼り付け" style={{minHeight:90,borderRadius:12,padding:10}}/><button className="btn btn--ghost" disabled={!importText.trim()} onClick={importData}>⬇️ 読み込む</button><div className="muted" style={{fontSize:12,lineHeight:1.6}}>同じ端末のKids Questに対応する学習進捗がある場合だけ、読み取り専用でManaEvoへコピーできます。Kids Quest側の保存やモンスター・バトル状態は変更しません。</div><button className="btn btn--ghost" onClick={importKidsQuestData}>↪ Kids Questの学習進捗を読み込む</button>{message && <div className="muted">{message}</div>}</div></section>
    </div></div>
  </div>
}
