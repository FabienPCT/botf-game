// src/data/stages/meta.js
// Stage structure only: titles, days, durations, deliverables, pitfalls, input flags
// No cost/content/table data here

export const STAGE_META = [
  {
    id:1, day:1, title:"Platform Set-up & Surface Location", duration:"1h",
    description:"Analyse surface positioning for 17 wellbores. Apply correct CRS, account for surface uncertainties, and populate the database with platform structures and slot positions.",
    pitfalls:[
      "Slots mirrored (A4↔A11) in Option A — verify slot name vs well name",
      "CRS changes between options: GDM2000 (A) → Kertau 1968 (B) → WGS84 (C)",
      "Platform AA coords exist in TWO CRS — do NOT mix GDM2000 and WGS84",
      "1σ vs 2σ confusion — all uncertainties are at 2σ",
      "Absolute uncertainty stays 10m in Options A & B — only Option C gives 1m abs",
    ],
    deliverables:[
      "Platform structures A (12 slots) & AA (7 slots) in TDesk",
      "Correct CRS both platforms",
      "Uncertainties at 2σ",
      "Quantify wrong-CRS consequences",
    ],
  },
  {
    id:2, day:1, title:"Top-Hole & EOU Starting Point", duration:"45min",
    description:"Investigate vertical positioning of 17 wellbores. Determine correct EOU starting depth from as-built schematics, CP guide data and ROV information.",
    pitfalls:[
      "CPs tilted on AA Platform – only visible via Option B",
      "A01/A03/A05–A12 high inclination by design (up to 12°)",
      "LAT vs MSL conversion needed for EOU depth",
    ],
    deliverables:[
      "Adequate EOU starting depth per well",
      "Correct last guide indication (vertical or inclined)",
      "Challenged inclination at seabed where required",
    ],
  },
  {
    id:3, day:1, title:"Geomagnetic Reference", duration:"30min",
    description:"Select the appropriate geomagnetic reference. Understand how resolution impacts lateral uncertainty and MSA applicability.",
    pitfalls:[
      "MSA only applicable with IFR (Option A)",
      "0.1° declination error in B/C creates additional RW displacement",
    ],
    deliverables:[
      "Geomagnetic reference entered in TDesk",
      "Quantify impact on lateral uncertainty",
    ],
  },
  {
    id:4, day:2, title:"Trajectory Gross Error QC", duration:"1h15",
    description:"Audit the survey database. Identify gross errors in legacy wellbore data including duplicate surveys, excessive DLS, interpolated stations and typos.",
    pitfalls:[
      "A03 top-hole = A05 + typo at 1471m (inc 77.1°)",
      "A04 interpolated 6m stations",
      "A08 sidetrack only – main borehole missing",
      "A12 top-hole from A06",
      "Priority: Deep1, A04, A03, A06, A08, A12, AA16 first",
    ],
    deliverables:[
      "All QC'd trajectories loaded in TDesk",
      "Quantify gross error consequences",
    ],
  },
  {
    id:5, day:2, title:"MWD Raw Data & MSA", duration:"1h15",
    description:"Calculate inclination and azimuth from raw MWD data. Analyse magnetic interferences and assess MSA correction impact.",
    pitfalls:[
      "MSA requires IFR (Stage 3 Option A)",
      "Large magnetic interferences in first survey legs",
      "12-1/4\" interval: GWD only – no MWD raw data",
      "⚠️ CEO Hazard Card presentation at this stage",
    ],
    deliverables:[
      "Inclination and azimuth calculated from raw data",
      "Magnetic interference analysis completed",
    ],
  },
  {
    id:6, day:2, title:"BHA Sag Correction", duration:"30min",
    description:"Calculate inclination from raw MWD data and apply sag correction. Compare corrected MWD with overlapping GWD surveys.",
    pitfalls:[
      "MWD already sag-corrected – do not apply twice",
      "No consensus on sag correction sign convention",
      "12-1/4\" interval: GWD only, no independent gyro",
    ],
    deliverables:[
      "Inclination calculated and sag-corrected",
      "GWD vs MWD comparison completed",
      "TVD impact assessed",
    ],
  },
  {
    id:7, day:3, title:"Survey Program", duration:"1h", placeholder:true,
    description:"Define the survey program for the relief well.",
    pitfalls:["⚠️ Storm Hazard Card presentation at this stage"],
    deliverables:["Survey program completed per section"],
  },
  {
    id:8, day:3, title:"AC Company Rules", duration:"1h", placeholder:true,
    description:"Review and comment on the collision avoidance company rules in place.",
    pitfalls:[
      "⚠️ Insurance Hazard Card at this stage",
      "Min SF=1.5, 3σ, 10km radius, 3D closest approach method",
    ],
    deliverables:["AC rules reviewed and commented"],
  },
  {
    id:9, day:3, title:"Collision Investigation", duration:"1h", placeholder:true,
    description:"Investigate the collision scenario and identify root causes.",
    pitfalls:["⚠️ Press Hazard Card at this stage"],
    deliverables:["Collision root cause identified"],
  },
  {
    id:10, day:3, title:"Interception Depth & 12-1/4\" Section", duration:"1h15",
    description:"Determine the optimal interception depth. Assess 12-1/4\" section tortuosity and its impact on ROP.",
    pitfalls:[
      "Teams must submit their interception MD",
      "Tortuosity impacts 12-1/4\" ROP: Good=0 extra days, Acceptable, High",
    ],
    deliverables:[
      "Interception MD submitted",
      "Tortuosity assessment submitted",
    ],
    hasTeamInput:true,
    teamInputLabel:"Interception MD (m)",
    tortuosityOptions:["Good – 0 extra days","Acceptable","High"],
  },
  {
    id:11, day:4, title:"Relief Well Surface Location", duration:"1h", placeholder:true,
    description:"Select optimal surface location considering all environmental and operational constraints.",
    pitfalls:[
      "⚠️ Locals Hazard Card at this stage",
      "Seabed slope <3–5° preferred",
      "Wind from W-NW, current ESE→SE, waves W-NW",
    ],
    deliverables:["RW surface location selected and justified"],
  },
  {
    id:12, day:4, title:"Relief Well Planning", duration:"1h", placeholder:true,
    description:"Plan the relief well trajectory to intercept the target well.",
    pitfalls:[
      "A04: 9-5/8\" casing @1908.12m, TD @2305.90m",
      "3 additional hazard flow paths at 1908, 1948, 2082, 2248m",
    ],
    deliverables:["Relief well trajectory planned"],
  },
  {
    id:13, day:4, title:"Relief Well Proposal", duration:"1h", placeholder:true,
    description:"Finalise and present the relief well proposal including trajectory, survey program and interception strategy.",
    pitfalls:["⚠️ Press Hazard Card at this stage"],
    deliverables:[
      "Proposed RW TD submitted",
      "Full proposal presented",
    ],
    hasTeamInput:true,
    teamInputLabel:"Proposed RW TD (m)",
  },
];