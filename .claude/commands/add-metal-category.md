# Add New Metal Category

When the user wants to add an entirely new metal category (e.g., "Nickel Alloys", "Magnesium Alloys", "Tool Steel"), follow these steps:

## Step 1: Create the Data File

Create a new JSON file at `src/data/{category-name}.json` following this structure:

```json
{
  "label": "Display Name",
  "groups": {
    "Group Name": {
      "Alloy Name": {
        "tensileStrength": "min-max",
        "yieldStrength": "min-max",
        "elongation": number,
        "hardness": number,
        "density": number,
        "meltingRange": "min-max",
        "thermalConductivity": number,
        "corrosionResistance": "Excellent/Good/Fair/Poor",
        "weldability": "Excellent/Good/Fair/Poor",
        "applications": "comma-separated uses",
        "equivalentStandards": "standard references",
        "composition": { "Element": "value", ... }
      }
    }
  }
}
```

## Step 2: Research Common Alloys

Use **WebSearch** to find the 5-10 most commonly used alloys in this category. For each, gather all required properties and composition data.

## Step 3: Update `src/data/elements.json`

1. Add any new elements needed to the elements lookup
2. Add a new entry in the `categoryDefaults` section for the new category

## Step 4: Update `alloycompare.astro`

1. Add `import newData from '../data/{category-name}.json';` at the top of the script
2. Add the category to the `alloyData` object: `newcategory: newData`
3. Add a new metal tab button in the HTML (with appropriate SVG icon and element symbol)
4. If more than 4 tabs, update the grid CSS from `repeat(4, 1fr)` to accommodate more tabs

## Step 5: Update sitemap.xml

No changes needed (same page URL).

## Step 6: Verify

1. Run `npm run build` to verify no errors
2. Preview the page to confirm the new tab and alloys work correctly

User's request: $ARGUMENTS
