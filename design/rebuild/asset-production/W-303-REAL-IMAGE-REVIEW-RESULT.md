# W-303 Grass — Real Image Review Result

Status: **REPRESENTATIVE REAL-IMAGE USER REVIEW PASSED / CANDIDATE INGESTION PENDING**

Work Item: `W-303`  
Attribute: `grass`  
Branch: `rebuild/w-303-grass-attribute-production`

## Base synchronization

- latest canonical base consumed: `b2f4face6ff1b332449df7c4ebbcc45b7211b186`
- W-303 sync merge commit: `81401197710b4d34db132b39a0b2b7806b92fdce`
- post-sync state: branch ahead of `rebuild/canonical-governance`, behind=0
- sync CI: PASS

## User real-image review gate

The user directly reviewed generated real images, not generation packets, and explicitly approved all three representative grass families.

| family | species | production disposition | real-image user result |
|---|---|---|---|
| F001 | m001 モコハ → m002 ワカバネ → m003 ジュランガ | REFINE | **APPROVED** |
| F028 | m082 ツルリン → m083 ジャングリ → m084 ミドリヴァイン | REGENERATE | **APPROVED after regeneration** |
| F029 | m085 サボテニョ → m086 ハナトゲ → m087 カクタリア | REGENERATE | **APPROVED** |

F028 correction history is important evidence: an earlier m084 direction read as a literal forest gate/scenery rather than a monster and was rejected. The accepted direction keeps an explicit monster body and expresses path/arch identity through the controlled vine span and negative space.

## Candidate-safe export preparation

After the user review gate, clean per-ID WebP exports were prepared from the approved real-image direction for technical candidate ingestion. These are **candidate-stage exports only**, never FORMAL approval.

Local export checks completed:

- 512×512 WebP
- full body readable
- transparent/clean background treatment
- no name / number / type label / UI / frame baked into the candidate crop
- every file strictly below 1,000,000 bytes
- RIFF/WEBP format used

| species | bytes | sha256 of prepared export |
|---|---:|---|
| m001 | 38,504 | `7155656d37ec2541fc97adfacb99c74368fe0be5ffdf90080aab86f97431b041` |
| m002 | 53,540 | `f6772e39647f1ba8e78ed9386e52d058bdacb4c255c5f2c95c1a572661d28ac4` |
| m003 | 52,434 | `d3c94c46b180e1354ddfabd5c7f6701a3ad60e23dcd7f553746b01a957b29be0` |
| m082 | 56,534 | `6de588fc3674bff146a6d8b363e22a92a4fcdb3d943dabe18c19eac4741d711a` |
| m083 | 64,168 | `e11f68157b54b4ec22e7c0faa74c6801fc5bfd30a517f924c087ff9b312caee7` |
| m084 | 60,802 | `bb9b10c4bffb93b996b271380cb93fcdbcf195bda209a4fb46af423447d51dea` |
| m085 | 36,554 | `09082fa6609b7ffd378d748cfba1392a651956c741b8a78320c3c03997169448` |
| m086 | 44,700 | `d4f423580b7a665f998d464329e2660c6a671375753eaeafb1dabff872dd6a36` |
| m087 | 55,818 | `f59cb06267582741b720ace74feca397aaf25dd79a1f7e0b5dadd3cb7f720780` |

These hashes identify the prepared local exports; they are **not repository-ingestion checksums until W-302 candidate ingestion actually writes the binaries and provenance into the branch**.

## Gate separation

- generation packet: complete for all grass families
- real image generation: **performed** for representative F001/F028/F029
- user visual approval: **passed** for all 9 representative species
- candidate-safe per-ID export preparation: **performed locally** for the 9 approved species
- candidate ingestion: **NOT YET COMPLETED**
- FORMAL promotion: **NOT PERFORMED**
- `monster-asset-manifest.json` FORMAL mutation: **NONE**
- gameplay/runtime mutation: **NONE**
- W-304 and later work items: **NOT STARTED**

## Current technical blocker

The available GitHub write connector can create UTF-8 files and Git objects, but this run does not have a reliable mounted-file-to-GitHub binary upload action for the generated WebP files. Candidate ingestion must preserve the W-302 binary/archive/provenance semantics; therefore the prepared images are not falsely claimed as ingested and existing m001-m003 repository candidates are not overwritten.

This is a **binary repository-write capability boundary at the ingestion step**, not an image-generation failure and not a user-review failure.

## Current W-303 Acceptance state

**PARTIAL.** The representative real-image user review gate has passed. The next unmet gate is repository-safe candidate ingestion of these 9 approved per-ID WebP exports, including archive/provenance preservation for existing m001-m003, followed by small-size/crop/continuity/duplicate verification. Only after that gate should the remaining grass families proceed through production.
