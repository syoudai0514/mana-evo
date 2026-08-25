import React from 'react'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { EVOLUTION_ITEMS, STAGES, speciesOf } from './game/content.js'
import { canNormalEvolve, levelsUntilEvolution } from './game/engine.js'
import { availableTicketCount, specialProgressionStatus } from './game/progression.js'
import './how-to-play.css'

function evolutionTrialFor(species) {
  const evo = species?.evolution
  if (!evo || !['stone', 'held_item_levelup'].includes(evo.method)) return null
  const itemId = evo.method === 'stone' ? evo.itemId : evo.heldItemId
  return STAGES.find((stage) => stage.kind === 'evolution-trial' && stage.requiresOwnedSpeciesId === species.id && stage.evolutionReward?.itemId === itemId) || null
}

function NextEvolutionCard({ game }) {
  const monster = game.box?.[game.activeMonsterId]
  if (!monster) return null
  const species = speciesOf(monster.speciesId)
  const evo = species?.evolution
  const ready = canNormalEvolve(monster, game)
  const left = levelsUntilEvolution(monster)
  const trial = evolutionTrialFor(species)

  let title = 'さいごの すがたまで シンカしているよ！'
  let detail = 'ほかの なかまも そだてたり、とくべつな しれんに ちょうせんしよう！'

  if (evo?.method === 'level') {
    title = ready ? 'いま シンカできるよ！' : `あと ${left} レベル！`
    detail = ready
      ? '「モンスター」を ひらいて、「シンカさせる！」を おそう！'
      : `レベル ${evo.level}に なると シンカできるよ。バトルで けいけんを ためよう！`
  }

  if (evo?.method === 'stone') {
    const item = EVOLUTION_ITEMS.stones[evo.itemId]
    const count = game.evolutionItems?.stones?.[evo.itemId] || 0
    title = count > 0 ? `${item?.name || 'シンカのいし'}を もっているよ！` : `${item?.name || 'シンカのいし'}を さがそう！`
    detail = count > 0
      ? '「モンスター」を ひらいて、「シンカさせる！」を おそう！ いしは 1こ つかうよ。'
      : trial
        ? `マップの「${trial.label}」を クリアすると 1こ もらえるよ！`
        : 'マップの シンカしれんで ひつような アイテムを てにいれよう！'
  }

  if (evo?.method === 'held_item_levelup') {
    const item = EVOLUTION_ITEMS.heldItems[evo.heldItemId]
    const equipped = monster.heldItemId === evo.heldItemId
    const owned = (game.evolutionItems?.heldItems?.[evo.heldItemId] || 0) > 0
    if (ready) {
      title = 'いま シンカできるよ！'
      detail = `${item?.name || 'ひつような もちもの'}を もって レベルアップできたよ。「シンカさせる！」を おそう！`
    } else if (!equipped && owned) {
      title = `${item?.name || 'もちもの'}を もたせよう！`
      detail = '「モンスター」を ひらいて もちものを もたせ、そのあと 1かい レベルアップすると シンカの じゅんびが できるよ。'
    } else if (!equipped) {
      title = `${item?.name || 'もちもの'}を さがそう！`
      detail = trial
        ? `マップの「${trial.label}」を クリアすると 1こ もらえるよ！`
        : 'マップの シンカしれんで ひつような もちものを てにいれよう！'
    } else {
      title = 'つぎの レベルアップを めざそう！'
      detail = `${item?.name || 'もちもの'}は もっているよ。バトルで 1かい レベルアップすると シンカの じゅんびが できるよ。`
    }
  }

  return (
    <section className="howto-next-card">
      <div className="howto-next-monster"><PlaceholderMonster speciesId={monster.speciesId} size={92} /></div>
      <div>
        <p className="howto-mini">いまの なかまは？</p>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </section>
  )
}

function Step({ number, icon, title, children }) {
  return (
    <article className="howto-step">
      <div className="howto-step-number">{number}</div>
      <div className="howto-step-icon">{icon}</div>
      <div><h3>{title}</h3><p>{children}</p></div>
    </article>
  )
}

