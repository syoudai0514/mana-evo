# ManaEvo CURRENT — 進化・進化アイテム・特殊形態

更新日: 2026-08-25  
Work Item: **W-104**  
状態: **CURRENT CANONICAL (Phase 2 candidate / commander review pending)**  
対象スコープ: **No.001〜238 / 83系列**。No.239 `シラユキヒメ` はbaseline/referenceのみに保全し、active gameへ入れない。

## 0. この文書の権威と境界

この文書は、W-104 の担当領域だけを CURRENT として正本化する。判断順序は `REBUILD-START-HERE.md` / D-001 に従い、**ユーザー明示決定 > exact FINAL-CORRECTED > 承認済み後続変更 > current canonical > data master > runtime > review history** とする。runtimeが実装済みであることだけを理由に仕様を昇格しない。

主な根拠:

- `design/rebuild/DECISION-LOG.md`: D-003 / D-008 / D-011
- `design/rebuild/USER-DECISION-EVIDENCE.md`: UDE-001 / UDE-005
- exact baseline:
  - `design/baseline/FINAL-CORRECTED/source/01-catch-and-evolution-design.md`
  - `design/baseline/FINAL-CORRECTED/source/03-screens-catch-and-raise.md`
  - `design/baseline/FINAL-CORRECTED/source/06-battle-and-progression-design.md`
  - `design/baseline/FINAL-CORRECTED/source/08-gameplay-state-spec.md`
  - `design/baseline/FINAL-CORRECTED/source/scripts/families.mjs`
  - `design/baseline/FINAL-CORRECTED/source/scripts/forms.mjs`
  - `design/baseline/FINAL-CORRECTED/source/scripts/items.mjs`
  - `design/baseline/FINAL-CORRECTED/source/scripts/rewards.mjs`
- Phase 1.5: `design/rebuild/audit/battle-capture-evolution-audit.md`
- active 238 data master:
  - `design/13-monster-growth-master-238.md`
  - `design/14a-evolution-balance-area1.csv`
  - `design/14b-evolution-balance-area2.csv`
  - `design/14c-evolution-balance-area3.csv`
  - `design/14d-evolution-balance-area4.csv`
- special-form current master evidence: `design/09-special-forms-master.md`
- approved self-evolution direction: `design/20-world-map-evolution-progression.md`

他Work Itemとの責務境界:

- W-101: 学習から `explorePoint` を何点付与するか。
- **W-104: 5pt消費、探索結果、進化アイテム在庫、通常進化、特殊形態。**
- W-102/W-105: boss/challengeの入口・進行・勝利イベント。W-104はそのイベントからアイテム/特殊形態権利を受け取る。
- W-105: `evolutionDiscoveries` を使ったworld側の第2形態wild解禁。
- W-107: save migrationの具体実装。

---

## 1. CURRENTの結論

1. active進化は **155遷移**。
   - `level`: **123**
   - `stone`: **21**
   - `held_item_levelup`: **11**
2. 遷移のstable keyは `speciesId`。表示名文字列を進化判定keyにしない。
3. `level` と `held_item_levelup` は、**実際のLvUPが起きた時点で条件を満たせば、その場で進化演出へ接続**する。学習XPでもバトルXPでも同じ。
4. `stone` は自動進化しない。所持中の石をプレイヤーが「つかう」操作をした時に1個消費して進化する。
5. D-008により、進化アイテムのCURRENT取得ルートは **探索ポイント方式へREVERT-TO-BASELINE**。
6. currentの「32専用進化trial初回クリアで必要アイテム保証」は、**進化アイテム取得の正本ではない**。別目的で残すなら別途承認が必要。
7. D-011により、第2形態の初回入手は自力進化を守り、成功した進化を `evolutionDiscoveries` に記録する。
8. ギガシンカ対象は12体、キョダイバースト対象は8体、重複0。対象判定はstable speciesIdで行う。
9. No.142 は `m142 / ヘラクレオン` がCURRENT正式名。baselineの旧名 `カブトレクス` はactive表示に使わない。
10. 1バトルで使える特殊形態は **パーティ全体で合計1回**。
11. **スター覚醒はCURRENTに存在しない。復活させない。**

