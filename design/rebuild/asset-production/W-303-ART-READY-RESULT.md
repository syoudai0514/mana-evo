# W-303 Grass — ART READY Result

Status: **ART READY / INGESTION BLOCKED**

Work Item: `W-303`  
Attribute: `grass`  
Branch: `rebuild/w-303-grass-attribute-production`

## Scope

Exactly 6 grass families / 16 species owned by W-303:

- F001: m001, m002, m003
- F014: m040, m041, m042
- F028: m082, m083, m084
- F029: m085, m086, m087
- F046: m134, m135, m136
- F080: m235

`m239` remains excluded.

## Production state

- Representative real-image user review: PASS for F001 / F028 / F029 (9 species).
- Remaining real-image production: completed for F014 / F046 / F080 (7 species) without an additional user gate, per instruction.
- All 16 species now have candidate-safe local WebP exports.
- Candidate ingestion into the repository: **0 / 16** because repository checkout / binary-ingestion execution capability is unavailable in this environment.
- FORMAL promotion: **0**.

## Visual QA

Checked against CURRENT + PHASE-4-STYLE-LOCK + W-303 anti-duplication matrix:

- F001 remains the horizontal defensive forest-wall family.
- F014 remains the walking-root + flower family.
- F028 remains the hanging / arcing vine-line family.
- F029 remains the succulent + radial-bloom family.
- F046 remains the vertical ancient habitat-tree family.
- F080 remains the monumental axial world-tree family.

Checks completed for all 16 local exports:

- family continuity
- stage progression where multi-stage
- within-grass anti-duplication
- small-size readability
- full-body/game-safe crop
- white/clean background and no baked text/UI in per-ID export
- WebP format
- 512x512 export
- file size below 1,000,000 bytes
- local SHA-256 recorded

## Local candidate-safe export SHA-256

| species | bytes | sha256 |
|---|---:|---|
| m001 | 38,504 | `7155656d37ec2541fc97adfacb99c74368fe0be5ffdf90080aab86f97431b041` |
| m002 | 53,540 | `f6772e39647f1ba8e78ed9386e52d058bdacb4c255c5f2c95c1a572661d28ac4` |
| m003 | 52,434 | `d3c94c46b180e1354ddfabd5c7f6701a3ad60e23dcd7f553746b01a957b29be0` |
| m040 | 16,216 | `ca43770168ac4f1b8630f34566d8010cb574fd98a3105faf51191983fd551e57` |
| m041 | 19,482 | `b953e108a9935bddcf0ee4279e53a740305b8a30739ad1963682efe372ea3fe5` |
| m042 | 34,694 | `8ae7e762c467f817c99e91c3c645fba8d05bfcc648fd9d1c141d1e25c351a6db` |
| m082 | 56,534 | `6de588fc3674bff146a6d8b363e22a92a4fcdb3d943dabe18c19eac4741d711a` |
| m083 | 64,168 | `e11f68157b54b4ec22e7c0faa74c6801fc5bfd30a517f924c087ff9b312caee7` |
| m084 | 60,802 | `bb9b10c4bffb93b996b271380cb93fcdbcf195bda209a4fb46af423447d51dea` |
| m085 | 36,554 | `09082fa6609b7ffd378d748cfba1392a651956c741b8a78320c3c03997169448` |
| m086 | 44,700 | `d4f423580b7a665f998d464329e2660c6a671375753eaeafb1dabff872dd6a36` |
| m087 | 55,818 | `f59cb06267582741b720ace74feca397aaf25dd79a1f7e0b5dadd3cb7f720780` |
| m134 | 19,320 | `cb5adcaf135a26e2bf018b0f3a59b7a0c017d770be92f38efd1b4836a0a4c1e9` |
| m135 | 22,938 | `4334c2d95043a4d26636027179dfc6b40af86704b216a91ce946b98641e9c551` |
| m136 | 41,548 | `4ae00e01f9879be90c2f62c412f5eddc1fbcec77ba6182eb8e98189827f155ed` |
| m235 | 33,298 | `a5c1defafa948bba4e46bfa1548a1ec72dfb09a165279c9c3225827fb8afb95d` |

These are **local export checksums only**. They are not repository-ingestion checksums until W-302 `candidate-ingestion.mjs` runs on an actual checkout and writes candidate files / archive / provenance.

## Ingestion blocker

`BLOCKED CAPABILITY` is limited to the repository candidate-ingestion stage. Image generation and art preparation are complete.

The missing capability is an execution environment that can:

1. checkout `rebuild/w-303-grass-attribute-production`;
2. place the 16 WebP binaries on disk;
3. execute W-302 `candidate-ingestion.mjs` for all 16 species;
4. archive existing m001-m003 candidates;
5. record old/new checksums and provenance without bypassing the script semantics.

No ingestion is simulated. Existing repository binaries/provenance remain untouched.

## Acceptance state

**W-303 is not COMPLETE.**

Current state is **ART READY / INGESTION BLOCKED**.

The only remaining W-303 gate is repository candidate ingestion + archive/provenance/repository-checksum verification for all 16 species, followed by final repository-state validation.

No FORMAL promotion. No main merge. W-304+ and W-321/W-322 not started.
