export type BirthLocation = {
  city?: string;
  state?: string;
  country?: string;
  latitude?: number | string;
  longitude?: number | string;
  timezone?: string;
};

export type BirthInput = BirthLocation & {
  date?: string;
  time?: string;
};

export type ChartPosition = {
  sign: string;
  degree: number;
  longitude: number;
  cusp: boolean;
  status: "ready" | "verify";
};

export type AstrologyChart = {
  system: "tropical";
  sun: ChartPosition;
  moon: ChartPosition;
  rising: ChartPosition;
  timezone: string;
  utc: string;
  julianDay: number;
};

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const SIGN_READINGS: Record<string, string> = {
  Aries: "direct, initiating, and motivated by movement",
  Taurus: "grounded, steady, and motivated by durable value",
  Gemini: "curious, adaptive, and motivated by exchange",
  Cancer: "protective, intuitive, and motivated by belonging",
  Leo: "expressive, generous, and motivated by meaningful visibility",
  Virgo: "discerning, useful, and motivated by refinement",
  Libra: "relational, composed, and motivated by balance",
  Scorpio: "intense, private, and motivated by transformation",
  Sagittarius: "expansive, candid, and motivated by discovery",
  Capricorn: "structured, ambitious, and motivated by earned authority",
  Aquarius: "independent, future-facing, and motivated by better systems",
  Pisces: "imaginative, sensitive, and motivated by connection beyond the obvious",
};

const LUNAR_TERMS: Array<[number, number, number, number, number]> = [
  [0,0,1,0,6.288774],[2,0,-1,0,1.274027],[2,0,0,0,.658314],
  [0,0,2,0,.213618],[0,1,0,0,-.185116],[0,0,0,2,-.114332],
  [2,0,-2,0,.058793],[2,-1,-1,0,.057066],[2,0,1,0,.053322],
  [2,-1,0,0,.045758],[0,1,-1,0,-.040923],[1,0,0,0,-.03472],
  [0,1,1,0,-.030383],[2,0,0,-2,.015327],[0,0,1,2,-.012528],
  [0,0,1,-2,.01098],[4,0,-1,0,.010675],[0,0,3,0,.010034],
  [4,0,-2,0,.008548],[2,1,-1,0,-.007888],[2,1,0,0,-.006766],
  [1,0,-1,0,-.005163],[1,1,0,0,.004987],[2,-1,1,0,.004036],
  [2,0,2,0,.003994],[4,0,0,0,.003861],[2,0,-3,0,.003665],
];

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const degrees = (radiansValue: number) => (radiansValue * 180) / Math.PI;
const normalize = (value: number) => ((value % 360) + 360) % 360;

function localTimeToUtc(input: BirthInput) {
  if (!input.date || !input.time || !input.timezone) return null;
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  const targetWall = Date.UTC(year, month - 1, day, hour, minute);
  let guess = targetWall;
  for (let index = 0; index < 2; index += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: input.timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const record = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const renderedWall = Date.UTC(
      Number(record.year), Number(record.month) - 1, Number(record.day),
      Number(record.hour), Number(record.minute), Number(record.second),
    );
    guess -= renderedWall - targetWall;
  }
  return new Date(guess);
}

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function sunLongitude(t: number) {
  const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  const m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  const c = (1.914602 - 0.004817 * t) * Math.sin(radians(m))
    + 0.019993 * Math.sin(radians(2 * m))
    + 0.000289 * Math.sin(radians(3 * m));
  const omega = 125.04 - 1934.136 * t;
  return normalize(l0 + c - 0.00569 - 0.00478 * Math.sin(radians(omega)));
}

function moonLongitude(t: number) {
  const lp = normalize(218.3164477 + 481267.88123421 * t);
  const d = normalize(297.8501921 + 445267.1114034 * t);
  const m = normalize(357.5291092 + 35999.0502909 * t);
  const mp = normalize(134.9633964 + 477198.8675055 * t);
  const f = normalize(93.272095 + 483202.0175233 * t);
  const e = 1 - 0.002516 * t - 0.0000074 * t * t;
  let correction = 0;
  for (const [dTerm, mTerm, mpTerm, fTerm, coefficient] of LUNAR_TERMS) {
    correction += coefficient * Math.pow(e, Math.abs(mTerm)) * Math.sin(
      radians(dTerm * d + mTerm * m + mpTerm * mp + fTerm * f),
    );
  }
  const a1 = normalize(119.75 + 131.849 * t);
  const a2 = normalize(53.09 + 479264.29 * t);
  correction += 0.003958 * Math.sin(radians(a1));
  correction += 0.001962 * Math.sin(radians(lp - f));
  correction += 0.000318 * Math.sin(radians(a2));
  return normalize(lp + correction);
}

function risingLongitude(jd: number, t: number, latitude: number, longitude: number) {
  const epsilon = 23.439291 - 0.0130042 * t - 0.00000016 * t * t + 0.0000005 * t * t * t;
  const gmst = normalize(280.46061837 + 360.98564736629 * (jd - 2451545)
    + 0.000387933 * t * t - (t * t * t) / 38710000);
  const ramc = normalize(gmst + longitude);
  return normalize(degrees(Math.atan2(
    Math.cos(radians(ramc)),
    -(Math.sin(radians(ramc)) * Math.cos(radians(epsilon))
      + Math.tan(radians(latitude)) * Math.sin(radians(epsilon))),
  )));
}

function position(longitude: number): ChartPosition {
  const normalized = normalize(longitude);
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized - signIndex * 30;
  const cusp = degree < 1 || degree > 29;
  return {
    sign: SIGNS[signIndex], degree: Math.round(degree * 100) / 100,
    longitude: Math.round(normalized * 1000) / 1000,
    cusp, status: cusp ? "verify" : "ready",
  };
}

export function calculateAstrology(input: BirthInput, ayanamsa = 0): AstrologyChart | null {
  const utc = localTimeToUtc(input);
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!utc || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !input.timezone) return null;
  const jd = julianDay(utc);
  const t = (jd - 2451545) / 36525;
  return {
    system: "tropical",
    sun: position(sunLongitude(t) - ayanamsa),
    moon: position(moonLongitude(t) - ayanamsa),
    rising: position(risingLongitude(jd, t, latitude, longitude) - ayanamsa),
    timezone: input.timezone,
    utc: utc.toISOString(),
    julianDay: Math.round(jd * 100000) / 100000,
  };
}

export function elementForSign(sign?: string | null) {
  return sign ? SIGN_ELEMENTS[sign] ?? null : null;
}

export function explainPosition(kind: "sun" | "moon" | "rising", sign: string) {
  const meaning = SIGN_READINGS[sign] ?? "distinctive in the way it meets the world";
  if (kind === "sun") return `Your Sun in ${sign} describes the identity you are learning to inhabit: ${meaning}.`;
  if (kind === "moon") return `Your Moon in ${sign} describes your emotional processing and private needs: ${meaning}.`;
  return `Your ${sign} Rising describes the first signal people receive and the way you enter a room: ${meaning}.`;
}