---

## 2. 通常進化の3方式

### 2.1 `level`

データ契約:

```text
evolution = {
  toSpeciesId,
  method: "level",
  level: N
}
```

挙動:

1. 学習またはバトル等でXPを得る。
2. XP反映で実LvUPが起きる。
3. 新Lvが遷移表の `level` 以上なら、その場で進化条件成立。
4. **同じ結果フロー内で進化演出を開始**する。「次のバトルまで待つ」「BOXで手動確定する」へ変更しない。
5. 個体identity、Lv、XPを維持し、speciesを進化先へ切り替える。

`design/20-world-map-evolution-progression.md` にあるworld Lv帯由来のruntime `effectiveLevel/originalLevel` 補正は、D-011で固定された「自力進化方向」とは別のチューニング詳細である。**W-104ではactive masterの155遷移と下記level値を正本化し、runtime由来の閾値書換えを正本へ昇格しない。** 閾値を将来チューニングする場合は、masterを明示更新する別判断とする。

### 2.2 `stone`

データ契約:

```text
evolution = {
  toSpeciesId,
  method: "stone",
  itemId
}
```

挙動:

- 対象stoneを1個以上所持していても自動進化しない。
- 育成/進化画面で対象stoneを「つかう」。
- 進化開始時に **1個消費**する。
- 即時に進化演出へ接続する。
- 「石を持たせて次のLvUP」はstoneではなくheld-item方式であり、混同しない。

stone 8種: `fire / water / thunder / leaf / moon / ice / dusk / ancient`。

### 2.3 `held_item_levelup`

データ契約:

```text
evolution = {
  toSpeciesId,
  method: "held_item_levelup",
  itemId
}
```

挙動:

- 必要な専用もちものを個体へ装備する。
- **装備しただけでは進化しない。**
- その状態で「次の実LvUP」が起きた時に条件成立。
- exact baselineでは、条件成立したLvUPのその場で進化演出へ接続する。current runtime/masterの `evolutionReady` という中間状態を、手動確定を必須にする新仕様として扱わない。
- XPが増えてもLvUPしなかった場合は発火しない。

held item 10種: `emberwick / steelplate / sunscale / barkarmor / frostgem / nightfeather / skyplume / windband / dragonfang / corepart`。

> **BLOCKED DECISION W104-BD01 — held itemの進化後消費/保持**  
> exact baselineは「持たせてLvUP」を明確にするが、進化後にそのもちものを消費するか保持するかを明示固定していない。current runtimeは保持するが、runtime単独では正本に昇格できない。実装時はこの1点を勝手に決めず、commanderで解消する。

---

## 3. active 155進化遷移

以下は `design/14a`〜`14d` のactive 238 masterから回収した **155件そのもの**。No.001〜238についてbaseline `families.mjs` との進化条件照合不一致0が既存検証で確認されている。

`param`:
- `level`: 必要Lv
- `stone`: stone id
- `held_item_levelup`: held item id

