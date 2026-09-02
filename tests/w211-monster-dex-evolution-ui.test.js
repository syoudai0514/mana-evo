import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const monster = fs.readFileSync('src/game/screens/MonsterScreen.jsx', 'utf8')
const dex = fs.readFileSync('src/game/screens/DexScreen.jsx', 'utf8')
const evolution = fs.readFileSync('src/game/screens/EvolutionOverlay.jsx', 'utf8')

test('W-211 Monster is team-first and delegates canonical data and rules', () => {
  assert.ok(monster.includes('{ MonsterArt }'))
  assert.ok(monster.includes('monsterDescriptionOf'))
  assert.ok(monster.includes('チーム {team.length}/3'))
  assert.ok(monster.includes('1ばん'))
  assert.ok(monster.includes('ready && <button className="primary evolution-confirm-cta"'))
  assert.ok(monster.includes('✨ シンカする！'))
  assert.ok(monster.includes('monster.pendingEvolution'))
  assert.ok(monster.includes('aria-expanded={showEvolutionHelp}'))
  assert.equal(monster.includes('formal-moves'), false)
  assert.equal(monster.includes('対象12体'), false)
  assert.equal(monster.includes('対象8体'), false)
  assert.equal(monster.includes('専用ギガしれん'), false)
  assert.equal(monster.includes('専用バーストしれん'), false)
})

test('W-211 Dex is an active-scope species catalog with on-demand controls and detail', () => {
  assert.ok(dex.includes('ACTIVE_MONSTER_IDS'))
  assert.ok(dex.includes('/238 GET'))
  assert.ok(dex.includes('/238 はっけん'))
  assert.ok(dex.includes('showTools'))
  assert.ok(dex.includes('monsterDescriptionOf'))
  assert.ok(dex.includes('disabled={!isSeen}'))
  assert.equal(dex.includes('m239'), false)
})

test('W-211 screens use MonsterArt without guessed asset paths or Star Awakening', () => {
  for (const source of [monster, dex, evolution]) {
    assert.ok(source.includes('MonsterArt'))
    for (const guess of ['/monsters/', '.svg', '.webp']) assert.equal(source.includes(guess), false, guess)
    assert.equal(source.includes('<PlaceholderMonster'), false)
    assert.equal(source.includes('Star Awakening'), false)
    assert.equal(source.includes('スター覚醒'), false)
  }
})

test('W-211 Evolution is a focused one-action reward using actual discovery state', () => {
  assert.ok(evolution.includes('evolution-overlay'))
  assert.ok(evolution.includes('firstEvolutionDiscovery'))
  assert.ok(evolution.includes('つづける！'))
  assert.ok(evolution.includes('じぶんで シンカした きろく'))
  assert.equal(evolution.includes('こうレベルの おくち'), false)
})
