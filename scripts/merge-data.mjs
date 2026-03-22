#!/usr/bin/env node
/**
 * merge-data.mjs
 * Reads all alloy data files and generates a unified alloys-master.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = resolve(ROOT, 'src/data');

// ── Helper: read JSON ──
function readJSON(relPath) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), 'utf-8'));
}

// ── 1. Read all JSON data files ──
const aluminumRaw = readJSON('src/data/aluminum.json');
const stainlessRaw = readJSON('src/data/stainless-steel.json');
const copperRaw = readJSON('src/data/copper.json');
const titaniumRaw = readJSON('src/data/titanium.json');
const ingotRaw = readJSON('src/data/aluminum-ingot.json');
const standardsRaw = readJSON('src/data/alloy-standards.json');

// ── 2. Convert object-key format to array format ──
function convertGroups(raw) {
  const groups = [];
  for (const [groupName, alloys] of Object.entries(raw.groups)) {
    const alloyArr = [];
    for (const [alloyName, props] of Object.entries(alloys)) {
      alloyArr.push({ name: alloyName, ...props });
    }
    groups.push({ name: groupName, alloys: alloyArr });
  }
  return groups;
}

// ── 3. Hardcoded inline data ──

const hcAlloys = [
  { name: '1100-O', hb: 23, temper: 'Annealed', series: '1xxx' },
  { name: '1100-H14', hb: 32, temper: 'Strain Hardened', series: '1xxx' },
  { name: '2011-T3', hb: 95, temper: 'Solution Treated', series: '2xxx' },
  { name: '2014-T6', hb: 135, temper: 'Aged', series: '2xxx' },
  { name: '2024-T3', hb: 120, temper: 'Solution Treated', series: '2xxx' },
  { name: '2024-T4', hb: 120, temper: 'Naturally Aged', series: '2xxx' },
  { name: '3003-O', hb: 28, temper: 'Annealed', series: '3xxx' },
  { name: '3003-H14', hb: 40, temper: 'Strain Hardened', series: '3xxx' },
  { name: '5052-H32', hb: 60, temper: 'Stabilized', series: '5xxx' },
  { name: '5052-H34', hb: 68, temper: 'Stabilized', series: '5xxx' },
  { name: '5083-O', hb: 75, temper: 'Annealed', series: '5xxx' },
  { name: '5086-H32', hb: 73, temper: 'Stabilized', series: '5xxx' },
  { name: '6061-O', hb: 30, temper: 'Annealed', series: '6xxx' },
  { name: '6061-T4', hb: 65, temper: 'Naturally Aged', series: '6xxx' },
  { name: '6061-T6', hb: 95, temper: 'Aged', series: '6xxx' },
  { name: '6063-T5', hb: 60, temper: 'Artificially Aged', series: '6xxx' },
  { name: '6063-T6', hb: 73, temper: 'Aged', series: '6xxx' },
  { name: '6082-T6', hb: 95, temper: 'Aged', series: '6xxx' },
  { name: '7050-T7451', hb: 140, temper: 'Overaged', series: '7xxx' },
  { name: '7075-T6', hb: 150, temper: 'Aged', series: '7xxx' },
  { name: '7075-T73', hb: 135, temper: 'Overaged', series: '7xxx' },
];

const wcMaterials = [
  { name: 'Aluminum', density: 2.71, color: '#C0C0C0' },
  { name: 'Stainless Steel', density: 7.93, color: '#808090' },
  { name: 'Copper', density: 8.96, color: '#E07020' },
  { name: 'Brass', density: 8.55, color: '#C8A820' },
  { name: 'Zinc', density: 7.13, color: '#7088A0' },
  { name: 'Titanium', density: 4.51, color: '#989088' },
  { name: 'Nickel', density: 8.90, color: '#A8A8A0' },
  { name: 'Magnesium', density: 1.74, color: '#B8B8B0' },
];

// Weight calculator grade data for materials that DON'T have their own JSON
// (plus full data for all 8 materials for merging desc/tags)
const wcGradeData = {
  'Aluminum': [
    { category: 'Pure Aluminum (1xxx)', grades: [
      { name: '1050', desc: 'High purity aluminum for chemical and electrical applications', density: 2.71, tags: ['High Purity', 'Excellent Corrosion Resistance'] },
      { name: '1060', desc: 'High purity aluminum with excellent formability', density: 2.70, tags: ['High Conductivity', 'Good Formability'] },
      { name: '1100', desc: 'Commercially pure aluminum with excellent formability', density: 2.71, tags: ['Excellent Formability', 'Good Corrosion Resistance'] },
      { name: '1350', desc: 'Electrical conductor grade aluminum', density: 2.70, tags: ['Electrical Grade', 'High Conductivity'] },
    ]},
    { category: 'Aluminum-Copper (2xxx)', grades: [
      { name: '2011', desc: 'Free-machining alloy with good strength', density: 2.83, tags: ['Free Machining', 'Good Strength', 'Heat Treatable'] },
      { name: '2014', desc: 'High-strength structural alloy for heavy-duty applications', density: 2.80, tags: ['High Strength', 'Structural', 'Heat Treatable'] },
      { name: '2017', desc: 'Good machinability and moderate strength', density: 2.79, tags: ['Good Machinability', 'Rivet Alloy'] },
      { name: '2024', desc: 'High-strength alloy with good fatigue resistance', density: 2.78, tags: ['High Strength', 'Good Fatigue Resistance', 'Aerospace'] },
      { name: '2219', desc: 'Weldable high-strength alloy for cryogenic applications', density: 2.84, tags: ['Weldable', 'Cryogenic', 'Aerospace'] },
    ]},
    { category: 'Aluminum-Manganese (3xxx)', grades: [
      { name: '3003', desc: 'General-purpose alloy with good workability', density: 2.73, tags: ['Good Workability', 'Moderate Strength'] },
      { name: '3004', desc: 'Higher strength than 3003, used for beverage cans', density: 2.72, tags: ['Can Stock', 'Good Formability'] },
      { name: '3105', desc: 'Moderate strength with good corrosion resistance', density: 2.72, tags: ['Building Products', 'Good Finishing'] },
    ]},
    { category: 'Aluminum-Silicon (4xxx)', grades: [
      { name: '4032', desc: 'Forged piston alloy with low thermal expansion', density: 2.68, tags: ['Forging', 'Low Expansion', 'Wear Resistant'] },
      { name: '4043', desc: 'Welding filler alloy with good fluidity', density: 2.69, tags: ['Welding Filler', 'Good Fluidity'] },
      { name: '4047', desc: 'Brazing and welding filler alloy', density: 2.66, tags: ['Brazing', 'Low Melting Point'] },
    ]},
    { category: 'Aluminum-Magnesium (5xxx)', grades: [
      { name: '5005', desc: 'Low-strength alloy with good anodizing response', density: 2.70, tags: ['Anodizing', 'Decorative', 'Non-Heat Treatable'] },
      { name: '5052', desc: 'Good workability and corrosion resistance', density: 2.68, tags: ['Marine Grade', 'Good Weldability'] },
      { name: '5083', desc: 'Highest strength non-heat treatable alloy', density: 2.66, tags: ['High Strength', 'Marine Grade', 'Shipbuilding'] },
      { name: '5086', desc: 'Marine structural alloy with good weldability', density: 2.66, tags: ['Marine Grade', 'Structural', 'Weldable'] },
      { name: '5182', desc: 'Beverage can end alloy with high strength', density: 2.65, tags: ['Can End Stock', 'High Strength'] },
      { name: '5251', desc: 'Medium-strength marine alloy', density: 2.69, tags: ['Marine Grade', 'Good Formability'] },
      { name: '5754', desc: 'Automotive body panel alloy', density: 2.67, tags: ['Automotive', 'Good Formability', 'Weldable'] },
    ]},
    { category: 'Aluminum-Magnesium-Silicon (6xxx)', grades: [
      { name: '6005', desc: 'Medium-strength structural extrusion alloy', density: 2.70, tags: ['Extrusion', 'Structural', 'Heat Treatable'] },
      { name: '6060', desc: 'Lower-strength extrusion alloy with excellent surface finish', density: 2.70, tags: ['Extrusion', 'Anodizing', 'Architectural'] },
      { name: '6061', desc: 'Versatile alloy with good mechanical properties', density: 2.70, tags: ['Versatile', 'Good Weldability', 'Heat Treatable'] },
      { name: '6063', desc: 'Architectural alloy with good surface finish', density: 2.70, tags: ['Extrusion Alloy', 'Good Surface Finish'] },
      { name: '6082', desc: 'Medium-strength structural alloy', density: 2.71, tags: ['Structural', 'Good Machinability', 'Heat Treatable'] },
      { name: '6101', desc: 'High-strength electrical conductor alloy', density: 2.70, tags: ['Electrical', 'Bus Bar', 'Heat Treatable'] },
      { name: '6262', desc: 'Free-machining alloy similar to 6061', density: 2.72, tags: ['Free Machining', 'Fittings', 'Heat Treatable'] },
      { name: '6351', desc: 'High-strength extrusion alloy for structural use', density: 2.71, tags: ['Extrusion', 'High Strength', 'Structural'] },
    ]},
    { category: 'Aluminum-Zinc (7xxx)', grades: [
      { name: '7005', desc: 'Medium-strength weldable alloy', density: 2.78, tags: ['Weldable', 'Structural', 'Heat Treatable'] },
      { name: '7050', desc: 'High-strength aerospace alloy with good toughness', density: 2.83, tags: ['Aerospace', 'High Toughness', 'Thick Sections'] },
      { name: '7075', desc: 'Very high strength aerospace alloy', density: 2.81, tags: ['Aerospace Grade', 'Very High Strength'] },
      { name: '7178', desc: 'Highest strength aluminum alloy for aircraft structures', density: 2.83, tags: ['Aircraft', 'Ultra High Strength'] },
    ]},
  ],
  'Stainless Steel': [
    { category: 'Austenitic', grades: [
      { name: '301', desc: 'High work-hardening rate for structural applications', density: 7.88, tags: ['Work Hardenable', 'Spring Quality'] },
      { name: '303', desc: 'Free-machining austenitic stainless steel', density: 7.93, tags: ['Free Machining', 'Non-Magnetic'] },
      { name: '304', desc: 'Most common stainless steel grade', density: 7.93, tags: ['Corrosion Resistant', 'Non-Magnetic', 'Weldable'] },
      { name: '304L', desc: 'Low-carbon version for improved weldability', density: 7.93, tags: ['Low Carbon', 'Weldable', 'Non-Magnetic'] },
      { name: '309', desc: 'Heat-resistant grade for high-temperature use', density: 7.98, tags: ['High Temperature', 'Oxidation Resistant'] },
      { name: '310', desc: 'High-temperature oxidation-resistant grade', density: 7.98, tags: ['Furnace Parts', 'High Temperature'] },
      { name: '316', desc: 'Marine grade with molybdenum for pitting resistance', density: 7.99, tags: ['Marine Grade', 'Chemical Resistant'] },
      { name: '316L', desc: 'Low-carbon marine grade for welded structures', density: 7.99, tags: ['Low Carbon', 'Marine Grade', 'Biomedical'] },
      { name: '321', desc: 'Titanium-stabilized for high-temperature service', density: 7.92, tags: ['Ti-Stabilized', 'High Temperature', 'Weldable'] },
      { name: '347', desc: 'Niobium-stabilized for high-temperature welding', density: 7.96, tags: ['Nb-Stabilized', 'High Temperature'] },
    ]},
    { category: 'Ferritic', grades: [
      { name: '405', desc: 'Low-chromium ferritic for welded applications', density: 7.74, tags: ['Weldable', 'Magnetic'] },
      { name: '409', desc: 'Automotive exhaust grade', density: 7.74, tags: ['Automotive', 'Heat Resistant', 'Low Cost'] },
      { name: '430', desc: 'General purpose ferritic stainless steel', density: 7.74, tags: ['Magnetic', 'Good Formability', 'Decorative'] },
      { name: '446', desc: 'High-chromium heat-resistant grade', density: 7.60, tags: ['High Temperature', 'Oxidation Resistant'] },
    ]},
    { category: 'Martensitic', grades: [
      { name: '410', desc: 'General purpose hardenable stainless steel', density: 7.74, tags: ['Heat Treatable', 'Magnetic', 'Hardenable'] },
      { name: '420', desc: 'Cutlery grade with higher hardness', density: 7.74, tags: ['Cutlery', 'High Hardness', 'Wear Resistant'] },
      { name: '440C', desc: 'High-carbon for maximum hardness and wear resistance', density: 7.68, tags: ['Bearings', 'High Hardness', 'Wear Resistant'] },
    ]},
    { category: 'Duplex', grades: [
      { name: '2205', desc: 'Most common duplex grade with high strength', density: 7.82, tags: ['High Strength', 'Corrosion Resistant', 'Oil & Gas'] },
      { name: '2507', desc: 'Super duplex for severe corrosion environments', density: 7.79, tags: ['Super Duplex', 'Chemical Resistant'] },
    ]},
    { category: 'Precipitation Hardening', grades: [
      { name: '17-4 PH', desc: 'High-strength precipitation hardening grade', density: 7.78, tags: ['High Strength', 'Aerospace', 'Medical'] },
      { name: '15-5 PH', desc: 'Better toughness than 17-4 PH', density: 7.78, tags: ['Good Toughness', 'Aerospace'] },
    ]},
  ],
  'Copper': [
    { category: 'Pure Copper', grades: [
      { name: 'C101 (OFE)', desc: 'Oxygen-free electronic copper, 99.99% pure', density: 8.94, tags: ['Ultra High Purity', 'Electronic Grade'] },
      { name: 'C110 (ETP)', desc: 'Electrolytic tough pitch copper, 99.9% pure', density: 8.94, tags: ['High Conductivity', 'Excellent Ductility'] },
      { name: 'C122 (DHP)', desc: 'Phosphorus deoxidized copper for plumbing', density: 8.94, tags: ['Plumbing', 'Brazeable', 'Weldable'] },
    ]},
    { category: 'Beryllium Copper', grades: [
      { name: 'C172', desc: 'High-strength beryllium copper spring alloy', density: 8.26, tags: ['High Strength', 'Non-Sparking', 'Spring Quality'] },
      { name: 'C175', desc: 'High-conductivity beryllium copper', density: 8.59, tags: ['Good Conductivity', 'Moderate Strength'] },
    ]},
    { category: 'Bronze', grades: [
      { name: 'C220 (Commercial Bronze)', desc: '90/10 copper-zinc with golden color', density: 8.80, tags: ['Decorative', 'Good Formability'] },
      { name: 'C510 (Phosphor Bronze A)', desc: 'Excellent spring qualities and fatigue resistance', density: 8.86, tags: ['Spring Quality', 'Fatigue Resistant'] },
      { name: 'C544 (Phosphor Bronze B)', desc: 'Free-machining phosphor bronze', density: 8.89, tags: ['Free Machining', 'Bearings'] },
      { name: 'C630 (Aluminum Bronze)', desc: 'High-strength corrosion-resistant alloy', density: 7.78, tags: ['High Strength', 'Marine Grade'] },
      { name: 'C932 (Bearing Bronze)', desc: 'Leaded tin bronze for bearings and bushings', density: 8.93, tags: ['Bearings', 'Low Friction', 'Wear Resistant'] },
    ]},
  ],
  'Titanium': [
    { category: 'Commercially Pure (CP)', grades: [
      { name: 'Grade 1', desc: 'Most ductile and softest CP titanium', density: 4.51, tags: ['Most Ductile', 'Corrosion Resistant', 'Chemical Processing'] },
      { name: 'Grade 2', desc: 'Most common CP titanium, good balance of properties', density: 4.51, tags: ['General Purpose', 'Biocompatible', 'Weldable'] },
      { name: 'Grade 3', desc: 'Higher strength CP titanium', density: 4.51, tags: ['Higher Strength', 'Pressure Vessels'] },
      { name: 'Grade 4', desc: 'Highest strength CP titanium', density: 4.51, tags: ['Highest CP Strength', 'Dental Implants'] },
    ]},
    { category: 'Alpha & Near-Alpha Alloys', grades: [
      { name: 'Ti-5Al-2.5Sn (Grade 6)', desc: 'Weldable alloy for elevated temperature use', density: 4.48, tags: ['High Temperature', 'Weldable', 'Cryogenic'] },
      { name: 'Ti-8Al-1Mo-1V', desc: 'High modulus alloy for jet engine components', density: 4.37, tags: ['Jet Engine', 'High Modulus'] },
    ]},
    { category: 'Alpha-Beta Alloys', grades: [
      { name: 'Ti-6Al-4V (Grade 5)', desc: 'Most common titanium alloy, aerospace workhorse', density: 4.43, tags: ['Aerospace Grade', 'High Strength', 'Heat Treatable'] },
      { name: 'Ti-6Al-4V ELI (Grade 23)', desc: 'Extra-low interstitial version for biomedical use', density: 4.43, tags: ['Biomedical', 'Surgical Implants', 'Fracture Toughness'] },
      { name: 'Ti-6Al-2Sn-4Zr-2Mo', desc: 'High-temperature aerospace alloy', density: 4.54, tags: ['Jet Engine', 'High Temperature', 'Creep Resistant'] },
    ]},
    { category: 'Beta Alloys', grades: [
      { name: 'Ti-3Al-8V-6Cr-4Mo-4Zr (Beta C)', desc: 'High-strength cold-formable beta alloy', density: 4.82, tags: ['Cold Formable', 'High Strength', 'Springs'] },
      { name: 'Ti-15V-3Cr-3Al-3Sn', desc: 'Cold-formable sheet alloy for aerospace', density: 4.71, tags: ['Sheet Alloy', 'Cold Formable', 'Aerospace'] },
    ]},
  ],
  'Brass': [
    { category: 'Alpha Brass', grades: [
      { name: 'C210 (Gilding Metal)', desc: '95/5 copper-zinc with red-gold color', density: 8.86, tags: ['Decorative', 'Coins', 'Jewelry'] },
      { name: 'C220 (Commercial Bronze)', desc: '90/10 copper-zinc alloy', density: 8.80, tags: ['Decorative', 'Architectural'] },
      { name: 'C230 (Red Brass)', desc: '85/15 copper-zinc for plumbing fittings', density: 8.75, tags: ['Plumbing', 'Corrosion Resistant'] },
      { name: 'C260 (Cartridge Brass)', desc: '70/30 copper-zinc with excellent cold working', density: 8.53, tags: ['Good Formability', 'Cold Working', 'Ammunition'] },
      { name: 'C270 (Yellow Brass)', desc: '65/35 copper-zinc general purpose', density: 8.47, tags: ['General Purpose', 'Good Strength'] },
    ]},
    { category: 'Alpha-Beta Brass', grades: [
      { name: 'C280 (Muntz Metal)', desc: '60/40 brass for architectural and marine use', density: 8.39, tags: ['Marine', 'Architectural', 'Hot Working'] },
      { name: 'C360 (Free-Cutting Brass)', desc: 'Best machinability of all copper alloys', density: 8.49, tags: ['Free Machining', 'Screw Machine Parts'] },
      { name: 'C385 (Architectural Bronze)', desc: 'Leaded brass for architectural hardware', density: 8.47, tags: ['Architectural', 'Hardware', 'Decorative'] },
    ]},
    { category: 'Naval Brass', grades: [
      { name: 'C464 (Naval Brass)', desc: 'Tin-modified for seawater resistance', density: 8.41, tags: ['Marine Grade', 'Corrosion Resistant'] },
    ]},
  ],
  'Zinc': [
    { category: 'Pure Zinc', grades: [
      { name: 'Zn 99.99', desc: 'Special high-grade zinc', density: 7.13, tags: ['High Purity', 'Galvanizing'] },
    ]},
    { category: 'Zamak Die Casting Alloys', grades: [
      { name: 'Zamak 2 (ZA-2)', desc: 'Highest strength and hardness zamak alloy', density: 6.60, tags: ['Highest Strength', 'Die Casting', 'Bearings'] },
      { name: 'Zamak 3 (ZA-3)', desc: 'Most widely used zinc die casting alloy', density: 6.60, tags: ['Die Casting', 'Good Stability', 'Platable'] },
      { name: 'Zamak 5 (ZA-5)', desc: 'Higher strength and creep resistance than Zamak 3', density: 6.60, tags: ['Die Casting', 'Higher Strength', 'Good Creep Resistance'] },
      { name: 'Zamak 7 (ZA-7)', desc: 'Improved fluidity and surface finish', density: 6.60, tags: ['Die Casting', 'Thin Walls', 'Good Surface Finish'] },
    ]},
    { category: 'ZA Alloys', grades: [
      { name: 'ZA-8', desc: 'Zinc-aluminum alloy for hot chamber die casting', density: 6.30, tags: ['Hot Chamber', 'Good Bearing Properties'] },
      { name: 'ZA-12', desc: 'Medium aluminum content zinc alloy', density: 6.03, tags: ['Sand Casting', 'Good Strength'] },
      { name: 'ZA-27', desc: 'Highest strength zinc alloy, lightweight', density: 5.00, tags: ['Highest Strength', 'Lightweight', 'Gravity Casting'] },
    ]},
  ],
  'Nickel': [
    { category: 'Pure Nickel', grades: [
      { name: 'Nickel 200', desc: 'Commercially pure wrought nickel', density: 8.89, tags: ['High Purity', 'Corrosion Resistant', 'Magnetic'] },
      { name: 'Nickel 201', desc: 'Low-carbon version of Nickel 200', density: 8.89, tags: ['Low Carbon', 'High Temperature'] },
    ]},
    { category: 'Inconel (Ni-Cr)', grades: [
      { name: 'Inconel 600', desc: 'Nickel-chromium alloy for high-temperature oxidation', density: 8.47, tags: ['High Temperature', 'Oxidation Resistant'] },
      { name: 'Inconel 625', desc: 'Outstanding corrosion and fatigue resistance', density: 8.44, tags: ['High Temperature', 'Corrosion Resistant', 'Weldable'] },
      { name: 'Inconel 718', desc: 'Precipitation-hardened superalloy for jet engines', density: 8.19, tags: ['Superalloy', 'Jet Engine', 'High Strength'] },
      { name: 'Inconel X-750', desc: 'Age-hardenable for springs and fasteners', density: 8.28, tags: ['Springs', 'Nuclear', 'High Temperature'] },
    ]},
    { category: 'Monel (Ni-Cu)', grades: [
      { name: 'Monel 400', desc: 'Nickel-copper alloy for marine and chemical use', density: 8.80, tags: ['Marine Grade', 'Acid Resistant', 'High Strength'] },
      { name: 'Monel K-500', desc: 'Age-hardenable version with higher strength', density: 8.44, tags: ['High Strength', 'Non-Magnetic', 'Oil & Gas'] },
    ]},
    { category: 'Hastelloy (Ni-Mo)', grades: [
      { name: 'Hastelloy C-276', desc: 'Universal corrosion-resistant alloy', density: 8.89, tags: ['Chemical Resistant', 'Versatile', 'Weldable'] },
      { name: 'Hastelloy B-2', desc: 'Excellent resistance to hydrochloric acid', density: 9.22, tags: ['HCl Resistant', 'Reducing Environments'] },
      { name: 'Hastelloy X', desc: 'High-temperature oxidation-resistant alloy', density: 8.22, tags: ['Gas Turbine', 'High Temperature', 'Oxidation Resistant'] },
    ]},
  ],
  'Magnesium': [
    { category: 'Wrought Alloys', grades: [
      { name: 'AZ31B', desc: 'Most common wrought magnesium alloy', density: 1.77, tags: ['Lightweight', 'Good Strength', 'Weldable'] },
      { name: 'AZ61A', desc: 'Higher strength wrought alloy', density: 1.80, tags: ['Higher Strength', 'Extrusion'] },
      { name: 'AZ80A', desc: 'High-strength forging alloy', density: 1.80, tags: ['Forging', 'High Strength'] },
      { name: 'ZK60A', desc: 'Highest strength wrought magnesium alloy', density: 1.83, tags: ['Highest Strength', 'Forging', 'Extrusion'] },
      { name: 'M1A', desc: 'Low-alloy extrusion with moderate strength', density: 1.76, tags: ['Extrusion', 'Low Alloy', 'Moderate Strength'] },
    ]},
    { category: 'Cast Alloys', grades: [
      { name: 'AZ91D', desc: 'Most common magnesium die casting alloy', density: 1.81, tags: ['Die Casting', 'Good Castability', 'Corrosion Resistant'] },
      { name: 'AM60B', desc: 'Automotive die casting alloy with good ductility', density: 1.79, tags: ['Automotive', 'Good Ductility', 'Die Casting'] },
      { name: 'AM50A', desc: 'Higher ductility automotive casting alloy', density: 1.77, tags: ['Automotive', 'High Ductility', 'Energy Absorbing'] },
      { name: 'AE44', desc: 'Creep-resistant alloy with rare earth elements', density: 1.82, tags: ['Creep Resistant', 'Powertrain', 'High Temperature'] },
      { name: 'EZ33A', desc: 'Sand casting alloy for elevated temperature use', density: 1.83, tags: ['Sand Casting', 'High Temperature', 'Aerospace'] },
    ]},
  ],
};

const conversionTable = [
  [15, null, null, 15, 15, null],
  [20, null, null, 20, 20, null],
  [25, 22, null, 26, 26, 20],
  [30, 30, null, 31, 31, 22],
  [35, 36, null, 37, 37, 25],
  [40, 42, null, 42, 42, 28],
  [45, 47, null, 47, 47, 30],
  [50, 52, null, 53, 53, 32],
  [55, 56, null, 58, 58, 34],
  [60, 60, null, 63, 63, 36],
  [65, 63, null, 68, 68, 38],
  [70, 66, null, 74, 74, 39],
  [75, 69, null, 79, 79, 41],
  [80, 72, null, 84, 84, 42],
  [85, 74, null, 89, 90, 44],
  [90, 76, null, 95, 96, 45],
  [95, 78, null, 100, 101, 47],
  [100, 80, null, 105, 107, 48],
  [105, 82, null, 110, 112, 49],
  [110, 83, null, 116, 118, 50],
  [115, 84, null, 121, 123, 51],
  [120, 86, null, 127, 129, 52],
  [130, 88, null, 138, 140, 54],
  [140, 90, null, 149, 152, 56],
  [150, 92, null, 160, 163, 58],
  [160, 93, null, 171, 175, 59],
  [170, 94, null, 183, 187, 61],
  [180, 95, null, 194, 198, 62],
  [190, 96, null, 206, 210, 63],
  [200, 97, null, 218, 222, 64],
  [210, 98, 20, 230, 235, 65],
  [220, 99, 21, 243, 248, 66],
  [230, 100, 22, 256, 261, 67],
  [240, null, 23, 269, 275, 68],
  [250, null, 24, 282, 288, 69],
  [260, null, 25, 296, 302, 70],
  [275, null, 27, 316, 323, 72],
  [290, null, 29, 336, 343, 73],
  [310, null, 31, 363, 370, 75],
  [330, null, 34, 390, 398, 77],
  [350, null, 36, 420, 428, 78],
  [375, null, 39, 455, 464, 80],
  [400, null, 41, 492, 502, 81],
  [425, null, 43, 530, 540, 82],
  [450, null, 46, 570, 581, 83],
  [480, null, 48, 615, 627, 84],
  [500, null, 50, 649, 662, 85],
  [530, null, 52, 697, 710, null],
  [560, null, 54, 746, 760, null],
  [600, null, 57, 810, 826, null],
  [630, null, 60, 862, 879, null],
  [650, null, 62, 900, 920, null],
];

const hardnessScales = [
  { id: 'hb', name: 'Brinell', abbr: 'HB', min: 15, max: 650, unit: 'kgf/mm\u00B2', color: '#F5A623' },
  { id: 'hrb', name: 'Rockwell B', abbr: 'HRB', min: 20, max: 100, unit: 'Scale', color: '#4A90D9' },
  { id: 'hrc', name: 'Rockwell C', abbr: 'HRC', min: 20, max: 68, unit: 'Scale', color: '#D94A4A' },
  { id: 'hv', name: 'Vickers', abbr: 'HV', min: 15, max: 940, unit: 'kgf/mm\u00B2', color: '#50B86C' },
  { id: 'hk', name: 'Knoop', abbr: 'HK', min: 15, max: 920, unit: 'kgf/mm\u00B2', color: '#9B59B6' },
  { id: 'shore', name: 'Shore D', abbr: 'Shore D', min: 20, max: 85, unit: 'Scale', color: '#E67E22' },
];

// ── Build material map (materialKey -> wcMaterial name) ──
const materialKeyToWc = {
  aluminum: 'Aluminum',
  stainless: 'Stainless Steel',
  copper: 'Copper',
  titanium: 'Titanium',
};

// ── Build the standards lookup: { materialKey: { alloyName: {...standards} } } ──
function buildStandardsMap() {
  const map = {};
  for (const [matKey, matData] of Object.entries(standardsRaw)) {
    map[matKey] = {};
    for (const alloy of matData.alloys) {
      const std = {};
      if (alloy.aa) std.aa = alloy.aa;
      if (alloy.astm) std.astm = alloy.astm;
      if (alloy.en) std.en = alloy.en;
      if (alloy.jis) std.jis = alloy.jis;
      if (alloy.gb) std.gb = alloy.gb;
      if (alloy.iso) std.iso = alloy.iso;
      map[matKey][alloy.name] = { standards: std, category: alloy.category };
    }
  }
  return map;
}

// ── Build temper lookup from hardness converter data ──
function buildTemperMap() {
  // returns { baseAlloy: [ { name: temperName, hb, type } ] }
  const map = {};
  for (const entry of hcAlloys) {
    const dashIdx = entry.name.indexOf('-');
    if (dashIdx === -1) continue;
    const baseAlloy = entry.name.substring(0, dashIdx);
    const temperName = entry.name.substring(dashIdx + 1);
    if (!map[baseAlloy]) map[baseAlloy] = [];
    map[baseAlloy].push({ name: temperName, hb: entry.hb, type: entry.temper });
  }
  return map;
}

// ── Build weight-calc grade lookup for a material ──
function buildWcGradeLookup(wcMatName) {
  const categories = wcGradeData[wcMatName];
  if (!categories) return {};
  const lookup = {};
  for (const cat of categories) {
    for (const grade of cat.grades) {
      lookup[grade.name] = grade;
    }
  }
  return lookup;
}

// ── Merge standards and tempers into groups ──
function mergeIntoGroups(groups, matKey) {
  const stdMap = standardsMap[matKey] || {};
  const wcName = materialKeyToWc[matKey];
  const wcLookup = wcName ? buildWcGradeLookup(wcName) : {};

  for (const group of groups) {
    for (const alloy of group.alloys) {
      // Merge standards
      const stdEntry = stdMap[alloy.name];
      if (stdEntry) {
        alloy.standards = stdEntry.standards;
        if (!group.standardsCategory && stdEntry.category) {
          group.standardsCategory = stdEntry.category;
        }
      }

      // Merge tempers (aluminum only)
      if (matKey === 'aluminum') {
        const tempers = temperMap[alloy.name];
        if (tempers) {
          alloy.tempers = tempers;
        }
      }

      // Merge weight-calc desc/tags
      const wcGrade = wcLookup[alloy.name];
      if (wcGrade) {
        if (!alloy.desc) alloy.desc = wcGrade.desc;
        if (!alloy.tags) alloy.tags = wcGrade.tags;
      }
    }
  }
  return groups;
}

// ── Add weight-calc-only grades to existing material groups ──
function addMissingWcGrades(groups, wcMatName) {
  const categories = wcGradeData[wcMatName];
  if (!categories) return groups;

  // Build set of existing alloy names
  const existingNames = new Set();
  for (const group of groups) {
    for (const alloy of group.alloys) {
      existingNames.add(alloy.name);
    }
  }

  for (const cat of categories) {
    for (const grade of cat.grades) {
      if (!existingNames.has(grade.name)) {
        // Find a matching group or create one
        let targetGroup = null;
        for (const g of groups) {
          // Try matching by category name similarity
          if (g.name.toLowerCase().includes(cat.category.toLowerCase().split(' ')[0]) ||
              cat.category.toLowerCase().includes(g.name.toLowerCase().split(' ')[0])) {
            targetGroup = g;
            break;
          }
        }
        if (!targetGroup) {
          // Try matching by category keyword in group name
          for (const g of groups) {
            const catWords = cat.category.toLowerCase().split(/[\s()-]+/);
            const groupWords = g.name.toLowerCase().split(/[\s()-]+/);
            if (catWords.some(w => w.length > 2 && groupWords.some(gw => gw.includes(w)))) {
              targetGroup = g;
              break;
            }
          }
        }
        if (!targetGroup) {
          // Create a new group for this category
          targetGroup = { name: cat.category, alloys: [] };
          groups.push(targetGroup);
        }
        targetGroup.alloys.push({
          name: grade.name,
          density: grade.density,
          desc: grade.desc,
          tags: grade.tags,
        });
        existingNames.add(grade.name);
      }
    }
  }
  return groups;
}

// ── Create material entries for weight-calc-only materials ──
function createWcOnlyMaterial(wcMatName) {
  const wcMat = wcMaterials.find(m => m.name === wcMatName);
  const categories = wcGradeData[wcMatName];
  if (!wcMat || !categories) return null;

  const groups = categories.map(cat => ({
    name: cat.category,
    alloys: cat.grades.map(g => ({
      name: g.name,
      density: g.density,
      desc: g.desc,
      tags: g.tags,
    })),
  }));

  return {
    label: wcMatName,
    defaultDensity: wcMat.density,
    color: wcMat.color,
    groups,
  };
}

// ── Main build ──
const standardsMap = buildStandardsMap();
const temperMap = buildTemperMap();

// Build aluminum
const aluminumGroups = convertGroups(aluminumRaw);
mergeIntoGroups(aluminumGroups, 'aluminum');
addMissingWcGrades(aluminumGroups, 'Aluminum');
const alWcMat = wcMaterials.find(m => m.name === 'Aluminum');

// Build stainless
const stainlessGroups = convertGroups(stainlessRaw);
mergeIntoGroups(stainlessGroups, 'stainless');
addMissingWcGrades(stainlessGroups, 'Stainless Steel');
const ssWcMat = wcMaterials.find(m => m.name === 'Stainless Steel');

// Build copper
const copperGroups = convertGroups(copperRaw);
mergeIntoGroups(copperGroups, 'copper');
addMissingWcGrades(copperGroups, 'Copper');
const cuWcMat = wcMaterials.find(m => m.name === 'Copper');

// Build titanium
const titaniumGroups = convertGroups(titaniumRaw);
mergeIntoGroups(titaniumGroups, 'titanium');
addMissingWcGrades(titaniumGroups, 'Titanium');
const tiWcMat = wcMaterials.find(m => m.name === 'Titanium');

// Build ingot
const ingotGroups = convertGroups(ingotRaw);

// Build weight-calc-only materials
const brassMat = createWcOnlyMaterial('Brass');
const zincMat = createWcOnlyMaterial('Zinc');
const nickelMat = createWcOnlyMaterial('Nickel');
const magnesiumMat = createWcOnlyMaterial('Magnesium');

// ── Assemble output ──
const output = {
  materials: {
    aluminum: {
      label: aluminumRaw.label,
      defaultDensity: alWcMat.density,
      color: alWcMat.color,
      groups: aluminumGroups,
    },
    stainless: {
      label: stainlessRaw.label,
      defaultDensity: ssWcMat.density,
      color: ssWcMat.color,
      groups: stainlessGroups,
    },
    copper: {
      label: copperRaw.label,
      defaultDensity: cuWcMat.density,
      color: cuWcMat.color,
      groups: copperGroups,
    },
    titanium: {
      label: titaniumRaw.label,
      defaultDensity: tiWcMat.density,
      color: tiWcMat.color,
      groups: titaniumGroups,
    },
    ingot: {
      label: ingotRaw.label,
      defaultDensity: 2.74,
      color: '#C0C0C0',
      groups: ingotGroups,
    },
    brass: brassMat,
    zinc: zincMat,
    nickel: nickelMat,
    magnesium: magnesiumMat,
  },
  hardnessScales,
  hardnessConversion: conversionTable,
};

// ── Write output ──
const outPath = resolve(DATA, 'alloys-master.json');
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

// ── Summary ──
const materialKeys = Object.keys(output.materials);
let totalAlloys = 0;
for (const key of materialKeys) {
  const mat = output.materials[key];
  let count = 0;
  for (const g of mat.groups) count += g.alloys.length;
  totalAlloys += count;
  console.log(`  ${key}: ${mat.groups.length} groups, ${count} alloys`);
}
console.log(`\nTotal: ${materialKeys.length} materials, ${totalAlloys} alloys`);
console.log(`Hardness scales: ${output.hardnessScales.length}`);
console.log(`Conversion table rows: ${output.hardnessConversion.length}`);
console.log(`\nWritten to: ${outPath}`);
