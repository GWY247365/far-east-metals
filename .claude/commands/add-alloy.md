# Add Alloy to Database

When the user provides an alloy name (e.g., "Inconel 718", "6262 aluminum", "C95400 Bronze"), follow these steps to add it to the alloy comparison database:

## Step 1: Identify the Metal Category

Determine which JSON file the alloy belongs to:
- **Aluminum alloys** (1xxx-8xxx series) → `src/data/aluminum.json`
- **Stainless steel** (3xx, 4xx, 2xxx duplex series) → `src/data/stainless-steel.json`
- **Copper alloys** (Cxxxxx, brass, bronze) → `src/data/copper.json`
- **Titanium alloys** (Grade x, Ti-xxxx) → `src/data/titanium.json`

If the alloy doesn't fit any category, ask the user if they want to create a new category.

## Step 2: Research the Alloy Data

Use **WebSearch** to find the alloy's official specifications. Search for:
- `"{alloy name}" chemical composition ASTM` or the relevant standard
- `"{alloy name}" mechanical properties datasheet`

Gather ALL of the following properties (use ranges where applicable):

### Required Properties:
| Property | Format | Example |
|---|---|---|
| tensileStrength | "min-max" MPa | "515-690" |
| yieldStrength | "min-max" MPa | "205-310" |
| elongation | number (%) | 40 |
| hardness | number (HB) | 201 |
| density | number (g/cm³) | 8.00 |
| meltingRange | "min-max" °C | "1400-1450" |
| thermalConductivity | number (W/m·K) | 16.2 |
| corrosionResistance | "Excellent"/"Good"/"Fair"/"Poor" | "Good" |
| weldability | "Excellent"/"Good"/"Fair"/"Poor" | "Excellent" |
| applications | comma-separated string | "Kitchen sinks, food processing" |
| equivalentStandards | string with EN/JIS/DIN | "1.4301 (EN), SUS304 (JIS)" |

### Required Composition:
Chemical composition as an object with element symbols as keys:
```json
{
  "C": "0.08",
  "Mn": "2.0",
  "Cr": "18.0-20.0",
  "Fe": "bal"
}
```
- Use "bal" for the balance element
- Use "—" for elements that are not specified
- Use ranges like "18.0-20.0" where applicable
- Use "0.08" for max values
- Use "0.08 min" for minimum values

## Step 3: Determine the Group

Each category has groups (e.g., Aluminum has "1xxx - Pure Aluminum", "2xxx - Copper Alloy", etc.). Place the alloy in the correct existing group, or create a new group if needed.

## Step 4: Update the JSON File

1. Read the target JSON file
2. Add the new alloy entry to the correct group
3. Write the updated JSON file
4. Ensure the JSON is valid and properly formatted

## Step 5: Update Elements Database

If the new alloy contains elements not yet in `src/data/elements.json`, add them with their atomic number and name.

## Step 6: Verify

1. Run `npm run build` to verify no errors
2. Report the added alloy with a summary of its key properties

## Example Entry Format:

```json
"6262": {
  "tensileStrength": "240-400",
  "yieldStrength": "150-370",
  "elongation": 10,
  "hardness": 95,
  "density": 2.72,
  "meltingRange": "582-652",
  "thermalConductivity": 172,
  "corrosionResistance": "Good",
  "weldability": "Fair",
  "applications": "Screw machine products, fittings, nuts, bolts",
  "equivalentStandards": "EN AW-6262, A6262 (JIS)",
  "composition": {
    "Si": "0.40-0.8",
    "Fe": "0.7",
    "Cu": "0.15-0.40",
    "Mn": "0.15",
    "Mg": "0.8-1.2",
    "Cr": "0.04-0.14",
    "Zn": "0.25",
    "Ti": "0.15",
    "Bi": "0.40-0.7",
    "Pb": "0.40-0.7",
    "Al": "bal"
  }
}
```

## Batch Mode

If the user provides multiple alloys at once, process them all and report a summary table of what was added.

User's request: $ARGUMENTS
