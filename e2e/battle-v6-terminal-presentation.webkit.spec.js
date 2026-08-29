import { test, expect } from '@playwright/test'
import { addTickets, createGameState } from '../src/game/progression.js'
import { STAGES } from '../src/game/content.js'
import { isStageUnlocked, makeMonster, startBattle } from '../src/game/engine.js'
import { dayNumber } from '../src/kids-quest-study/engine/srs.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'

function learningSave() {
  return {
    version: 4,
    contentVersion: 16,
    grade: 0,
    gradeMax: 0,
    settings: { tts: false, sfx: false, mode: 'normal' },
    pendingGameRewards: [],
    daily: {
      date: todayKey(),
      coreDone: true,
      coreIndex: 5,
      tasksClearedToday: 5,
      correctToday: 0,
      attemptsToday: 0,
      perDomainToday: {},
      ticketsEarnedToday: 0
    }
  }
}

function terminalDotGame({ withBench = false, captureReady = false } = {}) {
  const today = dayNumber()
  let game = addTickets(createGameState(), 3, today)
  if (withBench) {
    const active = game.box[game.team[0]]
    const bench = makeMonster(active.speciesId, active.level, 'webkit-presentation-bench')
    game.box[bench.instanceId] = bench
    game.team = [game.team[0], bench.instanceId]
  }
  const stage = STAGES.find((entry) => entry.kind === 'wild' && !entry.captureDisabled && isStageUnlocked(game, entry))
  if (!stage) throw new Error('No unlocked wild stage')
  const started = startBattle(game, stage.id, {
    dailyCompleted: true,
    dailyDay: today,
    today
  })
  if (!started.ok) throw new Error(`Could not start battle: ${started.reason}`)
  const battle = started.game.activeBattle
  battle.enemy.hp = 1
  battle.enemy.status = { type: 'poison' }
  // Failed-capture path consumes one ball. Keep a second one so the post-KO CTA
  // is still eligible after the presentation gate finishes.
  if (captureReady) started.game.captureItems.star = Math.max(2, Number(started.game.captureItems.star) || 0)
  return started.game
}

async function installSave(page, game) {
  const learning = learningSave()
  await page.addInitScript(({ learning, game }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({
      formatVersion: 2,
      gameByProfile: { 'child-1': game }
    }))
  }, { learning, game })
}

// Use the same deterministic failure gate as capture-ring.webkit.spec.js.
// A plain Math.random override is not enough because the public capture wrapper
// deliberately treats null as "no caller-supplied roll" and Number(null) would
// otherwise turn that into a guaranteed-success roll before Math.random is used.
async function installCaptureFailureRandomGate(page) {
  await page.addInitScript(() => {
    const originalRandom = Math.random.bind(Math)
    const OriginalNumber = Number
    Math.random = () => {
      if (document.documentElement?.dataset.w216CaptureRoll === 'fail') {
        document.documentElement.dataset.w216ForcedCaptureRoll = 'used'
        return 0.999999
      }
      return originalRandom()
    }
    globalThis.Number = new Proxy(OriginalNumber, {
      apply(target, thisArg, args) {
        if (document.documentElement?.dataset.w216CaptureRoll === 'fail' && args[0] === null) {
          document.documentElement.dataset.w216NullRollGuard = 'used'
          return NaN
        }
        return Reflect.apply(target, thisArg, args)
      },
      construct(target, args, newTarget) {
        return Reflect.construct(target, args, newTarget)
      }
    })
  })
}

