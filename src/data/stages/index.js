// src/data/stages/index.js
// Re-export point — all app imports stay identical:
// import { STAGES, HAZARD_CARDS, RIG_DAILY, AMR_DAILY, REF_MD } from "./data/stages"

export { RIG_DAILY, AMR_DAILY, REF_MD, HAZARD_CARDS } from "./constants";
import { STAGE_META }    from "./meta";
import { STAGE_OPTIONS } from "./options";
import { STAGE_ITEMS }   from "./items";
import { STAGE_TABLES }  from "./tables";

export const STAGES = STAGE_META.map(meta => ({
  ...meta,
  options: Object.fromEntries(
    Object.entries(STAGE_OPTIONS[meta.id] || {}).map(([k, opt]) => [k, {
      ...opt,
      items:  STAGE_ITEMS[meta.id]?.[k]  || [],
      tables: STAGE_TABLES[meta.id]?.[k] || [],
    }])
  ),
}));