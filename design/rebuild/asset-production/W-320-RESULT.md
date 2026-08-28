# W-320 Dragon — Candidate Ingestion Result

Status: **CANDIDATE INGESTION COMPLETE / FORMAL 0**

- Work Item: `W-320`
- Attribute: `dragon`
- Branch: `rebuild/w-320-dragon-attribute-production`
- Source ZIP: `W-320-art-ready(1).zip`
- ZIP bytes: `342849`
- ZIP SHA-256: `aa42374cfb7e6356fcc2d218c5d11fd0d5f92b2563fdc5921ca920c746d4a443`

## Exact scope

- F063: m184, m185, m186
- F064: m187, m188, m189
- F065: m190, m191, m192

The ZIP manifest, its actual contents, and the CURRENT W-320 queue agree exactly: 3 families / 9 species. There are no missing, duplicate, or extra IDs; `m239` is excluded.

## Binary handoff and candidate ingestion

- ZIP WebP validation: **9 / 9 PASS** — exact filenames, RIFF/WEBP signature, 512×512 dimensions, fewer than 1,000,000 bytes, raw byte counts, and SHA-256 values.
- GitHub object handoff: **9 / 9 PASS** — each Git blob SHA matched local `git hash-object` for the unchanged raw WebP.
- Fresh GitHub checkout/refetch: **9 / 9 PASS** — staging bytes and SHA-256 were revalidated before ingestion.
- Candidate ingestion: **9 / 9 PASS** via `scripts/monster-art/candidate-ingestion.mjs`.
- Candidate provenance: **9 / 9 PASS**.
- Existing-candidate archive/replacement: **N/A** — all nine source manifest states were `PLACEHOLDER`; no previous candidate file existed.
- Public candidates: **9 / 9 PASS** under `public/monsters/`.
- FORMAL promotion: **0**.

The ART READY input was preserved byte-for-byte. This ingestion work neither regenerated nor modified image content; it records repository and provenance validation only.

## Raw WebP checksums

| species | bytes | SHA-256 |
|---|---:|---|
| m184 | 21,498 | `ccbb3a69ac950cb7e79b08da60990c62b71094a6d1ed543f7779b6b732d56a95` |
| m185 | 28,258 | `b3810570d90da6d70ca1b65a9951583eae3d711207441ad56a5b7e1af26214f3` |
| m186 | 40,230 | `0207273ee81a29ae4c6da1d03430aa99783c6ba27cc0bb95fb4c64b1d91eb209` |
| m187 | 27,970 | `f339b4dc1260351b71764fd6362b10c7bd9ca8abcfdd5609dd4bc178eb8cf6b9` |
| m188 | 35,970 | `415e4033798566426e26f96c236c3857f01667f2aa676bf143f39f941fc94168` |
| m189 | 51,046 | `8850a8b0395eb1977098c8d4327917c9e00df5443d34013bf371be5072559a29` |
| m190 | 36,296 | `7fd1246fc4cfdaa05126f55cd3403bd76590bac9893455b83c970b6cb535e176` |
| m191 | 45,278 | `b67c2eaf1423445a1f239c3e55485035dac6bfa0fc2bdb4a7305dcae5d86ed85` |
| m192 | 55,312 | `0ba9a5883ef4bcd2d6fab41e7fa692883847d73d572c385ad4ea8cb8bd281881` |

## Stop boundary

No FORMAL promotion, main merge, production deployment, W-321, or W-322 was performed.