async function expectTerminalPresentationGate(page, expectedCue) {
  const cue = page.locator('.battle-turn-cue-v6')
  await expect(cue).toBeVisible()
  await expect(cue).toContainText(expectedCue)
  await expect(page.getByRole('button', { name: /ボールを なげる！/ })).toHaveCount(0)
  await expect(cue).toBeHidden({ timeout: 7_000 })
  await expect(page.getByRole('button', { name: /ボールを なげる！/ })).toBeVisible()
  await expect(page.getByText(/^HP 0\//).first()).toBeVisible()
}

async function failedCaptureDiagnostic(page) {
  const battleRoot = page.locator('.battle-screen-v2')
  return {
    presentationId: await battleRoot.getAttribute('data-presentation-id'),
    observedId: await battleRoot.getAttribute('data-observed-id'),
    captureSequence: await battleRoot.getAttribute('data-capture-sequence'),
    turnCue: await battleRoot.getAttribute('data-turn-cue'),
    battleStatus: await battleRoot.getAttribute('data-battle-status'),
    captureNodeCount: await page.getByTestId('capture-sequence').count(),
    cueCount: await page.locator('.battle-turn-cue-v6').count()
  }
}

test('Protect DOT KO keeps post-KO CTA gated until turn/HP/KO presentation completes', async ({ page }) => {
  await installSave(page, terminalDotGame())
  await page.goto('/')

  await page.getByRole('button', { name: /まもる/ }).click()
  await expectTerminalPresentationGate(page, 'まもっている')
})

test('voluntary switch DOT KO keeps post-KO CTA gated until switched-turn presentation completes', async ({ page }) => {
  await installSave(page, terminalDotGame({ withBench: true }))
  await page.goto('/')

  await page.getByRole('button', { name: /こうたい/ }).click()
  const switchTarget = page.locator('.team-switch button:not([disabled])').first()
  await expect(switchTarget).toBeVisible()
  await switchTarget.click()
  await expectTerminalPresentationGate(page, 'こうたい')
})

test('failed capture DOT KO waits for capture sequence, then turn/HP/KO presentation, then CTA', async ({ page }) => {
  await installSave(page, terminalDotGame({ captureReady: true }))
  await installCaptureFailureRandomGate(page)
  await page.goto('/')

  await page.getByRole('button', { name: /ボールを なげる/ }).click()
  const star = page.locator('.capture-item-grid').getByRole('button', { name: /ほしボール/ })
  await expect(star).toBeEnabled()
  await star.click()
  const throwButton = page.getByRole('button', { name: /ほしボールを なげる！/ })
  await expect(throwButton).toBeEnabled()

  const root = page.locator('html')
  await root.evaluate((element) => { element.dataset.w216CaptureRoll = 'fail' })
  await throwButton.click()

  const captureSequence = page.getByTestId('capture-sequence')
  const cue = page.locator('.battle-turn-cue-v6')
  const postKoCapture = page.getByRole('button', { name: /ボールを なげる！/ })

  await expect(captureSequence).toBeVisible()
  await expect(root).toHaveAttribute('data-w216-forced-capture-roll', 'used')
  await root.evaluate((element) => { delete element.dataset.w216CaptureRoll })
  await expect(postKoCapture).toHaveCount(0)
  const diagnosticAtCaptureStart = await failedCaptureDiagnostic(page)

  try {
    // Observe the next transient phase directly. Waiting for the capture node to
    // disappear first can miss the short first cue under loaded WebKit CI.
    await expect(cue).toBeVisible({ timeout: 12_000 })
  } catch (error) {
    const diagnosticAtCueTimeout = await failedCaptureDiagnostic(page)
    throw new Error(
      `failed-capture presentation diagnostic\n` +
      `capture-start=${JSON.stringify(diagnosticAtCaptureStart)}\n` +
      `cue-timeout=${JSON.stringify(diagnosticAtCueTimeout)}\n` +
      `original=${error instanceof Error ? error.message : String(error)}`
    )
  }

  await expect(captureSequence).toBeHidden()
  await expect(postKoCapture).toHaveCount(0)

  await expect(cue).toBeHidden({ timeout: 7_000 })
  await expect(postKoCapture).toBeVisible()
  await expect(page.getByText(/^HP 0\//).first()).toBeVisible()
})
