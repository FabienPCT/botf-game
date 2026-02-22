// ─────────────────────────────────────────────────────────────
// FILE 4: src/data/teams.js
// Change passwords here before each session if needed
// ─────────────────────────────────────────────────────────────
export const TEAMS = [
  { id:"IBD", name:"Iron Bore Drillers",     color:"gray",   password:"1111", logo:"/images/teams/iron-bore-drillers.png" },
  { id:"GM",  name:"GeoMax",                color:"green",  password:"2222", logo:"/images/teams/geo-max.png"            },
  { id:"AC",  name:"AquaCore Drillers",     color:"cyan",   password:"3333", logo:"/images/teams/aquacore.png"           },
  { id:"VF",  name:"VolcanoForge",          color:"orange", password:"4444", logo:"/images/teams/volcano-forge.png"      },
  { id:"SC",  name:"Stellar Core Drillers", color:"purple", password:"5555", logo:"/images/teams/stellar-core.png"       },
];

export const CLR = {
  gray:   { h:"bg-gray-700",   btn:"bg-gray-600 hover:bg-gray-500",    badge:"bg-gray-700 text-gray-200",    text:"text-gray-300",   border:"border-gray-500",   light:"bg-gray-800"   },
  green:  { h:"bg-green-800",  btn:"bg-green-700 hover:bg-green-600",  badge:"bg-green-900 text-green-200",  text:"text-green-300",  border:"border-green-500",  light:"bg-green-950"  },
  cyan:   { h:"bg-cyan-800",   btn:"bg-cyan-700 hover:bg-cyan-600",    badge:"bg-cyan-900 text-cyan-200",    text:"text-cyan-300",   border:"border-cyan-500",   light:"bg-cyan-950"   },
  orange: { h:"bg-orange-800", btn:"bg-orange-700 hover:bg-orange-600",badge:"bg-orange-900 text-orange-200",text:"text-orange-300", border:"border-orange-500", light:"bg-orange-950" },
  purple: { h:"bg-purple-800", btn:"bg-purple-700 hover:bg-purple-600",badge:"bg-purple-900 text-purple-200",text:"text-purple-300", border:"border-purple-500", light:"bg-purple-950" },
};