```csv
area,fromSpeciesId,toSpeciesId,method,param
1,m001,m002,level,17
1,m002,m003,level,33
1,m004,m005,level,17
1,m005,m006,level,33
1,m007,m008,level,17
1,m008,m009,level,33
1,m010,m011,level,19
1,m011,m012,level,38
1,m013,m014,level,19
1,m014,m015,level,38
1,m016,m017,level,19
1,m017,m018,level,38
1,m019,m020,level,19
1,m020,m021,level,38
1,m022,m023,level,19
1,m023,m024,level,38
1,m025,m026,level,19
1,m026,m027,stone,thunder
1,m028,m029,level,19
1,m029,m030,level,38
1,m031,m032,level,19
1,m032,m033,level,38
1,m034,m035,level,19
1,m035,m036,level,38
1,m037,m038,level,19
1,m038,m039,stone,water
1,m040,m041,level,19
1,m041,m042,stone,leaf
1,m043,m044,level,19
1,m044,m045,level,38
1,m046,m047,level,19
1,m047,m048,level,38
1,m049,m050,level,21
1,m050,m051,stone,moon
1,m052,m053,level,21
1,m053,m054,level,41
2,m055,m056,level,23
2,m056,m057,stone,fire
2,m058,m059,held_item_levelup,emberwick
2,m059,m060,level,40
2,m061,m062,level,23
2,m062,m063,held_item_levelup,sunscale
2,m064,m065,stone,ancient
2,m065,m066,level,40
2,m067,m068,level,23
2,m068,m069,held_item_levelup,steelplate
2,m070,m071,level,25
2,m071,m072,level,43
2,m073,m074,level,23
2,m074,m075,level,40
2,m076,m077,level,23
2,m077,m078,level,40
2,m079,m080,level,23
2,m080,m081,stone,leaf
2,m082,m083,level,23
2,m083,m084,level,40
2,m085,m086,level,23
2,m086,m087,level,40
2,m088,m089,level,23
2,m089,m090,level,40
2,m091,m092,level,23
2,m092,m093,held_item_levelup,windband
2,m094,m095,level,23
2,m095,m096,level,40
2,m097,m098,level,25
2,m098,m099,level,43
2,m100,m101,level,23
2,m101,m102,level,40
2,m103,m104,level,23
2,m104,m105,level,40
2,m106,m107,level,23
2,m107,m108,level,40
2,m109,m110,level,23
2,m110,m111,level,40
2,m112,m113,level,23
2,m113,m114,stone,dusk
2,m115,m116,level,34
2,m117,m118,level,31
3,m119,m120,level,30
3,m120,m121,stone,ice
3,m122,m123,stone,ice
3,m123,m124,held_item_levelup,frostgem
3,m125,m126,level,30
3,m126,m127,stone,ice
3,m128,m129,level,30
3,m129,m130,level,45
3,m131,m132,level,32
3,m132,m133,stone,water
3,m134,m135,level,30
3,m135,m136,stone,leaf
3,m137,m138,level,30
3,m138,m139,level,45
3,m140,m141,level,30
3,m141,m142,held_item_levelup,barkarmor
3,m143,m144,stone,moon
3,m145,m146,level,30
3,m146,m147,stone,dusk
3,m148,m149,level,30
3,m149,m150,held_item_levelup,nightfeather
3,m151,m152,level,32
3,m152,m153,level,48
3,m154,m155,level,30
3,m155,m156,held_item_levelup,steelplate
3,m157,m158,level,30
3,m158,m159,stone,ancient
3,m160,m161,level,30
3,m161,m162,level,45
3,m163,m164,level,30
3,m164,m165,level,45
3,m166,m167,level,30
3,m167,m168,level,45
3,m169,m170,level,30
3,m170,m171,level,45
3,m172,m173,level,30
3,m173,m174,held_item_levelup,skyplume
3,m175,m176,level,32
3,m176,m177,level,48
3,m178,m179,level,30
3,m179,m180,level,45
3,m181,m182,level,32
3,m182,m183,level,48
4,m184,m185,level,42
4,m185,m186,held_item_levelup,dragonfang
4,m187,m188,level,42
4,m188,m189,stone,ancient
4,m190,m191,level,46
4,m191,m192,stone,moon
4,m193,m194,level,42
4,m194,m195,level,55
4,m196,m197,level,42
4,m197,m198,held_item_levelup,corepart
4,m199,m200,level,42
4,m200,m201,level,55
4,m202,m203,level,42
4,m203,m204,level,55
4,m205,m206,level,42
4,m206,m207,stone,dusk
4,m208,m209,level,42
4,m209,m210,stone,moon
4,m211,m212,level,42
4,m212,m213,level,55
4,m214,m215,level,42
4,m215,m216,level,55
4,m217,m218,stone,thunder
4,m218,m219,level,55
4,m220,m221,level,42
4,m221,m222,level,55
4,m223,m224,level,42
4,m224,m225,level,55
4,m226,m227,level,42
4,m227,m228,level,55
4,m229,m230,level,42
4,m230,m231,level,55
4,m232,m233,level,42
4,m233,m234,level,55
```

