// src/data/stages/options.js
// Option metadata only: labels, costs, penalties
// No bullet items or table data here

export const STAGE_OPTIONS = {
  1: {
    A:{ label:"Original Data",       cost:0,   penalty:260, timePenalty:1.5, penaltyNote:"10m error → 1 ranging run + 1 WL gyro. Total: 260 kUSD" },
    B:{ label:"2011 Global DB QAQC", cost:50,  penalty:80,  timePenalty:0.5, penaltyNote:"5m abs uncertainty → intermediate gyro needed. Total: 130 kUSD" },
    C:{ label:"2013 New Survey",      cost:150, penalty:0,   timePenalty:0,   penaltyNote:"No penalty. Total: 150 kUSD" },
  },
  2: {
    A:{ label:"Platforms A & AA Data Mining", cost:40,  penalty:50, timePenalty:0.5, penaltyNote:"No CP tilt info for AA → extra steering. Total: 90 kUSD" },
    B:{ label:"New Survey",                   cost:130, penalty:0,  timePenalty:0,   penaltyNote:"No penalty. Total: 130 kUSD" },
    C:{ label:"Platform AA Data Mining",      cost:20,  penalty:50, timePenalty:0.5, penaltyNote:"Tilted CPs found later → extra steering ~½ day. Total: 70 kUSD" },
  },
  3: {
    A:{ label:"IFR Survey", cost:80, penalty:0,   timePenalty:0, penaltyNote:"No penalty. MSA applicable." },
    B:{ label:"IGRF",       cost:0,  penalty:280,  timePenalty:2, penaltyNote:"+2 days ops. Total: 280 kUSD" },
    C:{ label:"HRGM2013",   cost:10, penalty:180,  timePenalty:0, penaltyNote:"+1 day ops. Total: 180 kUSD" },
  },
  4: {
    A:{ label:"Internal QAQC",             cost:0,  penalty:0, timePenalty:0, penaltyNote:"Time-limited; errors may remain uncorrected" },
    B:{ label:"3rd Party QAQC",            cost:50, penalty:0, timePenalty:0, penaltyNote:"Most errors corrected" },
    C:{ label:"3rd Party QAQC + New Survey",cost:90, penalty:0, timePenalty:0, penaltyNote:"Full correction + confirmation surveys" },
  },
  5: {
    A:{ label:"Internal QAQC",   cost:0,  penalty:0,  timePenalty:0, penaltyNote:"No correction applied" },
    B:{ label:"3rd Party QAQC",  cost:10, penalty:0,  timePenalty:0, penaltyNote:"No MSA correction" },
    C:{ label:"3rd Party + MSA", cost:25, penalty:40, timePenalty:0, penaltyNote:"If IFR not purchased at S3: +40 kUSD penalty" },
  },
  6: {
    A:{ label:"Internal QAQC",         cost:0,  penalty:0, timePenalty:0, penaltyNote:"Own raw data analysis required" },
    B:{ label:"3rd Party QAQC",        cost:10, penalty:0, timePenalty:0, penaltyNote:"GWD default sensor position wrong – must correct" },
    C:{ label:"3rd Party Sag Corrected",cost:20, penalty:0, timePenalty:0, penaltyNote:"Do not apply sag correction again" },
  },
  7: {
    A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
  },
  8: {
    A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
  },
  9: {
    A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
  },
  10: {
    A:{ label:"Internal Assessment", cost:0,  penalty:0, timePenalty:0, penaltyNote:"Interception >30m away → no casing, no ST of 12-1/4\" section" },
    B:{ label:"3rd Party Assessment",cost:10, penalty:0, timePenalty:0, penaltyNote:"Interception 5–30m → +3 extra ranging runs" },
    C:{ label:"Full Assessment",      cost:25, penalty:0, timePenalty:0, penaltyNote:"Interception <5m → no additional penalty" },
  },
  11: {
   A:{ label:"Shallow hazard map + slope + metocean", cost:0, penalty:0, timePenalty:0, penaltyNote:"Surface location submitted" },
 },
 12: {
   A:{ label:"RW trajectory (MD/Inc/Azi every 30m)", cost:0, penalty:0, timePenalty:0, penaltyNote:"Trajectory submitted" },
 },
 /*  
  11: {
    A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
  },
  12: {
    A:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    B:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
    C:{ label:"TBD", cost:0, penalty:0, timePenalty:0, penaltyNote:"TBD" },
  } */
  13: {
    A:{ label:"Option A", cost:0, penalty:0, timePenalty:1.25, penaltyNote:"TBD" },
    B:{ label:"Option B", cost:0, penalty:0, timePenalty:1.5,  penaltyNote:"TBD" },
    C:{ label:"Option C", cost:0, penalty:0, timePenalty:1.5,  penaltyNote:"TBD" },
  },
};