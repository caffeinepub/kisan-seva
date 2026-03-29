export interface ParsedVoiceData {
  partyName?: string;
  partyId?: string;
  serviceType?: string;
  hours?: number;
  minutes?: number;
  amount?: number;
  paymentType?: "cash" | "upi";
  notes?: string;
}

// Number word mapping (Hindi + Gujarati)
const numberWords: Record<string, number> = {
  ek: 1,
  એક: 1,
  एक: 1,
  one: 1,
  do: 2,
  બે: 2,
  दो: 2,
  two: 2,
  teen: 3,
  ત્રણ: 3,
  तीन: 3,
  three: 3,
  char: 4,
  ચાર: 4,
  चार: 4,
  four: 4,
  panch: 5,
  પાંચ: 5,
  पांच: 5,
  five: 5,
  chhe: 6,
  છ: 6,
  छह: 6,
  six: 6,
  saat: 7,
  સાત: 7,
  सात: 7,
  seven: 7,
  aath: 8,
  આઠ: 8,
  आठ: 8,
  eight: 8,
  nau: 9,
  નવ: 9,
  नौ: 9,
  nine: 9,
  das: 10,
  દસ: 10,
  दस: 10,
  ten: 10,
};

function resolveNumber(word: string): number | null {
  const n = Number(word);
  if (!Number.isNaN(n)) return n;
  const lower = word.toLowerCase();
  return numberWords[lower] ?? numberWords[word] ?? null;
}

// Service keyword map
const serviceKeywords: Record<string, string[]> = {
  Khed: ["khed", "ખેડ", "खेड", "kheti", "ખેતી", "खेती", "ploughing", "plough"],
  Trolly: ["trolly", "trolley", "ट्रोली", "ટ્રોલી", "troli"],
  Vavni: ["vavni", "વાવણી", "वावनी", "vavani", "biyaran", "planting"],
  Rotavator: ["rotavator", "rotavater", "રોટાવેટર", "रोटावेटर"],
  Leveling: ["leveling", "levelling", "level", "leveler", "સમતળ", "समतल"],
};

function detectService(
  text: string,
  savedServices: string[],
): string | undefined {
  const lower = text.toLowerCase();

  // Try saved service names first (exact/partial match)
  for (const svc of savedServices) {
    if (lower.includes(svc.toLowerCase())) return svc;
  }

  // Fall back to keyword map
  for (const [serviceName, keywords] of Object.entries(serviceKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return serviceName;
    }
  }
  return undefined;
}

function detectHours(text: string): number | undefined {
  // Pattern: "2 ghanta", "2 kалак", "2 hour", "ek ghanta"
  const hourPatterns = [
    /([\d]+)\s*(?:ghanta|ghante|kal[aа]k|hour|hr|כلاک|घंटा|घंटे|કલાક)/gi,
    /(ek|do|teen|char|panch|chhe|saat|aath|nau|das|one|two|three|four|five|six|seven|eight|nine|ten|એક|બે|ત્રણ|ચાર|પાંચ|છ|સાત|આઠ|નવ|એ|एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)\s*(?:ghanta|ghante|kalaak|kalak|hour|hr|घंटा|घंटे|કল)\b/gi,
  ];

  for (const pattern of hourPatterns) {
    const match = pattern.exec(text);
    if (match) {
      const val = resolveNumber(match[1]);
      if (val !== null) return val;
    }
  }
  return undefined;
}

function detectMinutes(text: string): number | undefined {
  const minPatterns = [
    /([\d]+)\s*(?:minute|minutes|min|minat|minit|मिनट|मिनिट|મિનિટ)/gi,
    /(ek|do|teen|char|panch|chhe|saat|aath|nau|das|one|two|three|four|five|ten|fifteen|twenty|thirty|forty|fifty|एक|दो|तीन|चार|पांच|एक|बे)\s*(?:minute|min|minat|मिनट|મिनिट)/gi,
  ];

  for (const pattern of minPatterns) {
    const match = pattern.exec(text);
    if (match) {
      const val = resolveNumber(match[1]);
      if (val !== null) return val;
    }
  }
  return undefined;
}

function detectAmount(text: string): number | undefined {
  // "500 rupee", "rupiye 500", "₹500", "500 rs"
  const patterns = [
    /₹\s*([\d,]+)/,
    /([\d,]+)\s*(?:rupee|rupees|rupiya|rupaiya|rs|रुपये|रुपया|રૂ|₹)/i,
    /(?:rupee|rupees|rupiya|rupaiya|rs|रुपये|रुपया|રૂ)\s*([\d,]+)/i,
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) {
      const val = Number(m[1].replace(/,/g, ""));
      if (!Number.isNaN(val)) return val;
    }
  }
  return undefined;
}

function detectPaymentType(text: string): "cash" | "upi" | undefined {
  const lower = text.toLowerCase();
  if (/\bupi\b|yupi|yupiai|googlepay|phonepe|paytm|online/.test(lower))
    return "upi";
  if (/\bcash\b|nakit|nakad|nakdi|naqdii|कैश|नकद|кеш|кэш|cash|кеш/.test(lower))
    return "cash";
  return undefined;
}

function detectPartyName(
  text: string,
  savedParties: { id: string; name: string }[],
): { name: string; id?: string } | undefined {
  const lower = text.toLowerCase();

  // Try fuzzy match against saved parties
  for (const party of savedParties) {
    const pLower = party.name.toLowerCase();
    if (lower.includes(pLower)) {
      return { name: party.name, id: party.id };
    }
  }

  // Pattern: "Ramesh ne", "Ramesh ka", "Ramesh bhai", "party Ramesh"
  const namePatterns = [
    /(?:party\s+)(\w+)/i,
    /(\w+)\s+(?:ne|ka|ki|ko|bhai|ben|bhai|ni|nu)/i,
  ];

  for (const pattern of namePatterns) {
    const match = pattern.exec(text);
    if (match) {
      const candidate = match[1];
      // skip common words
      const skip = [
        "khed",
        "trolly",
        "seva",
        "service",
        "payment",
        "cash",
        "upi",
        "ghanta",
        "minute",
        "ek",
        "do",
      ];
      if (!skip.includes(candidate.toLowerCase())) {
        // Try to find in saved parties via startsWith
        const found = savedParties.find((p) =>
          p.name.toLowerCase().startsWith(candidate.toLowerCase()),
        );
        if (found) return { name: found.name, id: found.id };
        return { name: candidate };
      }
    }
  }
  return undefined;
}

export function parseVoiceTranscript(
  transcript: string,
  savedParties: { id: string; name: string }[],
  savedServiceNames: string[] = [],
): ParsedVoiceData {
  const result: ParsedVoiceData = {};

  const party = detectPartyName(transcript, savedParties);
  if (party) {
    result.partyName = party.name;
    if (party.id) result.partyId = party.id;
  }

  const service = detectService(transcript, savedServiceNames);
  if (service) result.serviceType = service;

  const hours = detectHours(transcript);
  if (hours !== undefined) result.hours = hours;

  const minutes = detectMinutes(transcript);
  if (minutes !== undefined) result.minutes = minutes;

  const amount = detectAmount(transcript);
  if (amount !== undefined) result.amount = amount;

  const paymentType = detectPaymentType(transcript);
  if (paymentType) result.paymentType = paymentType;

  // Notes: anything after "note:" / "notes:"
  const notesMatch = /(?:note[s]?[:।]\s*)(.+)/i.exec(transcript);
  if (notesMatch) result.notes = notesMatch[1].trim();

  return result;
}