機械検証期待値:

```text
total = 155
level = 123
stone = 21
held_item_levelup = 11
area1 = 36
area2 = 42
area3 = 43
area4 = 34
```

No.235〜238はこのactive master上で進化遷移を持たない。No.239はactive scope外。

---

## 4. 自力進化 → world discovery interface（W-105連携）

D-011のCURRENT契約:

```text
successful self evolution
  -> speciesId を進化先へ更新
  -> dexの取得状態を更新
  -> evolutionDiscoveries[toSpeciesId] = true
  -> W-105 が第2形態wild解禁判定に利用
```

規則:

- `evolutionDiscoveries` は **「そのspeciesを自分で進化させた」事実**を `dex.seen/caught` と分離して持つ。
- `evolveInstance()` 相当の成功トランザクションで、進化後speciesIdを記録する。
- 野生捕獲・単なる図鑑発見・敵として見たことを理由に `evolutionDiscoveries` を立てない。
- W-105は非最終の第2形態について、この記録がある場合だけ後半/奥地wildを解禁する。
- 最終形は通常wild捕獲不可というD-011を維持するため、この記録を最終形wild解禁には使わない。
- save migrationのgrandfather条件はW-107が正本化する。runtimeの既存migrationをそのまま権威化しない。

進化成功とdiscovery記録は同一の永続化単位として扱い、「進化したのにworld解禁記録だけ消えた」という分離状態を作らない。

---

## 5. 進化アイテム取得 — D-008 CURRENT

### 5.1 探索ポイント

W-104側の消費契約:

```text
explorePoint >= 5
  -> 5pt消費
  -> 解放済みの地域を1つ選んで探索1回
```

- **1回5pt**
- **1日上限なし**
- 学習からのpoint付与量はW-101を参照し、W-104で二重定義しない。
- 未解放地域の探索/アイテムテーブルへアクセスしない。

### 5.2 通常探索の結果

1回の探索は必ず結果を持つ。

- 通常素材: **80%**
- 進化アイテム: **20%**
- 進化アイテム当選時は、その地域の進化アイテム表から抽選する。
- 重複進化アイテムはinventoryへstackする。

### 5.3 地域別pity

論理state:

```text
explorationPityMissesByArea[areaId] = 0..5
```

挙動:

1. 通常素材だったら、その地域のmissを +1。
2. 通常抽選で進化アイテムを得たら、その地域のmissを0。
3. missが5の地域で次の探索を開始する時、**6回目の開始時にその地域の進化アイテムを1個選べる**。
4. 保証を使ったら、その地域のmissを0。
5. 他地域の探索では当該地域のカウンタを動かさない。
6. save/loadをまたいで保持する。
7. 「欲しいアイテムの事前登録」状態は持たない。

> 保証時に通常素材も追加で得るかどうかはexact baseline/D-008では進行上の必須仕様として固定されていない。**保証で選んだ進化アイテム1個を確実に得られること**だけをAcceptanceにする。

### 5.4 地域アイテム表

`unlockArea` は、そのitemを使うactive系列のうち最小area。exact baseline `items.mjs` / `06-battle-and-progression-design.md` の表をCURRENTへ採用する。

