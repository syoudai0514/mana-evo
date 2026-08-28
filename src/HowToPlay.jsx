import React, { useState } from 'react'
import PlaceholderMonster from './game/PlaceholderMonster.jsx'
import { EVOLUTION_ITEMS, speciesOf } from './game/content.js'
import { canNormalEvolve, levelsUntilEvolution } from './game/engine.js'
import { availableTicketCount } from './game/progression.js'
import './how-to-play.css'

const HELP_TOPICS = [
  { id: 'learning', icon: '📚', title: 'まなび と チケット', summary: 'きょうの まなびと ごほうび' },
  { id: 'adventure', icon: '🗺️', title: 'ぼうけん と たんさく', summary: 'バトルへ いく・シンカアイテムを さがす' },
  { id: 'capture', icon: '✨', title: 'バトル と GET', summary: 'HPを へらして ボールを なげる' },
  { id: 'evolution', icon: '🌱', title: 'そだてる・シンカ', summary: 'じぶんで そだてて シンカする' },
  { id: 'special', icon: '🔷', title: 'とくべつな すがた', summary: 'ギガシンカ と キョダイバースト' }
]

function NextEvolutionCard({ game }) {
  const monster = game.box?.[game.activeMonsterId]
  if (!monster) return null
  const species = speciesOf(monster.speciesId)
  const evo = species?.evolution
  if (!evo) return null

  const ready = canNormalEvolve(monster, game)
  const left = levelsUntilEvolution(monster)
  let title = 'つぎの シンカを めざそう！'
  let detail = 'バトルで そだてて、シンカの じょうけんを そろえよう。'

  if (evo.method === 'level') {
    title = ready ? 'シンカの じょうけんに とどいているよ！' : `あと ${left} レベル！`
    detail = ready
      ? 'モンスターの じょうたいを みて、つぎの シンカを たしかめよう。'
      : `レベル ${evo.level}に とどくように、バトルで そだてよう。`
  }

  if (evo.method === 'stone') {
    const item = EVOLUTION_ITEMS.stones[evo.itemId]
    const count = game.evolutionItems?.stones?.[evo.itemId] || 0
    title = count > 0 ? `${item?.name || 'シンカのいし'}を もっているよ！` : `${item?.name || 'シンカのいし'}を さがそう！`
    detail = count > 0
      ? '「モンスター」で いしを 1こ つかうと シンカできるよ。'
      : 'まなびで たんさくポイントを ためて、たんさくで シンカアイテムを さがそう。'
  }

  if (evo.method === 'held_item_levelup') {
    const item = EVOLUTION_ITEMS.heldItems[evo.heldItemId]
    const equipped = monster.heldItemId === evo.heldItemId
    const owned = (game.evolutionItems?.heldItems?.[evo.heldItemId] || 0) > 0
    if (ready) {
      title = 'シンカの じょうけんに とどいているよ！'
      detail = 'ひつような もちものを もって レベルアップした じょうたいだよ。モンスターを みてみよう。'
    } else if (!equipped && owned) {
      title = `${item?.name || 'もちもの'}を もたせよう！`
      detail = '「モンスター」で もちものを もたせて、そのあと ほんとうに レベルアップすると シンカするよ。'
    } else if (!equipped) {
      title = `${item?.name || 'もちもの'}を さがそう！`
      detail = 'まなびで たんさくポイントを ためて、たんさくで ひつような もちものを さがそう。'
    } else {
      title = 'つぎの レベルアップを めざそう！'
      detail = `${item?.name || 'もちもの'}を もっているよ。つぎに レベルアップすると シンカするよ。`
    }
  }

  return (
    <section className="howto-next-card">
      <div className="howto-next-monster"><PlaceholderMonster speciesId={monster.speciesId} size={92} /></div>
      <div>
        <p className="howto-mini">いまの なかま</p>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </section>
  )
}