export default function HowToPlay({ game, today, goHome, goAdventure, goMonsters, goStudy }) {
  const tickets = availableTicketCount(game, today)
  const active = game.box?.[game.activeMonsterId]
  const activeSpecies = active ? speciesOf(active.speciesId) : null
  const special = active ? specialProgressionStatus(active, game) : null

  return (
    <main className="screen howto-screen">
      <button className="back" onClick={goHome}>← ホームへ</button>

      <section className="howto-hero">
        <div>
          <p className="howto-mini">マナエボ</p>
          <h1>あそびかた</h1>
          <p>まなぶ → ぼうけん → 「わ」を なげる → ゲット → そだてる → シンカ！</p>
        </div>
        <div className="howto-ticket">🎫<strong>{tickets}</strong><span>まい</span></div>
      </section>

      <NextEvolutionCard game={game} />

      <section className="howto-section">
        <div className="howto-section-title"><span>⭐</span><div><p>まずは ここから！</p><h2>あそぶ じゅんばん</h2></div></div>
        <div className="howto-steps">
          <Step number="1" icon="📚" title="きょうの 5きょうか！">すきな じゅんばんで 5きょうか。こくご・さんすうは 5もん、ほかは 4もんくらい。ぜんぶ おわると、バトルチケットが 3まいと、ほしのわが 3こ もらえるよ！</Step>
          <Step number="2" icon="🗺️" title="マップへ いこう！">バトルを はじめると、チケットを 1まい つかうよ。ボスや しれんは GETできないことも あるよ。</Step>
          <Step number="3" icon="⚔️" title="HPを はんぶんまで へらそう！">GETできる あいては、HPが はんぶんいかに なると「わを なげる！」が つかえるよ。</Step>
          <Step number="4" icon="⭐" title="「わ」を なげよう！">ほし・ぎん・きん・にじ から つかう「わ」を えらんで タップ！ 1バトルで 3かいまで なげられるよ。</Step>
          <Step number="5" icon="✨" title="4つ ひかったら GET！">「わ」が 4つ ひかると GET！ しっぱいすると あいてが 1かい こうげきしてくるよ。</Step>
          <Step number="6" icon="🎯" title="もっと バトルしたい！">ついかチャレンジは 3もん。2もん できたら、バトルチケットが 1まい もらえるよ！</Step>
          <Step number="7" icon="🌱" title="そだてて シンカ！">バトルで けいけんを ためて レベルアップ！ シンカの じょうけんが そろったら「モンスター」から シンカできるよ。2だんかいめの すがたは、まず じぶんで シンカさせるのが だいじ！ いちど シンカすると、おくの つよいゾーンでも であえるようになるよ。</Step>
        </div>
        <div className="howto-actions">
          <button className="primary" onClick={goStudy}>📚 まなぶ！</button>
          <button className="secondary" onClick={goAdventure}>🗺️ マップへ！</button>
        </div>
      </section>

      <section className="howto-section howto-evolution-section">
        <div className="howto-section-title"><span>🌟</span><div><p>ここが だいじ！</p><h2>シンカの しかた</h2></div></div>

        <article className="howto-evo-card">
          <div className="howto-evo-badge">1</div>
          <div><h3>レベルで シンカ</h3><p>モンスターごとに シンカする レベルが ちがうよ。「モンスター」を みると あと なんレベルか わかるよ！</p></div>
        </article>

        <article className="howto-evo-card special-item">
          <div className="howto-evo-badge">2</div>
          <div>
            <h3>💎 シンカの いしで シンカ</h3>
            <p>シンカの いしが ひつような なかまは、その なかまを GETすると マップに <b>せんようの「シンカしれん」</b>が でるよ。はじめて クリアすると ひつような いしが 1こ もらえるよ！</p>
            <div className="howto-route"><span>なかまを GET</span><b>→</b><span>シンカしれん</span><b>→</b><span>いしを GET</span><b>→</b><span>シンカ！</span></div>
            <small>いしは シンカすると 1こ つかうよ。</small>
          </div>
        </article>

        <article className="howto-evo-card special-item">
          <div className="howto-evo-badge">3</div>
          <div>
            <h3>🎀 もちもので シンカ</h3>
            <p>せんようの シンカしれんで もちものを GET → 「モンスター」で もたせる → そのあと <b>1かい レベルアップ</b>すると シンカの じゅんびが できるよ。</p>
            <div className="howto-route"><span>もちもの GET</span><b>→</b><span>もたせる</span><b>→</b><span>レベルアップ</span><b>→</b><span>シンカ！</span></div>
            <small>もちものは シンカしても そのまま もっているよ。</small>
          </div>
        </article>

        <button className="primary howto-monster-button" onClick={goMonsters}>🐾 モンスターを みる！</button>
      </section>

      <section className="howto-section">
        <div className="howto-section-title"><span>🎁</span><div><p>もっと ほしいときは？</p><h2>ごほうびの もらいかた</h2></div></div>
        <div className="howto-reward-grid">
          <article><strong>🎫 バトルチケット</strong><p>きょうの 5きょうかを ぜんぶ クリアで 3まい。そのあとは「ついかチャレンジ」3もん中2もんで 1まい！</p></article>
          <article><strong>📚 じゆうべんきょう</strong><p>すきな きょうかを いつでも べんきょうできるよ。ここでは バトルチケットは でないよ。</p></article>
          <article><strong>⭐ ほしのわ</strong><p>きょうの 5きょうかを ぜんぶ クリアすると 3こ もらえるよ！</p></article>
          <article><strong>⚪ ぎんのわ</strong><p>ひとつの まなびを しっかり マスターすると 1こ もらえるよ！</p></article>
          <article><strong>🟡 きんのわ</strong><p>「むずかしい」を しっかり マスターすると 1こ もらえるよ！</p></article>
          <article><strong>🌈 にじのわ</strong><p>ぜんエリアの さいごの EXしれんを クリアすると もらえる、とくべつな 100% GETの「わ」だよ！</p></article>
        </div>
      </section>

      <section className="howto-section">
        <div className="howto-section-title"><span>🔷</span><div><p>もっと つよく！</p><h2>ギガシンカ と キョダイバースト</h2></div></div>
        <article>
          <h3>🔷 ギガシンカ</h3>
          <p>エリア1の ボスを たおすと ギガキーが ひらくよ。ギガたいしょうの なかまを さいごの すがたまで そだてる → せんようの ギガしれんを クリア → その なかまの ギガコアを GET！</p>
          <p>{special?.giga.eligibleSpecies ? `${activeSpecies?.name}：キー ${special.giga.hasKey ? '✅' : '⬜'} / コア ${special.giga.hasCore ? '✅' : '⬜'}${special.giga.registered ? ' / すがた登録 ✅' : ''}` : 'ギガシンカできる なかまは 12たい いるよ。'}</p>
          <small>1バトルで 1かい。バトルがおわるまで ぜんのうりょく ×1.35。</small>
        </article>
        <article>
          <h3>💥 キョダイバースト</h3>
          <p>バーストたいしょうの なかまを さいごの すがたまで そだてる → せんようの バーストしれんを クリア → 「バーストのしるし」を GET！</p>
          <p>{special?.burst.eligibleSpecies ? `${activeSpecies?.name}：しるし ${special.burst.hasMark ? '✅' : '⬜'}${special.burst.registered ? ' / すがた登録 ✅' : ''}` : 'キョダイバーストできる なかまは 8たい いるよ。'}</p>
          <small>3ターン。HP×2 / こうげき×1.2。主力わざが バーストせんようわざに かわるよ。</small>
        </article>
      </section>

      <button className="secondary howto-home-button" onClick={goHome}>🏠 ホームへ もどる</button>
    </main>
  )
}
