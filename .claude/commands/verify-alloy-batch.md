# Verify Alloy Batch

Batch-verify alloys against authoritative sources (MakeItFrom.com primary).

## Usage
```
/verify-alloy-batch aluminum 1-15
/verify-alloy-batch stainless all
/verify-alloy-batch --status
```

## Process

For each alloy in the batch:

1. **Read** current data from `src/data/alloys-master.json`
2. **Construct MakeItFrom URL**: `https://www.makeitfrom.com/material-properties/{slug}`
   - If 404, WebSearch: `site:makeitfrom.com "{alloy name}"`
3. **WebFetch** and extract: density, tensile, yield, elongation, hardness, thermal conductivity, melting range
4. **Compare** each field within tolerances
5. **Score** and update `src/data/alloys-verification.json`
6. **Fix** `src/data/alloys-master.json` if needed

## Tolerances
| Property | Tolerance |
|----------|-----------|
| density | ±0.02 g/cm³ |
| tensileStrength | ±10% |
| yieldStrength | ±10% |
| elongation | ±3 pp |
| hardness | ±10 HB |
| thermalConductivity | ±10 W/m·K |
| meltingRange | ±5°C |

## Scoring
- 0.95: Two sources agree
- 0.90: One source confirmed
- 0.80: AI-generated, not yet checked
- 0.50: Outside tolerance, flagged
- 0.30: Sources conflict

## Output
```
✅ 6061 [aluminum] — 0.93 (verified)
⚠️ 5083 [aluminum] — 0.88 (1 correction: hardness 96→85)
```

User's request: $ARGUMENTS