function TopicHeader({ icon, kicker, title }) {
  return <div className="howto-section-title"><span>{icon}</span><div><p>{kicker}</p><h2>{title}</h2></div></div>
}

export default function HowToPlay({ game, today, goHome, goAdventure, goMonsters, goStudy }) {
  const [topic, setTopic] = useState(null)
  const tickets = availableTicketCount(game, today)

  return (
    <main className="screen howto-screen">
      <button className="back" onClick={goHome}>← ホームへ</button>

      <section className="howto-hero">
        <div>
          <p className="howto-mini">マナエボ</p>
          <h1>あそびかた</h1>
          <p>まなぶ → チケット → ぼうけん → バトル → GET → そだてる → じぶんで シンカ！</p>
        </div>
        <div className="howto-ticket">🎫<strong>{tickets}</strong><span>まい</span></div>
      </section>

      <section className="howto-section">
        <TopicHeader icon="❓" kicker="しりたい ことを ひとつ えらぼう" title="なにを しりたい？" />
        <div className="howto-steps">
          {HELP_TOPICS.map((item) => <button key={item.id} className="howto-home-card" onClick={() => setTopic(item.id)}>
            <strong>{item.icon} {item.title}</strong><span>{item.summary} →</span>
          </button>)}
        </div>
      </section>

      {topic && <button className="secondary" onClick={() => setTopic(null)}>← しつもんを えらびなおす</button>}

      {topic === 'learning' && <section className="howto-section">
        <TopicHeader icon="📚" kicker="まず まなぶ" title="まなび と チケット" />
        <div className="howto-reward-grid">
          <article><strong>きょうの 5タスク</strong><p>5つ ぜんぶ おわると、はじめの 1かいだけ チケット3まい・ほしボール3こ・たんさくポイント2ポイントを もらえるよ。きょうの まなびが おわるまで、あたらしい バトルは はじめられないよ。</p></article>
          <article><strong>ついかの もんだい</strong><p>ついかの もんだいは、1もん クリアするたびに チケット1まい と たんさくポイント1ポイント。なんもんでも ちょうせんできるよ。</p></article>
          <article><strong>もっと せいかい</strong><p>ついかの まなびで せいかいが 3こ たまるごとに、ほしボール1こ。じゆうべんきょうは、ちょくせつ チケットを ふやさないよ。</p></article>
        </div>
        <button className="primary howto-monster-button" onClick={goStudy}>📚 まなびへ いく！</button>
      </section>}

      {topic === 'adventure' && <section className="howto-section">
        <TopicHeader icon="🗺️" kicker="つぎは ぼうけん" title="ぼうけん と たんさく" />
        <div className="howto-steps">
          <article className="howto-step"><div className="howto-step-number">1</div><div className="howto-step-icon">🗺️</div><div><h3>いく ばしょを えらぶ</h3><p>ひらいている エリアから、であいたい モンスターや バトルを えらぼう。</p></div></article>
          <article className="howto-step"><div className="howto-step-number">2</div><div className="howto-step-icon">🧭</div><div><h3>5ポイントで たんさく</h3><p>たんさくポイントを 5ポイント つかうと、ひらいている エリアを 1かい たんさくできるよ。1日に なんかいでも できるよ。</p></div></article>
          <article className="howto-step"><div className="howto-step-number">3</div><div className="howto-step-icon">💎</div><div><h3>シンカアイテムを さがす</h3><p>たんさくは、ふつうの そざいが 80%、シンカアイテムが 20%。シンカアイテムが 5かい つづけて でなかったら、6かいめは そのエリアの シンカアイテムを 1こ えらべるよ。</p></div></article>
        </div>
        <button className="primary howto-monster-button" onClick={goAdventure}>🗺️ ぼうけんへ いく！</button>
      </section>}

      {topic === 'capture' && <section className="howto-section">
        <TopicHeader icon="✨" kicker="HPを はんぶんまで へらそう" title="バトル と GET" />
        <p>バトルを はじめると、チケットを 1まい あずけるよ。かつか GETできたら その1まいを つかい、まけたり バトルを やめたりしたときは もどってくるよ。</p>
        <div className="howto-reward-grid">
          <article><strong>① HPが はんぶんいか</strong><p>GETできる あいては、HPが はんぶんいかに なると ボールを なげられるよ。</p></article>
          <article><strong>② ボールを なげよう！</strong><p>ボールを なげられるのは、1つの バトルで さいだい 3かいまで。</p></article>
          <article><strong>🔵 ほしボール</strong><p>きほんの つかまえやすさ。</p></article>
          <article><strong>⚪ ぎんボール</strong><p>ほしボールの 1.2ばい つかまえやすいよ。</p></article>
          <article><strong>🟡 きんボール</strong><p>ほしボールの 1.5ばい つかまえやすいよ。</p></article>
          <article><strong>✨ にじボール</strong><p>つかえば かならず GETできる とくべつな ボールだよ。</p></article>
        </div>
        <p><strong>ボールを なげる → モンスターを つつむ → 4つの ほしが 1こずつ ひかる。</strong> 4つ ぜんぶ そろったら GET！ そろう まえに とびだすことも あるよ。</p>
        <button className="primary howto-monster-button" onClick={goAdventure}>⚔️ バトルを さがす！</button>
      </section>}

      {topic === 'evolution' && <>
        <NextEvolutionCard game={game} />
        <section className="howto-section howto-evolution-section">
          <TopicHeader icon="🌱" kicker="じぶんで そだてる" title="そだてる・シンカ" />
          <div className="howto-evo-card"><div className="howto-evo-badge">1</div><div><h3>レベルで シンカ</h3><p>バトルで けいけんを ためて レベルアップ。シンカする レベルに とどいたら、その レベルアップから シンカへ すすむよ。</p></div></div>
          <div className="howto-evo-card special-item"><div className="howto-evo-badge">2</div><div><h3>💎 いしで シンカ</h3><p>ひつような いしは、たんさくで さがそう。いしを もっている なかまは「モンスター」で いしを 1こ つかうと シンカするよ。</p></div></div>
          <div className="howto-evo-card special-item"><div className="howto-evo-badge">3</div><div><h3>🎀 もちもので シンカ</h3><p>たんさくで ひつような もちものを さがす → 「モンスター」で もたせる → そのあと ほんとうに レベルアップすると シンカするよ。</p></div></div>
          <div className="howto-evo-card"><div className="howto-evo-badge">4</div><div><h3>じぶんで シンカさせると…</h3><p>じぶんで シンカさせた すがたは きろくされるよ。2だんかいめの すがたは、じぶんで シンカしたあとに おくの ゾーンで であえるように なることが あるよ。</p></div></div>
          <button className="primary howto-monster-button" onClick={goMonsters}>🐾 モンスターを みる！</button>
        </section>
      </>}

      {topic === 'special' && <section className="howto-section">
        <TopicHeader icon="🔷" kicker="つかえる なかまだけ" title="とくべつな すがた" />
        <div className="howto-reward-grid">
          <article><strong>🔷 ギガシンカ</strong><p>たいしょうは 12たい。つかえるように なった なかまは、バトルの おわりまで 4つの のうりょくが 1.35ばいに なるよ。</p></article>
          <article><strong>💥 キョダイバースト</strong><p>たいしょうは 8たい。3ターンの あいだ、HPが 2ばい・こうげきが 1.2ばいになり、つよい バーストわざを つかうよ。</p></article>
        </div>
        <p><strong>1つの バトルで、とくべつな すがたは チームぜんたいで 1かいだけ。</strong> ギガシンカか キョダイバーストの どちらかを えらぶよ。</p>
        <button className="primary howto-monster-button" onClick={goMonsters}>🐾 なかまを みる！</button>
      </section>}

      <button className="secondary howto-home-button" onClick={goHome}>🏠 ホームへ もどる</button>
    </main>
  )
}