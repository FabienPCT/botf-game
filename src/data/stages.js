// ─────────────────────────────────────────────────────────────
// FILE 5: src/data/stages.js
// ─────────────────────────────────────────────────────────────

export const STAGES = [
  // ══════════════════════════════════════════════════════════
  //  STAGE 1 – Platform Set-up & Surface Location
  // ══════════════════════════════════════════════════════════
  {
    id:1, day:1, title:"Platform Set-up & Surface Location", duration:"1h",
    description:"Analyse surface positioning for 17 wellbores. Apply correct CRS, account for surface uncertainties, and populate the database with platform structures and slot positions.",
    options:{
      A:{
        label:"Original Data", cost:0, penalty:260, timePenalty:1.5,
        penaltyNote:"10m error → 1 ranging run + 1 WL gyro. Total: 260 kUSD",
        items:[
          "CRS: GDM2000 / UTM zone 48N",
          "Platform A Center: E 524419.5 m | N 600608.5 m",
          "RT/MSL: 27.00 m | Water Depth/MSL: 94.50 m",
          "Absolute surface uncertainty: H=10 m, V=0.6 m (2σ)",
          "Relative surface uncertainty:  H=1 m,  V=0.6 m (2σ)",
          "Convergence: 0.0208 deg",
          "⚠️ TRAP: Slots A4↔A11 may appear mirrored – verify slot name vs well name",
          "⚠️ TRAP: All uncertainties are given at 2σ",
        ],
        // Structured table data for visual rendering
        tables:[
          {
            title:"Platform A — Original Scan (GDM2000 / UTM zone 48N)",
            note:"X & Y (highlighted) = offset from platform center",
            headers:["Well","Slot","Position Name","Northing (m)","Easting (m)","X (m)","Y (m)"],
            highlight:[5,6], // col indices to highlight (0-based)
            rows:[
              ["A1","Slot9","A1_Original","600606.70","524420.10","+0.60","-1.80"],
              ["A2","Slot1","A2_Original","600606.20","524415.30","-4.20","-2.30"],
              ["A3","Slot2","A3_Original","600607.80","524416.60","-2.90","-0.70"],
              ["A4","Slot6","A4_Original","600612.80","524421.60","+2.10","+4.30"],
              ["A5","Slot3","A5_Original","600608.80","524417.80","-1.70","+0.30"],
              ["A6","Slot10","A6_Original","600608.10","524421.30","+1.80","-0.40"],
              ["A7","Slot8","A7_Original","600605.40","524418.80","-0.70","-3.10"],
              ["A8","Slot4","A8_Original","600610.20","524419.10","-0.40","+1.70"],
              ["A9","Slot5","A9_Original","600611.50","524420.30","+0.80","+3.00"],
              ["A10","Slot12","A10_Original","600610.70","524423.70","+4.20","+2.20"],
              ["A11","Slot7","A11_Original","600604.10","524417.50","-2.00","-4.40"],
              ["A12","Slot11","A12_Original","600609.40","524422.60","+3.10","+0.90"],
            ],
          },
          {
            title:"Platform AA — 2013 Geodetic Survey (GDM2000 / UTM zone 48N)",
            note:"CRS datum shift GDM2000→WGS84: ΔE=+209.510 m | ΔN=−5.810 m | RT/MSL: 24.50 m | WD: 88.27 m | Abs unc: H=1m, Rel unc: H=0.2m (both 2σ)",
            headers:["Well","AA Slot","Position Name","E GDM2000 (m)","N GDM2000 (m)","E WGS84 (m)","N WGS84 (m)"],
            highlight:[],
            rows:[
              ["AA19","WH-13/CC","AA19_2013","524368.970","600573.340","524159.466","600579.144"],
              ["AA16","WH-14/CB","AA16_2013","524367.280","600575.050","524157.773","600580.856"],
              ["AA14","WH-15/CA","AA14_2013","524365.460","600576.810","524155.950","600582.620"],
              ["AA18","WH-16/CE","AA18_2013","524368.060","600577.650","524158.548","600583.453"],
              ["AA17","WH-17/CF","AA17_2013","524369.890","600575.920","524160.383","600581.730"],
              ["DEEP","WH-18/CG","DEEP_2013","524372.790","600573.300","524163.284","600579.111"],
              ["AA13","SPARE/CD","AA13_2013","524370.950","600571.270","524161.444","600577.080"],
            ],
          },
        ],
      },

      B:{
        label:"2011 Global DB QAQC", cost:50, penalty:80, timePenalty:0.5,
        penaltyNote:"5m abs uncertainty → intermediate gyro needed. Total: 130 kUSD",
        items:[
          "CRS: Kertau 1968 / UTM zone 48N [EPSG: 24548]",
          "Platform A Center: E 524420.50 m | N 600605.50 m",
          "RT/MSL: 27.00 m | Water Depth/MSL: 94.50 m",
          "Absolute surface uncertainty: H=10 m, V=0.6 m (2σ)",
          "Relative surface uncertainty:  H=0.4 m, V=0.6 m (2σ)",
          "Convergence: 0.0208 deg",
          "2011 survey highlighted large gross error in original surface coordinates",
          "Geodetic & Mapping parameters — Data Acquisition: 2D Geographical CRS: WGS84 (EPSG:4326)",
          "Mapping: 2D Projected CRS: WGS84/UTM zone 48N (EPSG:32648)",
          "⚠️ Absolute uncertainty still 10m – gyro run required to close AC gap",
        ],
        tables:[
          {
            title:"Platform A — 2011 Geodetic Survey (Kertau 1968 / UTM zone 48N)",
            note:"X & Y = offset from platform center. Note CRS difference vs Option A (GDM2000)",
            headers:["Well","Slot","Position Name","Northing (m)","Easting (m)","X (m)","Y (m)"],
            highlight:[5,6],
            rows:[
              ["A1","Slot9","A1_2011","600607.20","524420.20","-0.30","+1.70"],
              ["A2","Slot1","A2_2011","600607.71","524424.86","+4.36","+2.21"],
              ["A3","Slot2","A3_2011","600606.45","524423.68","+3.18","+0.95"],
              ["A4","Slot6","A4_2011","600601.12","524418.66","-1.84","-4.38"],
              ["A5","Slot3","A5_2011","600605.11","524422.42","+1.92","-0.39"],
              ["A6","Slot10","A6_2011","600605.87","524418.95","-1.55","+0.37"],
              ["A7","Slot8","A7_2011","600608.54","524421.46","+0.96","+3.04"],
              ["A8","Slot4","A8_2011","600603.78","524421.17","+0.67","-1.72"],
              ["A9","Slot5","A9_2011","600602.45","524419.91","-0.59","-3.05"],
              ["A10","Slot12","A10_2011","600603.21","524416.44","-4.06","-2.29"],
              ["A11","Slot7","A11_2011","600609.80","524422.64","+2.14","+4.30"],
              ["A12","Slot11","A12_2011","600604.54","524417.69","-2.81","-0.96"],
            ],
          },
          {
            title:"Platform AA — 2013 Geodetic Survey (Kertau 1968 / UTM zone 48N + WGS84)",
            note:"CRS datum shift: ΔE=+209.510 m | ΔN=−5.810 m | RT/MSL: 24.50 m | WD: 88.27 m | Abs unc: H=1m, Rel unc: H=0.2m (both 2σ)",
            headers:["Well","AA Slot","Position Name","E Kertau (m)","N Kertau (m)","E WGS84 (m)","N WGS84 (m)"],
            highlight:[],
            rows:[
              ["AA19","WH-13/CC","AA19_2013","524368.970","600573.340","524159.466","600579.144"],
              ["AA16","WH-14/CB","AA16_2013","524367.280","600575.050","524157.773","600580.856"],
              ["AA14","WH-15/CA","AA14_2013","524365.460","600576.810","524155.950","600582.620"],
              ["AA18","WH-16/CE","AA18_2013","524368.060","600577.650","524158.548","600583.453"],
              ["AA17","WH-17/CF","AA17_2013","524369.890","600575.920","524160.383","600581.730"],
              ["DEEP","WH-18/CG","DEEP_2013","524372.790","600573.300","524163.284","600579.111"],
              ["AA13","SPARE/CD","AA13_2013","524370.950","600571.270","524161.444","600577.080"],
            ],
          },
        ],
      },

      C:{
        label:"2013 New Survey", cost:150, penalty:0, timePenalty:0,
        penaltyNote:"No penalty. Total: 150 kUSD",
        items:[
          "CRS: WGS84 / UTM zone 48N [EPSG: 32648]",
          "Platform A Center: E 524211.50 m | N 600611.00 m",
          "RT/MSL: 27.00 m | Water Depth/MSL: 94.50 m",
          "Absolute surface uncertainty: H=1 m,  V=0.6 m (2σ)",
          "Relative surface uncertainty:  H=0.2 m, V=0.6 m (2σ)",
          "Convergence: 0.0208 deg",
          "2013 survey confirms 2011 findings – same relative uncertainty for both platforms",
          "Geodetic params — Data Acquisition: WGS84 (EPSG:4326) | Mapping: WGS84/UTM 48N (EPSG:32648)",
          "Platforms AA & A set in relative mode",
        ],
        tables:[
          {
            title:"Platform A — 2013 Geodetic Survey (WGS84 / UTM zone 48N)",
            note:"X & Y = offset from platform center. CRS: WGS84/UTM48N — coordinates differ significantly from Options A & B",
            headers:["Well","A Slot","Position Name","N (m)","E (m)","X (m)","Y (m)"],
            highlight:[5,6],
            rows:[
              ["A1","Slot9","A1_2013","600612.836","524211.069","-0.43","+1.84"],
              ["A2","Slot1","A2_2013","600613.402","524215.794","+4.29","+2.40"],
              ["A3","Slot2","A3_2013","600612.079","524214.527","+3.03","+1.08"],
              ["A4","Slot6","A4_2013","600606.769","524209.527","-1.97","-4.23"],
              ["A5","Slot3","A5_2013","600613.283","524213.283","+1.78","-0.25"],
              ["A6","Slot10","A6_2013","600611.506","524209.822","-1.68","+0.51"],
              ["A7","Slot8","A7_2013","600614.162","524212.327","+0.83","+3.16"],
              ["A8","Slot4","A8_2013","600609.412","524212.039","+0.54","-1.59"],
              ["A9","Slot5","A9_2013","600608.082","524210.785","-0.72","-2.92"],
              ["A10","Slot12","A10_2013","600608.829","524207.311","-4.19","-2.17"],
              ["A11","Slot7","A11_2013","600615.486","524213.572","+2.07","+4.49"],
              ["A12","Slot11","A12_2013","600610.162","524208.572","-2.93","-0.84"],
            ],
          },
          {
            title:"Platform AA — 2013 Geodetic Survey (GDM2000 / UTM zone 48N + WGS84)",
            note:"CRS datum shift: ΔE=+209.510 m | ΔN=−5.810 m | RT/MSL: 24.50 m | WD: 88.27 m | Abs unc: H=1m, Rel unc: H=0.2m (both 2σ)",
            headers:["Well","AA Slot","Position Name","E GDM2000 (m)","N GDM2000 (m)","E WGS84 (m)","N WGS84 (m)"],
            highlight:[],
            rows:[
              ["AA19","WH-13/CC","AA19_2013","524368.970","600573.340","524159.466","600579.144"],
              ["AA16","WH-14/CB","AA16_2013","524367.280","600575.050","524157.773","600580.856"],
              ["AA14","WH-15/CA","AA14_2013","524365.460","600576.810","524155.950","600582.620"],
              ["AA18","WH-16/CE","AA18_2013","524368.060","600577.650","524158.548","600583.453"],
              ["AA17","WH-17/CF","AA17_2013","524369.890","600575.920","524160.383","600581.730"],
              ["DEEP","WH-18/CG","DEEP_2013","524372.790","600573.300","524163.284","600579.111"],
              ["AA13","SPARE/CD","AA13_2013","524370.950","600571.270","524161.444","600577.080"],
            ],
          },
        ],
      },
    },

    pitfalls:[
      "Slots mirrored (A4↔A11) in Option A — verify slot name vs well name",
      "CRS changes between options: GDM2000 (A) → Kertau 1968 (B) → WGS84 (C)",
      "Platform AA coords exist in TWO CRS in all options — do NOT mix GDM2000 and WGS84",
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

  // ══════════════════════════════════════════════════════════
  //  STAGE 2 – Top-Hole & EOU Starting Point
  // ══════════════════════════════════════════════════════════
  {
    id:2, day:1, title:"Top-Hole & EOU Starting Point", duration:"45min",
    description:"Investigate vertical positioning of 17 wellbores. Determine correct EOU starting depth from as-built schematics, CP guide data and ROV information.",
    options:{
      C:{ label:"Platform AA Data Mining", cost:20, penalty:50, timePenalty:0.5,
          penaltyNote:"Tilted CPs found later → extra steering ~½ day. Total: 70 kUSD",
          items:["AA platform drawing with last guide depths","Presence of guides confirmed and validated for Platform AA"] },
      A:{ label:"Platforms A & AA Data Mining", cost:40, penalty:50, timePenalty:0.5,
          penaltyNote:"No CP tilt info for AA → extra steering. Total: 90 kUSD",
          items:["AA platform drawing with last guide depths","Platform A geometry sketches (4 levels)","Excel: seabed slot positions (B5:C16 from Stage 1)","Guide depths confirmed via sketches for Platform A"] },
      B:{ label:"New Survey", cost:130, penalty:0, timePenalty:0,
          penaltyNote:"No penalty. Total: 130 kUSD",
          items:["AA platform drawing + Platform A geometry sketches (4 levels)","AA13/14/16/18 CP gyro survey reports","Excel: seabed slot positions (B5:C16 from Stage 1)","AUV + gyro confirms: all CPs are tilted on Platform AA","⚠️ All CP inclinations at seabed are non-zero – EOU must start at last guide depth"] },
    },
    pitfalls:["CPs tilted on AA Platform – only visible via Option B","A01/A03/A05–A12 high inclination by design (up to 12°)","LAT vs MSL conversion needed for EOU depth"],
    deliverables:["Adequate EOU starting depth per well","Correct last guide indication (vertical or inclined)","Challenged inclination at seabed where required"],
  },

  // ══════════════════════════════════════════════════════════
  //  STAGE 3 – Geomagnetic Reference
  // ══════════════════════════════════════════════════════════
  {
    id:3, day:1, title:"Geomagnetic Reference", duration:"30min",
    description:"Select the appropriate geomagnetic reference. Understand how resolution impacts lateral uncertainty and MSA applicability.",
    options:{
      A:{ label:"IFR Survey", cost:80, penalty:0, timePenalty:0,
          penaltyNote:"No penalty. MSA applicable.",
          items:["IFR report — Btot: 50291.51 nT | Dip: 70.72° | Declination: 0.42° | Date: 01-Apr-2008","Enables MSA (Multi-Station Analysis) correction","Reduces lateral uncertainty significantly"] },
      B:{ label:"IGRF", cost:0, penalty:280, timePenalty:2,
          penaltyNote:"+2 days ops. Total: 280 kUSD",
          items:["IGRF public model — Btot: 50085 nT | Dip: 70.70° | Declination: 0.61° | Date: 03-Mar-2008","⚠️ Limited reliability – faster lateral uncertainty growth","⚠️ MSA NOT applicable with IGRF"] },
      C:{ label:"HRGM2013", cost:10, penalty:180, timePenalty:0,
          penaltyNote:"+1 day ops. Total: 180 kUSD",
          items:["HRGM2013 — Btot: 50291.51 nT | Dip: 70.72° | Declination: 0.42° | Date: 01-Apr-2008","⚠️ Refined but not fine – lateral uncertainty still grows faster than IFR","⚠️ MSA NOT applicable with HRGM"] },
    },
    pitfalls:["MSA only applicable with IFR (Option A)","0.1° declination error in B/C creates additional RW displacement"],
    deliverables:["Geomagnetic reference entered in TDesk","Quantify impact on lateral uncertainty"],
  },

  // ══════════════════════════════════════════════════════════
  //  STAGE 4 – Trajectory Gross Error QC
  // ══════════════════════════════════════════════════════════
  {
    id:4, day:2, title:"Trajectory Gross Error QC", duration:"1h15",
    description:"Audit the survey database. Identify gross errors in legacy wellbore data including duplicate surveys, excessive DLS, interpolated stations and typos.",
    options:{
      A:{ label:"Internal QAQC", cost:0, penalty:0, timePenalty:0, penaltyNote:"Time-limited; errors may remain uncorrected",
          items:["Legacy survey data provided well by well","You must identify all errors independently","Key checks: first survey vs seabed vs last guide, tortuosity, tie-on depth, survey sampling, TD projection"] },
      B:{ label:"3rd Party QAQC", cost:50, penalty:0, timePenalty:0, penaltyNote:"Most errors corrected",
          items:["• A01: projection at 124m removed","• A03-QC: top-hole corrected (was identical to A05)","• A04-QC: interpolated 6.1m stations removed","• A06-QC: typo at 163m corrected (12.75°→15.75°), extra deep surveys added","• A08: main branch above 510m retrieved (sidetrack only before)","• A12-QC: top-hole corrected (was from A06)","• A16, A18, Deep1: interpolated values at last guide removed"] },
      C:{ label:"3rd Party QAQC + New Survey", cost:90, penalty:0, timePenalty:0, penaltyNote:"Full correction + confirmation surveys",
          items:["All Option B corrections included","Additional Excel survey sheets for confirmation of key wells"] },
    },
    pitfalls:["A03 top-hole = A05 + typo at 1471m (inc 77.1°)","A04 interpolated 6m stations","A08 sidetrack only – main borehole missing","A12 top-hole from A06","Priority: Deep1, A04, A03, A06, A08, A12, AA16 first"],
    deliverables:["All QC'd trajectories loaded in TDesk","Quantify gross error consequences"],
  },

  // ══════════════════════════════════════════════════════════
  //  STAGE 5 – MWD Raw Data & MSA
  // ══════════════════════════════════════════════════════════
  {
    id:5, day:2, title:"MWD Raw Data & MSA", duration:"1h15",
    description:"Calculate inclination and azimuth from raw MWD data. Analyse magnetic interferences and assess MSA correction impact.",
    options:{
      A:{ label:"Internal QAQC", cost:0, penalty:0, timePenalty:0, penaltyNote:"No correction applied",
          items:["IGRF Reference Model","AA16 MWD Runs 1,2,3,4,6,7","AA16 Gyro 30in & 13-3/8in","Run your own trajectory comparison"] },
      B:{ label:"3rd Party QAQC", cost:10, penalty:0, timePenalty:0, penaltyNote:"No MSA correction",
          items:["Same data as Option A","You must still run the trajectory comparison independently"] },
      C:{ label:"3rd Party + MSA", cost:25, penalty:40, timePenalty:0, penaltyNote:"If IFR not purchased at S3: +40 kUSD penalty",
          items:["IFR Reference Model (⚠️ +40 kUSD if IFR not selected at Stage 3)","AA16 all MWD runs & Gyro runs","MSA correction report with azimuth correction assessment"] },
    },
    pitfalls:["MSA requires IFR (Stage 3 Option A)","Large magnetic interferences in first survey legs","12-1/4\" interval: GWD only – no MWD raw data","⚠️ CEO Hazard Card presentation at this stage"],
    deliverables:["Inclination and azimuth calculated from raw data","Magnetic interference analysis completed"],
  },

  // ══════════════════════════════════════════════════════════
  //  STAGE 6 – BHA Sag Correction
  // ══════════════════════════════════════════════════════════
  {
    id:6, day:2, title:"BHA Sag Correction", duration:"30min",
    description:"Calculate inclination from raw MWD data and apply sag correction. Compare corrected MWD with overlapping GWD surveys.",
    options:{
      A:{ label:"Internal QAQC", cost:0, penalty:0, timePenalty:0, penaltyNote:"Own raw data analysis required",
          items:["BHA Description","Sag Calc Report (4 possible sensor locations for MWD & GWD)","MWD Raw Data (accelerometer data)","MWD + GWD Surveys","MWD + DDS + IFR + Sag combined"] },
      B:{ label:"3rd Party QAQC", cost:10, penalty:0, timePenalty:0, penaltyNote:"GWD default sensor position wrong – must correct",
          items:["BHA Description","Sag Calc Report with sensor positions specified","⚠️ Default GWD sensor position is incorrect – you must correct it","MWD Raw Data with pre-calculated inclinations","MWD + GWD Surveys"] },
      C:{ label:"3rd Party Sag Corrected", cost:20, penalty:0, timePenalty:0, penaltyNote:"Do not apply sag correction again",
          items:["All Option B data","Inclination comparison plot","Inclination difference plot","⚠️ Sag already applied – do NOT reapply"] },
    },
    pitfalls:["MWD already sag-corrected – do not apply twice","No consensus on sag correction sign convention","12-1/4\" interval: GWD only, no independent gyro"],
    deliverables:["Inclination calculated and sag-corrected","GWD vs MWD comparison completed","TVD impact assessed"],
  },

  // ══════════════════════════════════════════════════════════
  //  STAGES 7–13 – Placeholders
  // ══════════════════════════════════════════════════════════
  {
    id:7, day:3, title:"Survey Program", duration:"1h", placeholder:true,
    description:"Define the survey program for the relief well.",
    options:{
      A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
      B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
      C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
    },
    pitfalls:["⚠️ Storm Hazard Card presentation at this stage"],
    deliverables:["Survey program completed per section"],
  },
  {
    id:8, day:3, title:"AC Company Rules", duration:"1h", placeholder:true,
    description:"Review and comment on the collision avoidance company rules in place.",
    options:{
      A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["Company AC rules document"] },
      B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
      C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
    },
    pitfalls:["⚠️ Insurance Hazard Card at this stage","Min SF=1.5, 3σ, 10km radius, 3D closest approach method"],
    deliverables:["AC rules reviewed and commented"],
  },
  {
    id:9, day:3, title:"Collision Investigation", duration:"1h", placeholder:true,
    description:"Investigate the collision scenario and identify root causes.",
    options:{
      A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
      B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
      C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
    },
    pitfalls:["⚠️ Press Hazard Card at this stage"],
    deliverables:["Collision root cause identified"],
  },
  {
    id:10, day:3, title:"Interception Depth & 12-1/4\" Section", duration:"1h15",
    description:"Determine the optimal interception depth. Assess 12-1/4\" section tortuosity and its impact on ROP.",
    options:{
      A:{ label:"Internal Assessment", cost:0, penalty:0, timePenalty:0, penaltyNote:"Interception >30m away → no casing, no ST of 12-1/4\" section",
          items:["Wellbore trajectory data","Anti-collision plots","Determine interception position independently","⚠️ If >30m away: no casing run, no ST of 12-1/4\" section"] },
      B:{ label:"3rd Party Assessment", cost:10, penalty:0, timePenalty:0, penaltyNote:"Interception 5–30m → +3 extra ranging runs",
          items:["Wellbore trajectory + AC plots","3rd party ranging analysis","⚠️ If 5–30m: +3 extra ranging runs required"] },
      C:{ label:"Full Assessment", cost:25, penalty:0, timePenalty:0, penaltyNote:"Interception <5m → no additional penalty",
          items:["Full wellbore trajectory + AC dataset","Complete 3rd party assessment report","Interception within 5m – no additional ranging penalty"] },
    },
    pitfalls:["Teams must submit their interception MD","Tortuosity impacts 12-1/4\" ROP: Good=0 extra days, Acceptable, High"],
    deliverables:["Interception MD submitted","Tortuosity assessment submitted"],
    hasTeamInput:true, teamInputLabel:"Interception MD (m)",
    tortuosityOptions:["Good – 0 extra days","Acceptable","High"],
  },
  {
    id:11, day:4, title:"Relief Well Surface Location", duration:"1h", placeholder:true,
    description:"Select optimal surface location considering all environmental and operational constraints.",
    options:{
      A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["Shallow hazard map","Seabed slope map","Current / wind / wave data"] },
      B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
      C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
    },
    pitfalls:["⚠️ Locals Hazard Card at this stage","Seabed slope <3–5° preferred","Wind from W-NW, current ESE→SE, waves W-NW"],
    deliverables:["RW surface location selected and justified"],
  },
  {
    id:12, day:4, title:"Relief Well Planning", duration:"1h", placeholder:true,
    description:"Plan the relief well trajectory to intercept the target well.",
    options:{
      A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["A04 well schematic","Flow path analysis"] },
      B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
      C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD", items:["To be released by instructor"] },
    },
    pitfalls:["A04: 9-5/8\" casing @1908.12m, TD @2305.90m","3 additional hazard flow paths at 1908, 1948, 2082, 2248m"],
    deliverables:["Relief well trajectory planned"],
  },
  {
    id:13, day:4, title:"Relief Well Proposal", duration:"1h", placeholder:true,
    description:"Finalise and present the relief well proposal including trajectory, survey program and interception strategy.",
    options:{
      A:{ label:"Option A", cost:0, penalty:0, timePenalty:1.25, penaltyNote:"TBD", items:["To be released by instructor"] },
      B:{ label:"Option B", cost:0, penalty:0, timePenalty:1.5,  penaltyNote:"TBD", items:["To be released by instructor"] },
      C:{ label:"Option C", cost:0, penalty:0, timePenalty:1.5,  penaltyNote:"TBD", items:["To be released by instructor"] },
    },
    pitfalls:["⚠️ Press Hazard Card at this stage"],
    deliverables:["Proposed RW TD submitted","Full proposal presented"],
    hasTeamInput:true, teamInputLabel:"Proposed RW TD (m)",
  },
];

export const HAZARD_CARDS = [
  { id:"CEO",       stage:5,  label:"CEO – S5 / AA16 Raw Data"          },
  { id:"Storm",     stage:7,  label:"Storm – S7 / Survey Program"        },
  { id:"Insurance", stage:8,  label:"Insurance – S8 / AC Company Rules"  },
  { id:"Locals",    stage:11, label:"Locals – S11 / RW Surface Location" },
  { id:"Press",     stage:13, label:"Press – S13 / RW Proposal"          },
];

export const RIG_DAILY = 100;
export const AMR_DAILY = 80;
export const REF_MD = { IBD:1828, GM:2102, AC:1971, VF:1722, SC:1866 };