| unlockArea | item id | 表示名 | 種別 |
|---:|---|---|---|
| 1 | `thunder` | かみなりのいし | stone |
| 1 | `water` | みずのいし | stone |
| 1 | `leaf` | リーフのいし | stone |
| 1 | `moon` | つきのいし | stone |
| 2 | `fire` | ほのおのいし | stone |
| 2 | `emberwick` | きえないシン | held item |
| 2 | `sunscale` | たいようのウロコ | held item |
| 2 | `ancient` | いにしえのいし | stone |
| 2 | `steelplate` | はがねのいた | held item |
| 2 | `windband` | かぜのハチマキ | held item |
| 2 | `dusk` | よいやみのいし | stone |
| 3 | `ice` | こおりのいし | stone |
| 3 | `frostgem` | こおりのハート | held item |
| 3 | `barkarmor` | きのよろい | held item |
| 3 | `nightfeather` | よるのハネ | held item |
| 3 | `skyplume` | そらのカザリ | held item |
| 4 | `dragonfang` | りゅうのキバ | held item |
| 4 | `corepart` | コアパーツ | held item |

重要:

- `ancient` はArea2から入手可能。Area4まで待たせない。
- 「そのモンスターを進化させたら初めて必要アイテムがもらえる」という循環矛盾を作らない。
- 進化に必要なitemは、必要系列のsource area到達時点までに正規取得ルートが開いている。

### 5.5 boss初回撃破ボーナス

D-008により **地域boss初回撃破で、その地域の進化アイテム1個を付与する**。通常探索pityとは別のボーナスであり、pity missを増やす理由にはしない。

> **BLOCKED DECISION W104-BD02 — boss bonusの選定方式**  
> exact baseline/D-008は「地域アイテム1個」を固定するが、固定品・ランダム・プレイヤー選択のどれかまでは一意に固定していない。実装はこの選定方式を勝手に創作しない。W-108 Acceptanceは「eligible area itemが1個付与される」までを必須とする。

### 5.6 旧32専用進化trialの扱い

`design/14e-evolution-item-acquisition-master.csv` の `transition-trial-first-clear` は、PR #15系currentで作られた **32 item-evolution遷移の専用trial置換案**である。

D-008により:

- **進化アイテムのCURRENT source of truthではない。**
- 32trialをクリアしないと必要itemを得られない、というgateを作らない。
- `unlockMilestone=evo-a*` をitem acquisitionの必須条件にしない。
- trialコンテンツ自体を別目的で残すなら、別Work Item/別承認で役割を定義する。
- runtimeに実装済みでも、それはCURRENTとの差分として修正対象であり、正本化理由にならない。

---

## 6. ギガシンカ CURRENT

### 6.1 対象12体

| No. | speciesId | 通常名 | タイプ |
|---:|---|---|---|
| 003 | `m003` | ジュランガ | くさ |
| 006 | `m006` | グレンドウ | ほのお |
| 009 | `m009` | ワダツラ | みず |
| 051 | `m051` | マシュランテ | フェアリー |
| 054 | `m054` | メンタリオン | エスパー |
| 072 | `m072` | ライテイガ | でんき |
| 090 | `m090` | センガンジ | かくとう |
| 121 | `m121` | ヒョウガルド | こおり |
| 153 | `m153` | キュウビガミ | あく |
| 156 | `m156` | ガードヴァルツ | はがね |
| 159 | `m159` | イワガミラ | いわ |
| 186 | `m186` | ニジリュウガ | ドラゴン |

対象はstable IDで保持する。12体すべて最終形、でんせつ級対象外、Burstとの重複0。

### 6.2 必要権利

- `gigaKey`: 全体で1つの永久権利、非消費。
- `gigaCore[speciesId]`: 対象種族ごとの永久権利、非消費。
- baselineは「対象種族を最終形まで育て、boss勝利でcore取得」を固定している。
- currentの専用challenge/boss routingは、W-102/W-105のstage/progression IDへ参照で接続する。**runtime stage IDをこの文書から新規創作しない。**

