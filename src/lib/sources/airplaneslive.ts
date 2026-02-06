import type { Aircraft, AirplanesLiveResponse, AirplanesLiveAircraft } from "@/types/aircraft";

const API_BASE_URL = "https://api.airplanes.live/v2";

// Conversion constants
const FEET_TO_METERS = 0.3048;
const KNOTS_TO_MS = 0.514444;
const FPM_TO_MS = 0.00508;

// ICAO hex prefix → country mapping (based on ICAO Annex 10 allocations)
// Uses 3-char prefixes first for precision, then 2-char, then 1-char
const ICAO_COUNTRIES_3: Record<string, string> = {
  // South Korea (718-71B)
  "718": "Coree du Sud", "719": "Coree du Sud", "71A": "Coree du Sud", "71B": "Coree du Sud",
  // UAE (730-737)
  "730": "Emirats Arabes Unis", "731": "Emirats Arabes Unis", "732": "Emirats Arabes Unis",
  // Israel (738-73F)
  "738": "Israel", "739": "Israel", "73A": "Israel", "73B": "Israel",
  // Saudi Arabia (710-713)
  "710": "Arabie Saoudite", "711": "Arabie Saoudite", "712": "Arabie Saoudite", "713": "Arabie Saoudite",
  // Turkey (750-755)
  "750": "Turquie", "751": "Turquie", "752": "Turquie", "753": "Turquie",
  // Pakistan (758-75F)
  "758": "Pakistan", "759": "Pakistan", "75A": "Pakistan",
  // Norway (4E0-4E3)
  "4E0": "Norvege", "4E1": "Norvege", "4E2": "Norvege", "4E3": "Norvege",
  // Poland (4E4-4E7)
  "4E4": "Pologne", "4E5": "Pologne", "4E6": "Pologne", "4E7": "Pologne",
  // Sweden (4E8-4EF)
  "4E8": "Suede", "4E9": "Suede", "4EA": "Suede", "4EB": "Suede",
  // Switzerland (4B0-4B7 partial)
  "4B0": "Suisse", "4B1": "Suisse", "4B2": "Suisse", "4B3": "Suisse",
  // Romania (4F0-4F3)
  "4F0": "Roumanie", "4F1": "Roumanie", "4F2": "Roumanie", "4F3": "Roumanie",
  // Austria (440-447)
  "440": "Autriche", "441": "Autriche", "442": "Autriche", "443": "Autriche",
  // Belgium (448-44F)
  "448": "Belgique", "449": "Belgique", "44A": "Belgique", "44B": "Belgique",
  // Croatia (458-45F)
  "458": "Croatie", "459": "Croatie", "45A": "Croatie",
  // Czech Republic (468-46F)
  "468": "Tchequie", "469": "Tchequie", "46A": "Tchequie", "46B": "Tchequie",
  // Denmark (470-477)
  "470": "Danemark", "471": "Danemark", "472": "Danemark", "473": "Danemark",
  // Finland (480-487)
  "480": "Finlande", "481": "Finlande", "482": "Finlande", "483": "Finlande",
  // Greece (490-497)
  "490": "Grece", "491": "Grece", "492": "Grece", "493": "Grece",
  // Hungary (498-49F)
  "498": "Hongrie", "499": "Hongrie", "49A": "Hongrie",
  // South Africa (008-00F)
  "008": "Afrique du Sud", "009": "Afrique du Sud", "00A": "Afrique du Sud", "00F": "Afrique du Sud",
};

const ICAO_COUNTRIES_2: Record<string, string> = {
  // Italy (300000-33BFFF)
  "30": "Italie", "31": "Italie", "32": "Italie", "33": "Italie",
  // Spain (340000-37FFFF)
  "34": "Espagne", "35": "Espagne", "36": "Espagne", "37": "Espagne",
  // France (380000-3BFFFF)
  "38": "France", "39": "France", "3A": "France", "3B": "France",
  // Germany (3C0000-3FFFFF)
  "3C": "Allemagne", "3D": "Allemagne", "3E": "Allemagne", "3F": "Allemagne",
  // UK (400000-43FFFF)
  "40": "Royaume-Uni", "41": "Royaume-Uni", "42": "Royaume-Uni", "43": "Royaume-Uni",
  // European small countries (approximate for 2-char prefix)
  "44": "Autriche", "45": "Bulgarie", "46": "Tchequie",
  "47": "Danemark", "48": "Finlande", "49": "Grece",
  "4A": "Irlande", "4B": "Suisse", "4C": "Lituanie",
  "4D": "Pays-Bas", "4E": "Norvege", "4F": "Roumanie",
  // Ukraine
  "50": "Ukraine",
  // Russia (150000-155FFF primary range)
  "15": "Russie",
  // USA (A00000-AFFFFF)
  "A0": "USA", "A1": "USA", "A2": "USA", "A3": "USA",
  "A4": "USA", "A5": "USA", "A6": "USA", "A7": "USA",
  "A8": "USA", "A9": "USA", "AA": "USA", "AB": "USA",
  "AC": "USA", "AD": "USA", "AE": "USA", "AF": "USA",
  // Canada
  "C0": "Canada", "C1": "Canada", "C2": "Canada", "C3": "Canada",
  // China (780000-7BFFFF)
  "78": "Chine", "79": "Chine", "7A": "Chine", "7B": "Chine",
  // Australia (7C0000-7FFFFF)
  "7C": "Australie", "7D": "Australie", "7E": "Australie",
  // India (800000-83FFFF)
  "80": "Inde", "81": "Inde", "82": "Inde", "83": "Inde",
  // Japan (840000-87FFFF)
  "84": "Japon", "85": "Japon", "86": "Japon", "87": "Japon",
  // Thailand (880-887)
  "88": "Thailande",
  // South Korea (890-893 additional range)
  "89": "Coree du Sud",
  // Iran
  "74": "Iran",
  // Egypt (0A0-0A7)
  "0A": "Egypte",
  // Morocco (0C0-0C4)
  "0C": "Maroc",
  // Algeria (010-017)
  "01": "Algerie",
  // Brazil
  "E0": "Bresil", "E1": "Bresil", "E2": "Bresil", "E3": "Bresil",
  // Argentina
  "E4": "Argentine",
  // Colombia
  "E8": "Colombie",
  // Mexico
  "0D": "Mexique",
};

