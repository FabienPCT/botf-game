// src/data/stages/items.js
// Bullet-point text items shown to teams after a stage is released
// STAGE_ITEMS[stageId][optionKey] = string[]

export const STAGE_ITEMS = {
  1: {
    A:[
      "CRS: GDM2000 / UTM zone 48N",
      "Platform A Center: E 524419.5 m | N 600608.5 m",
      "RT/MSL: 27.00 m | Water Depth/MSL: 94.50 m",
      "Absolute surface uncertainty: H=10 m, V=0.6 m (2σ)",
      "Relative surface uncertainty:  H=1 m,  V=0.6 m (2σ)",
      "Convergence: 0.0208 deg",
      "⚠️ TRAP: Slots A4↔A11 may appear mirrored – verify slot name vs well name",
      "⚠️ TRAP: All uncertainties are given at 2σ",
    ],
    B:[
      "CRS: Kertau 1968 / UTM zone 48N [EPSG: 24548]",
      "Platform A Center: E 524420.50 m | N 600605.50 m",
      "RT/MSL: 27.00 m | Water Depth/MSL: 94.50 m",
      "Absolute surface uncertainty: H=10 m, V=0.6 m (2σ)",
      "Relative surface uncertainty:  H=0.4 m, V=0.6 m (2σ)",
      "Convergence: 0.0208 deg",
      "2011 survey highlighted large gross error in original surface coordinates",
      "Geodetic params — Acquisition CRS: WGS84 (EPSG:4326) | Mapping: WGS84/UTM48N (EPSG:32648)",
      "⚠️ Absolute uncertainty still 10m – gyro run required to close AC gap",
    ],
    C:[
      "CRS: WGS84 / UTM zone 48N [EPSG: 32648]",
      "Platform A Center: E 524211.50 m | N 600611.00 m",
      "RT/MSL: 27.00 m | Water Depth/MSL: 94.50 m",
      "Absolute surface uncertainty: H=1 m,  V=0.6 m (2σ)",
      "Relative surface uncertainty:  H=0.2 m, V=0.6 m (2σ)",
      "Convergence: 0.0208 deg",
      "2013 survey confirms 2011 findings – same relative uncertainty for both platforms",
      "Geodetic params — Acquisition CRS: WGS84 (EPSG:4326) | Mapping: WGS84/UTM48N (EPSG:32648)",
      "Platforms AA & A set in relative mode",
    ],
  },
  2: {
    A:[
      "AA platform drawing with last guide depths",
      "Platform A geometry sketches (4 levels)",
      "Excel: seabed slot positions (B5:C16 from Stage 1)",
      "Guide depths confirmed via sketches for Platform A",
    ],
    B:[
      "AA platform drawing + Platform A geometry sketches (4 levels)",
      "30\" Conductor Gyro WL surveys: AA16 (0–230m) and AA18 (0–220m)",
      "Excel: seabed slot positions (B5:C16 from Stage 1)",
      "AUV + gyro confirms: all CPs are tilted on Platform AA",
      "AA16 max inclination: 1.91° @ 120m MD | AA18 max inclination: 2.97° @ 150m MD",
      "⚠️ All CP inclinations at seabed are non-zero – EOU must start at last guide depth",
    ],
    C:[
      "AA platform drawing with last guide depths",
      "Presence of guides confirmed and validated for Platform AA",
    ],
  },
  3: {
    A:[
      "Model: GRGM2013 | Toolcode: MWD_OWSG_Rev5 + IFR",
      "AA16 — Btot: 50329.88 nT | Dip: 70.76° | Dec: 0.52° | Date: April 10, 2008",
      "RW  — Btot: 50034.06 nT | Dip: 69.68° | Dec: −0.16° | Date: June 15, 2013",
      "6 depth points for AA16 (P01–P06) and 5 depth points for RW (P01–P05)",
      "Sag correction required | MSA applicable with IFR",
    ],
    B:[
      "Model: IGRF | Toolcode: MWD_OWSG_Rev5",
      "AA16 — Btot: 50085.00 nT | Dip: 70.70° | Dec: 0.61° | Date: March 1, 2008",
      "RW  — Btot: 49923.00 nT | Dip: 69.85° | Dec: −0.02° | Date: June 1, 2013",
      "Sag correction required",
      "⚠️ MSA NOT recommended without IFR",
      "⚠️ 0.1° declination difference vs IFR/HRGM — increases lateral uncertainty",
    ],
    C:[
      "Model: HRGM2013 | Toolcode: MWD_OWSG_Rev5",
      "AA16 — Btot: 50291.51 nT | Dip: 70.72° | Dec: 0.42° | Date: April 1, 2008",
      "RW  — Btot: 50003.00 nT | Dip: 69.75° | Dec: −0.22° | Date: June 1, 2013",
      "Compatible models: BGGM, HDGM or HRGM",
      "Sag correction required",
      "⚠️ MSA NOT recommended without IFR",
    ],
  },
  4: {
    A:[
      "Legacy survey data provided well by well",
      "You must identify all errors independently",
      "Key checks: first survey vs seabed vs last guide, tortuosity, tie-on depth, survey sampling, TD projection",
    ],
    B:[
      "• A01: projection at 124m removed",
      "• A03-QC: top-hole corrected (was identical to A05)",
      "• A04-QC: interpolated 6.1m stations removed",
      "• A06-QC: typo at 163m corrected (12.75°→15.75°), extra deep surveys added",
      "• A08: main branch above 510m retrieved (sidetrack only before)",
      "• A12-QC: top-hole corrected (was from A06)",
      "• A16, A18, Deep1: interpolated values at last guide removed",
    ],
    C:[
      "All Option B corrections included",
      "Additional Excel survey sheets for confirmation of key wells",
    ],
  },
  5: {
    A:[
      "IGRF Reference Model",
      "AA16 MWD Runs 1, 2, 3, 4, 6, 7",
      "AA16 Gyro 30in & 13-3/8in",
      "Run your own trajectory comparison",
    ],
    B:[
      "Same data as Option A",
      "You must still run the trajectory comparison independently",
    ],
    C:[
      "IFR Reference Model (⚠️ +40 kUSD if IFR not selected at Stage 3)",
      "AA16 all MWD runs & Gyro runs",
      "MSA correction report with azimuth correction assessment",
    ],
  },
  6: {
    A:[
      "BHA Description",
      "Sag Calc Report (4 possible sensor locations for MWD & GWD)",
      "MWD Raw Data (accelerometer data)",
      "MWD + GWD Surveys",
      "MWD + DDS + IFR + Sag combined",
    ],
    B:[
      "BHA Description",
      "Sag Calc Report with sensor positions specified",
      "⚠️ Default GWD sensor position is incorrect – you must correct it",
      "MWD Raw Data with pre-calculated inclinations",
      "MWD + GWD Surveys",
    ],
    C:[
      "All Option B data",
      "Inclination comparison plot",
      "Inclination difference plot",
      "⚠️ Sag already applied – do NOT reapply",
    ],
  },
  7:  { A:["To be released by instructor"], B:["To be released by instructor"], C:["To be released by instructor"] },
  8:  { A:["To be released by instructor"], B:["To be released by instructor"], C:["To be released by instructor"] },
  9:  { A:["To be released by instructor"], B:["To be released by instructor"], C:["To be released by instructor"] },
  10: {
    A:[
      "Wellbore trajectory data",
      "Anti-collision plots",
      "Determine interception position independently",
      "⚠️ If >30m away: no casing run, no ST of 12-1/4\" section",
    ],
    B:[
      "Wellbore trajectory + AC plots",
      "3rd party ranging analysis",
      "⚠️ If 5–30m: +3 extra ranging runs required",
    ],
    C:[
      "Full wellbore trajectory + AC dataset",
      "Complete 3rd party assessment report",
      "Interception within 5m – no additional ranging penalty",
    ],
  },
  11: {
    A:["Shallow hazard map", "Seabed slope map", "Current / wind / wave data"],
    B:["To be released by instructor"],
    C:["To be released by instructor"],
  },
  12: {
    A:["A04 well schematic", "Flow path analysis"],
    B:["To be released by instructor"],
    C:["To be released by instructor"],
  },
  13: {
    A:["To be released by instructor"],
    B:["To be released by instructor"],
    C:["To be released by instructor"],
  },
};