> **BLOCKED DECISION W104-BD03 — GigaKeyの正確な付与イベント**  
> baselineは「物語序盤で1個」、currentにはArea1 boss等へ具体化した実装履歴があるが、D-003〜D-014でその具体イベントの置換までは固定されていない。永久・非消費・1個という権利仕様はCURRENT。付与stageの確定はcommander/W-105で解消する。

### 6.3 バトル効果

- 1バトルにつき、パーティ全体の特殊形態使用権は合計1回。
- 発動すると **HPを含む全4ステータス ×1.35**。
- バトル終了まで継続。
- HPは割合維持で変換し、解除時も割合維持。
- バトル終了後は通常姿へ戻る。
- 特殊形態は別species/別Dex番号として増やさない。

baseline/currentの核となる倍率は一致 (`SAME`)。

---

## 7. キョダイバースト CURRENT

### 7.1 対象8体

| No. | speciesId | 現行正式名 | タイプ |
|---:|---|---|---|
| 060 | `m060` | アカリガルド | ほのお |
| 066 | `m066` | ゲンコツヅラ | いわ |
| 133 | `m133` | カイテイリオ | みず |
| 136 | `m136` | センジュガ | くさ |
| 142 | `m142` | **ヘラクレオン** | むし |
| 165 | `m165` | テラガイア | じめん |
| 171 | `m171` | フドウザン | かくとう |
| 174 | `m174` | テンショウガ | ひこう |

No.142:

```text
speciesId = m142
CURRENT name = ヘラクレオン
baseline old display name = カブトレクス
burst eligible = true
```

対象判定は `m142` を使うため、名前変更でeligibilityを失わせない。

### 7.2 必要権利

- `burstMark[speciesId]`: 対象種族ごとの永久権利、非消費。
- 対象種族を最終形まで育て、対応する特殊形態解放の勝利条件を満たして取得する。
- Giga coreと同様、具体stage routingはW-102/W-105へ参照で接続する。

### 7.3 バトル効果

- パーティ全体の特殊形態使用権を1回消費する。Giga使用後にBurst、Burst使用後にGigaは同じバトルでは不可。
- 持続 **3ターン**。
- 最大HP **×2.0**。
- こうげき **×1.2**。
- 主力技をBurst技へ置換: **威力110 / 命中95% / 反動なし**。
- 発動/解除ともHP割合維持。0HPは0のままで最低1HP保証をしない。
- 3ターン後は通常姿へ戻る。

baseline/currentの核となる数値は一致 (`SAME`)。

---

## 8. 特殊形態の図鑑記録

evidenceに基づくCURRENT契約:

- ギガ/Burstは通常speciesと同じDex番号を使う。
- 初回の特殊形態発動後、そのspeciesのDex内で特殊姿を見られるよう記録する。
- 論理的には `specialDex.giga[speciesId]` / `specialDex.burst[speciesId]` のように通常捕獲状態と分離する。
- 未解放時は特殊姿を取得済み扱いにしない。
- eligibilityとDex解放は別state。対象種族だからといって、未発動の特殊姿を自動取得済みにしない。
- No.142のDex表示名は常に `ヘラクレオン` を使い、旧名で新しいDex slotを作らない。

---

## 9. 1バトル1特殊形態の排他

バトル開始時の論理state例:

```text
specialUsed = false
```

発動条件:

```text
specialUsed == false
AND active species is eligible
AND required permanent entitlement is owned
```

GigaまたはBurstを1回発動したら:

```text
specialUsed = true
```

以後、そのバトルでは他個体を含めて追加のGiga/Burstを発動できない。これは「各モンスター1回」ではなく、**パーティ全体で合計1回**。

---

## 10. Star Awakening

**Star Awakening / スター覚醒はCURRENTから除外する。**

- 通常進化方式ではない。
- 特殊形態の第3系統として追加しない。
- eligibility、専用item、Dex別姿、battle buttonを新設しない。
- 過去資料/legacy実装に語が残っていても、W-104の正本根拠にしない。

