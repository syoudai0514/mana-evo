import React from 'react'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { speciesOf } from './game/content.js'
import { canNormalEvolve, levelsUntilEvolution } from './game/engine.js'
import { availableTicketCount, specialProgressionStatus } from './game/progression.js'
import './how-to-play.css'

function NextEvolutionCard({ game }) {
  const monster = game.box?.[game.activeMonsterId]
  if (!monster) return null
  const species = speciesOf(monster.speciesId)
  const evo = species?.evolution
  const ready = canNormalEvolve(monster, game)
  const left = levelsUntilEvolution(monster)

  let title = 'さいごの すがたまで シンカしているよ！'
  let detail = 'つぎは もっと そだてたり、ほかの なかまを シンカさせてみよう！'

  if (evo?.method === 'level') {
    title = ready ? 'いま シンカできるよ！' : `あと ${left} レベル！`
    detail = ready
      ? '「モンスター」を ひらいて、「シンカさせる！」を おそう！'
      : `レベル ${evo.level}に なると シンカできるよ。バトルで けいけんを ためよう！`
  }

  if (evo?.method === 'stone') {
    const count = game.evolutionItems?.stones?.[evo.itemId] || 0
    title = count > 0 ? 'ひかりのいしを もっているよ！' : 'ひかりのいしを さがそう！'
    detail = count > 0
      ? '「モンスター」を ひらいて、「シンカさせる！」を おそう！ いしは 1こ つかうよ。'
      : '「1-5 ひかりいわば」を クリアすると、ひかりのいしが 1こ もらえるよ！'
  }

  if (evo?.method === 'held_item_level') {
    const equipped = monster.heldItemId === evo.heldItemId
    const owned = (game.evolutionItems?.heldItems?.[evo.heldItemId] || 0) > 0
    if (ready) {
      title = 'いま シンカできるよ！'
      detail = 'きずなのチャームを もっているよ。「シンカさせる！」を おそう！'
    } else if (!equipped && owned) {
      title = 'きずなのチャームを もたせよう！'
      detail = '「モンスター」を ひらいて、チャームを もたせよう。そのあと レベル10いじょうを めざそう！'
    } else if (!equipped) {
      title = 'きずなのチャームを さがそう！'
      detail = '「1-6 きずなのよみち」を クリアすると、きずなのチャームが 1こ もらえるよ！'
    } else {
      title = `あと ${Math.max(0, evo.level - monster.level)} レベル！`
      detail = 'きずなのチャームは もっているよ。レベル10いじょうまで そだてよう！'
    }
  }

  return (
    <section className="howto-next-card">
      <div className="howto-next-monster"><PlaceholderMonster speciesId={monster.speciesId} compact /></div>
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
  const special = active ? specialProgressionStatus(active, game) : null

  return (
    <main className="screen howto-screen">
      <button className="back" onClick={goHome}>← ホームへ</button>

      <section className="howto-hero">
        <div>
          <p className="howto-mini">マナエボ</p>
          <h1>あそびかた</h1>
          <p>まなぶ → ぼうけん → ゲット → そだてる → シンカ！</p>
        </div>
        <div className="howto-ticket">🎫<strong>{tickets}</strong><span>まい</span></div>
      </section>

      <NextEvolutionCard game={game} />

      <section className="howto-section">
        <div className="howto-section-title"><span>⭐</span><div><p>まずは ここから！</p><h2>あそぶ じゅんばん</h2></div></div>
        <div className="howto-steps">
          <Step number="1" icon="📚" title="きょうの 5きょうか！">すきな じゅんばんで 5きょうか。こくご・さんすうは 5もん、ほかは 4もんくらい。ぜんぶ おわると、バトルチケットが 3まいと、ほしのわが 3こ もらえるよ！</Step>
          <Step number="2" icon="🗺️" title="マップへ いこう！">バトルを はじめると、チケットを 1まい つかうよ。</Step>
          <Step number="3" icon="⚔️" title="バトルしよう！">あいての たいりょくを はんぶんまで へらすと、「わ」で ゲットに ちょうせんできるよ！</Step>
          <Step number="4" icon="⭐" title="なかまを ゲット！">「わ」は 1かいの バトルで 3かいまで。4つ ひかると ゲットだよ！</Step>
          <Step number="5" icon="🎯" title="もっと バトルしたい！">ついかチャレンジは 3もん。2もん できたら、バトルチケットが 1まい もらえるよ！</Step>
          <Step number="6" icon="✨" title="そだてて シンカ！">バトルで けいけんを ためて レベルアップ！ シンカの じょうけんが そろったら シンカできるよ。</Step>
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
          <div><h3>レベルで シンカ</h3><p>モンスターごとに、シンカできる レベルが ちがうよ。「モンスター」を みると、あと なんレベルか わかるよ！</p></div>
        </article>

        <article className="howto-evo-card special-item">
          <div className="howto-evo-badge">2</div>
          <div>
            <h3>💎 ひかりのいしで シンカ</h3>
            <p><b>「1-5 ひかりいわば」</b>を クリアすると、<b>ひかりのいしが 1こ</b> もらえるよ！</p>
            <div className="howto-route"><span>1-5を クリア</span><b>→</b><span>ひかりのいし</span><b>→</b><span>シンカ！</span></div>
            <small>シンカすると いしを 1こ つかうよ。</small>
          </div>
        </article>

        <article className="howto-evo-card special-item">
          <div className="howto-evo-badge">3</div>
          <div>
            <h3>🎀 きずなのチャームで シンカ</h3>
            <p><b>「1-6 きずなのよみち」</b>を クリアすると、<b>きずなのチャームが 1こ</b> もらえるよ！</p>
            <div className="howto-route"><span>1-6を クリア</span><b>→</b><span>チャームを もつ</span><b>→</b><span>レベル10</span><b>→</b><span>シンカ！</span></div>
            <small>チャームは シンカしても そのまま もっているよ。</small>
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
        </div>
      </section>

      <section className="howto-section howto-coming-soon">
        <div className="howto-section-title"><span>🔷</span><div><p>もっと つよく！</p><h2>ギガシンカ と キョダイバースト</h2></div></div>
        <article>
          <h3>🔷 ギガシンカ</h3>
          <p>{special?.giga.isFinal ? 'さいごの すがたまで シンカしているね！' : 'まずは さいごの すがたまで シンカしよう！'}</p>
          <p>ギガキーと ギガコアの データは あるよ。だけど、もらえる ばしょと バトルで つかうところは まだ じゅんびちゅう！</p>
        </article>
        <article>
          <h3>💥 キョダイバースト</h3>
          <p>「しるし」を つかう データは あるよ。だけど、「しるし」を もらう ばしょと バトルで つかうところは まだ じゅんびちゅう！</p>
        </article>
        <div className="howto-soon-label">🚧 いまは まだ つかえないよ</div>
      </section>

      <button className="secondary howto-home-button" onClick={goHome}>🏠 ホームへ もどる</button>
    </main>
  )
}
