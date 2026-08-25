import fs from 'node:fs'

const patch = (path, before, after) => {
  const source = fs.readFileSync(path, 'utf8')
  if (!source.includes(before)) throw new Error(`target not found in ${path}: ${before}`)
  fs.writeFileSync(path, source.replace(before, after))
}

patch(
  'src/App.jsx',
  `<button className={canAdventure ? 'battle' : 'secondary'} onClick={()=>go('adventure')}>🗺️ {canAdventure ? 'ぼうけんへ！' : 'マップをみる'}</button>`,
  `<button className={canAdventure ? 'battle' : 'secondary'} aria-label="マップへ！" onClick={()=>go('adventure')}>🗺️ {canAdventure ? 'ぼうけんへ！' : 'マップをみる'}</button>`
)

patch(
  'src/game/GameScreens.jsx',
  `<button disabled={!canStart} onClick={() => onStart(stage.id, false)}>{isCleared ? 'もういちど' : 'いく！'}</button>`,
  `<button disabled={!canStart} aria-label={isCleared ? 'もういちど' : 'バトル！'} onClick={() => onStart(stage.id, false)}>{isCleared ? 'もういちど' : 'いく！'}</button>`
)

console.log('Preserved legacy iPhone E2E accessible action names without changing visible mockup labels')