const ICAO_COUNTRIES_1: Record<string, string> = {
  "A": "USA",
};

export function getCountryFromHex(hex: string): string | null {
  const upper = hex.toUpperCase();
  return ICAO_COUNTRIES_3[upper.substring(0, 3)]
    || ICAO_COUNTRIES_2[upper.substring(0, 2)]
    || ICAO_COUNTRIES_1[upper.substring(0, 1)]
    || null;
}

/** Derive country from operator name when ICAO mapping fails */
function getCountryFromOperator(operator: string): string | null {
  const op = operator.toLowerCase();
  if (/united states|us navy|us army|us air force|usaf|usmc/.test(op)) return "USA";
  if (/royal air force|raf|royal navy/.test(op)) return "Royaume-Uni";
  if (/armee de l.air|french|marine nationale/.test(op)) return "France";
  if (/luftwaffe|german/.test(op)) return "Allemagne";
  if (/aeronautica militare|italian/.test(op)) return "Italie";
  if (/ejercito del aire|spanish/.test(op)) return "Espagne";
  if (/canadian|forces canadiennes/.test(op)) return "Canada";
  if (/raaf|australian/.test(op)) return "Australie";
  if (/nato|otan/.test(op)) return "OTAN";
  if (/turkish/.test(op)) return "Turquie";
  if (/swedish/.test(op)) return "Suede";
  if (/norwegian/.test(op)) return "Norvege";
  if (/polish/.test(op)) return "Pologne";
  if (/indian/.test(op)) return "Inde";
  if (/israeli|idf/.test(op)) return "Israel";
  if (/saudi/.test(op)) return "Arabie Saoudite";
  if (/korean/.test(op)) return "Coree du Sud";
  if (/japanese|jasdf|jmsdf/.test(op)) return "Japon";
  return null;
}

function parseAircraft(ac: AirplanesLiveAircraft): Aircraft | null {
  if (ac.lat === undefined || ac.lon === undefined) return null;

  const isOnGround = ac.alt_baro === "ground";
  const altitudeMeters = typeof ac.alt_baro === "number"
    ? ac.alt_baro * FEET_TO_METERS
    : null;

  const hexCountry = getCountryFromHex(ac.hex);
  const operatorCountry = ac.ownOp ? getCountryFromOperator(ac.ownOp) : null;

  return {
    icao24: ac.hex,
    callsign: ac.flight?.trim() || null,
    registration: ac.r || null,
    aircraftType: ac.t || null,
    description: ac.desc || null,
    operator: ac.ownOp || null,
    originCountry: hexCountry || operatorCountry,
    latitude: ac.lat,
    longitude: ac.lon,
    altitude: altitudeMeters,
    velocity: ac.gs ? ac.gs * KNOTS_TO_MS : null,
    heading: ac.track ?? null,
    verticalRate: ac.baro_rate ? ac.baro_rate * FPM_TO_MS : null,
    onGround: isOnGround,
    isMilitary: (ac.dbFlags ?? 0) & 1 ? true : false,
    squawk: ac.squawk || null,
    lastSeen: ac.seen ?? 0,
  };
}

export async function fetchMilitaryAircraft(): Promise<Aircraft[]> {
  const response = await fetch(`${API_BASE_URL}/mil`, {
    next: { revalidate: 1 },
  });

  if (!response.ok) {
    throw new Error(`Airplanes.live API error: ${response.status}`);
  }

  const data: AirplanesLiveResponse = await response.json();

  if (!data.ac) return [];

  return data.ac
    .map(parseAircraft)
    .filter((a): a is Aircraft => a !== null && !a.onGround);
}