---

## 11. CURRENTとruntime/design-historyの主要差分

| 項目 | CURRENT | runtime / later historyで見えるもの | 扱い |
|---|---|---|---|
| item取得 | 5pt探索、80/20、地域pity、6回目選択 | 32専用evolution trial初回保証 | **D-008でCURRENTへ戻さない** |
| held-item発火 | 装備中の実LvUPでその場進化 | `evolutionReady` 中間状態 | 手動確定必須化は非canonical |
| self-evolution記録 | `evolutionDiscoveries` | current runtimeにも存在 | D-011として採用 |
| Giga/Burst対象/倍率 | 12 / 8、×1.35、HP×2/ATK×1.2 | currentと一致 | SAME |
| No.142 | `m142 / ヘラクレオン` | active 238 masterと一致 | CURRENT |
| Star Awakening | 不採用 | 歴史資料に語が残る場合あり | 復活禁止 |

---

## 12. 実装Acceptance（W-108へ渡す契約）

### 通常進化

- active transition件数 = 155。
- method counts = 123 / 21 / 11。
- 155件すべて `fromSpeciesId` / `toSpeciesId` がactive No.001〜238内。
- No.239を遷移へ混入させない。
- level進化は学習XP/バトルXPのどちらのLvUPでも同じ条件で発火。
- stoneは手動使用・1個消費。
- held-itemは装備 + 実LvUPが必要。装備だけでは発火しない。
- 進化成功時にstable instance/Lv/XPを維持する。
- 進化成功と `evolutionDiscoveries[toSpeciesId]` 記録を原子的に成立させる。

### item探索

- 5pt未満で探索不可、5pt以上で1回につき5pt消費。
- 通常抽選が80% material / 20% evolution item。
- pityは地域別・永続。
- 5連続miss後、6回目開始時にeligible itemを1個選べる。
- 通常item取得/保証choiceで当該地域missを0へ。
- 他地域探索でカウンタを汚さない。
- boss初回撃破でeligible region itemを1個付与。
- 32専用trialがitem取得の必須gateになっていない。

### Giga/Burst

- Giga IDs exactly 12、Burst IDs exactly 8、overlap 0。
- 対象は全て最終形、legend対象外。
- No.142 = `m142 / ヘラクレオン / burstEligible=true`。
- Giga = all stats ×1.35、battle endまで。
- Burst = HP×2 / ATK×1.2 / 3turn / move110 / accuracy95 / no recoil。
- HP割合維持、0HPは0。
- 1battleでGiga/Burst合計1回。
- entitlementは永久・非消費。
- special Dexは同じspecies slot内で解放し、Dex番号を増やさない。
- Star Awakeningなし。

---

## 13. BLOCKED DECISIONS

W-104の根幹は確定しており、以下の局所詳細だけを勝手に創作しない。

1. **W104-BD01:** held itemを進化後に保持するか消費するか。
2. **W104-BD02:** boss初回撃破の「地域アイテム1個」を固定/ランダム/選択のどれで決めるか。
3. **W104-BD03:** GigaKeyの具体的な付与stage/event。権利の「1個・永久・非消費」は確定。

これらは進化155件、探索5pt/80-20/pity、対象12+8、特殊形態効果、No.142、Star Awakening除外をブロックしない。Phase 2 commanderが横断reviewで解消できる形に留める。

---

## 14. D-030 later authority — player-confirmed normal evolution

**D-030 is later authority.** It supersedes only the older timing/ownership statements in §1 item 3, §2.1, §2.3, §11, §12 normal-evolution clauses, and W104-BD01. The 155-transition master, stone behavior, exploration/item acquisition, Giga/Burst, No.142, and Star Awakening exclusion remain unchanged.

### 14.1 Qualification creates persistent readiness, not an immediate species mutation

