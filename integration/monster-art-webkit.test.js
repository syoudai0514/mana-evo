import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { inspectWebPWithWebKit } from '../scripts/monster-art/formal-replacement.mjs'

const FIXTURES = {
  pass: 'UklGRpoDAABXRUJQVlA4TI4DAAAv/8F/EA8wtEM2ZPMf8JAcSZIbSRhbgmeLAFEgGiAaRIEI/VwCQx2/royqHnLEIvoPCZLcuM3AOQXiBfgEFv/hP4d2mi0kq/1gF/ILvp0/wl2s9gsrDPZLQ3j7NRPzE/5Rf0fBonBBNvutPSHeqLM1mJi9hVHL0cKs/hv+c29jlJ9GD59tLPqkBVO3tlLEUdGg1mzKK/CF2k4RXoEvmMEXVg8XadGBpffmYZIWHVh65jJd1qKZu/sYRZ6w4+Fj1njCjquXi8QTdqxeisQTdjy9LPRJM03VoJWz+xkFJ+GDh59ZcBI+aAJTVB1aebuC0X0SPvimYHLHgkOdChZvLDjUquHijAWHqhqKMxYc6tAwO2PBoUxkvlhwqE3FkyPtVIyutIMT703F5Eo7OPFOFUtcTGaetIUTd9Px5EhbOHGrjuJIWzhxDx0zjyNt4cQ1obWnLZy4m5KnmOxKxua0hxP/TckUk0PJ3Jz2cOKb1HhaywYunE3LE09j2cCFU7UUnsaygQvn0DLzNJYdXHgmNp62soMLb1PzFI9dzRiPqqbwNJUtXLiHmjkep5olHia3cKx6LtHY9DxFY9czRqPqKdF40zP1hkPPHI1TzxINA6wzrASXWGwET31hJxj7QiUofeGNYOoLB8HcF06CpS8YYleFleHSEzaGp1uCnWG8JlSGckvwxjDdkhwM8z3JybA8kjDI/v2Ef970+IF/3Xj/wb9vdPtx+71vev3fd7/9Prfp/+d2V/9z1/5/bt7/voX+9430v2+n/31T/e9by9/31/2+yfx9p/n7bvvft5y/7zt/33v+vv/8cw/p5z7yz73kn/vh55byz13lnzvLP3fHzw2mn3vk5zbzz53yc7P55375ueX8c9f83Hj6uXd+bp/XDcive8DrNvC6Efl1LwLodtCJz+uW5Ndd4XVjeN0aXjeH1+3hdYNw3aL8uku8bhSvW8XrZvG6XbxuGK9bhuum8bptvG4cr1vH6+bxun0BdAMHOBSvm8jrNvK6kbxuJa+bGUC3c4BD8bqlvG4qr9vK68YG0K0d4IO8bi+vG8zrFvO6yQF0mwf4IK9bzetmZ9Dt3txVAzvyuum8bnsO3fjVmfWwI6/bn2VvwObKWvgCv7eB3xvB763A92Zk2tuxO4oODcrvTQmwt2WA/+T31vB7c/C9PTH2BqHOAfYmDfAPfm8UvreK35uF7+3C94b939AG',
  opaque: 'UklGRi4AAABXRUJQVlA4TCIAAAAv/8F/AAdQqOIVtP8BgUCyv/cMRfQ/4z//+c9//vOf//wf',
  edge: 'UklGRjoAAABXRUJQVlA4TC0AAAAv/8F/EA8wtIM33PMf8DDTts3GH/QA7I8j+j8Bw//98x4u//Ef//FfEOP/gA8A',
}

function fixture(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mana-evo-webkit-fixture-'))
  const filePath = path.join(dir, `${name}.webp`)
  fs.writeFileSync(filePath, Buffer.from(FIXTURES[name], 'base64'))
  return filePath
}

test('real WebKit decodes transparent 512 WebP and reports safe margin', async () => {
  const result = await inspectWebPWithWebKit(fixture('pass'))
  assert.equal(result.width, 512)
  assert.equal(result.height, 512)
  assert.equal(result.actualAlpha, true)
  assert.ok(result.visiblePixels > 0)
  assert.ok(result.minMarginPx >= 4)
  assert.equal(result.bboxTouchesEdges, 0)
})

test('real WebKit detects fully opaque WebP', async () => {
  const result = await inspectWebPWithWebKit(fixture('opaque'))
  assert.equal(result.width, 512)
  assert.equal(result.height, 512)
  assert.equal(result.actualAlpha, false)
})

test('real WebKit detects visible edge contact', async () => {
  const result = await inspectWebPWithWebKit(fixture('edge'))
  assert.equal(result.actualAlpha, true)
  assert.ok(result.bboxTouchesEdges > 0)
  assert.equal(result.minMarginPx, 0)
})