For `level` and `held_item_levelup`:

1. XP/reward settlement commits the real LvUP first.
2. If the transition condition is satisfied by that actual semantic event, the instance keeps its current species and receives a structured `pendingEvolution` token.
3. The result flow may immediately offer `✨ シンカする！` and secondary `あとで`.
4. `あとで` dismisses presentation only; the token remains persistent.
5. Species changes only when the child explicitly confirms evolution.

Stone remains manual and does **not** use this readiness token; one required stone is consumed exactly once when the child uses it successfully.

### 14.2 Authoritative pending token

```text
pendingEvolution = {
  qualificationId,
  fromSpeciesId,
  toSpeciesId,
  method,                 // level | held_item_levelup
  qualifiedAtLevel,
  itemId?,                // evidence for held-item qualification
  sourceOperationId
}
```

`qualificationId` must be deterministic from the causal semantic operation/reward ID + `instanceId` + `fromSpeciesId -> toSpeciesId`; never derive it from wall-clock time or randomness.

`confirmEvolution(game, instanceId, qualificationId)` validates CURRENT game state, commits the species mutation at most once, preserves instanceId/Lv/XP/history, writes `evolutionDiscoveries[toSpeciesId]` exactly once, and clears the matching token atomically. Replaying stale/duplicate confirmation is an idempotent no-op/error path, not a second evolution/reward.

### 14.3 Save / migration / cloud contract

Implementation must bump the game schema/version and make the normalizer explicitly validate and round-trip `pendingEvolution` rather than dropping unknown fields.

Migration rules:

- legacy held-item `evolutionReady=true` with the matching required held item on the appropriate source species → create deterministic migration-only pending token;
- legacy level-method source species already at/above its threshold → create deterministic migration-only pending token;
- already-evolved species remain evolved; migration never devolves them;
- stone transitions are not grandfathered into pending tokens merely because the stone is owned;
- local save, cloud snapshot/hash, backup/restore and A→B→A profile switching preserve the token without cross-profile leakage.

### 14.4 Held-item qualification is earned and item is retained

For `held_item_levelup`, the required item must be equipped **at the actual qualifying LvUP**. Once that event creates the pending token, later swapping/removing the held item does **not** revoke the earned qualification. `itemId` in the token is historical evidence of the qualifying condition.

On confirmed held-item evolution, the held item is **retained / not consumed**. This formally resolves and supersedes W104-BD01. Stone remains the consumed evolution-item class.

### 14.5 Delayed multi-stage evolution / max-level recovery

Never silently auto-chain species mutations.

After confirming one evolution:

- re-evaluate the newly reached species;
- if its next transition is `level` and the monster's existing level already meets the threshold, generate a **new separate pending token** and require another explicit `シンカする！`;
- no second species mutation occurs until that second confirmation;
- if the next transition is ordinary `held_item_levelup`, another qualifying actual LvUP with the required item is normally required;
- **max-level recovery only:** when the implementation's current compatibility max level prevents any further LvUP and the new species' next transition is `held_item_levelup`, explicitly equipping the required item may create a separate recovery pending token. This exception does not create a general equip-only held-item evolution below max level.

### 14.6 Updated normal-evolution Acceptance

Later runtime/tests must verify:

- qualifying level/held-item LvUP creates token without immediate species change;
- `あとで` survives local save/reload/cloud/backup/profile switching;
- deterministic qualification IDs and migration idempotency;
- confirm mutates species/discovery exactly once;
- held-item token remains valid after item swap and item is retained after evolution;
- stone remains manual and consumes one stone once;
- delayed next-level threshold creates a new pending token, not an automatic chain;
- max-level held-item recovery is limited to the explicit no-further-LvUP case;
- active Evolution acknowledgement continues to block child profile switching under D-023, while dormant readiness alone does not block routine profile switching.

Historical immediate-evolution text above remains as provenance but is **superseded by D-030**.