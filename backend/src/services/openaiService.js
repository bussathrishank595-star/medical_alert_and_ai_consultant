import OpenAI from "openai";
import { MEDICINE_CATEGORIES } from "../models/Medicine.js";

let openaiClient;

const keywordMap = [
  { category: "Fever", terms: ["fever", "temperature", "pyrexia"] },
  { category: "Headache", terms: ["headache", "migraine", "head pain"] },
  { category: "Cold", terms: ["cold", "runny nose", "sneezing", "congestion"] },
  { category: "Cough", terms: ["cough", "throat", "sore throat"] },
  { category: "Diabetes", terms: ["diabetes", "glucose", "blood sugar", "sugar", "insulin"] },
  { category: "Blood Pressure", terms: ["blood pressure", "hypertension", "bp"] },
  { category: "Vitamin", terms: ["vitamin", "supplement", "deficiency"] },
  { category: "Pain Relief", terms: ["pain", "ache", "inflammation", "analgesic", "hurt", "hurts", "hurting"] },
  { category: "Skin Care", terms: ["skin", "rash", "itch", "acne", "cream"] },
  { category: "Antibiotic", terms: ["antibiotic", "infection", "bacterial"] }
];

const medicineNameHints = [
  {
    category: "Fever",
    terms: ["paracetamol", "acetaminophen", "dolo", "crocin", "calpol", "tylenol"],
    symptoms: ["fever", "headache"],
    usage: "Helps reduce fever and lower body temperature."
  },
  {
    category: "Cold",
    terms: ["sinarest", "coldact", "sudafed", "nasivion", "vicks action 500", "decolgen", "respifed"],
    symptoms: ["cold", "congestion", "sneezing", "runny nose"],
    usage: "Helps relieve cold symptoms such as congestion and sneezing."
  },
  {
    category: "Cough",
    terms: ["ascoril", "grilinctus", "benadryl", "dextromethorphan", "tussi", "cough syrup"],
    symptoms: ["cough", "throat irritation"],
    usage: "Helps soothe cough and throat irritation."
  },
  {
    category: "Pain Relief",
    terms: ["combiflam", "ibuprofen", "diclofenac", "nimesulide", "meftal", "aceclofenac", "ear pain", "earache"],
    symptoms: ["pain", "ache", "inflammation"],
    usage: "Helps relieve mild to moderate pain."
  },
  {
    category: "Vitamin",
    terms: ["becosules", "zincovit", "neurobion", "revital", "multivitamin"],
    symptoms: ["vitamin", "supplement", "deficiency"],
    usage: "Used as a vitamin supplement to support nutritional needs."
  },
  {
    category: "Antibiotic",
    terms: ["azithromycin", "amoxicillin", "augmentin", "cefixime", "ciprofloxacin", "levofloxacin"],
    symptoms: ["infection", "bacterial"],
    usage: "Used as prescribed to treat bacterial infections."
  },
  {
    category: "Blood Pressure",
    terms: ["amlodipine", "telmisartan", "losartan", "atenolol", "metoprolol", "olmesartan"],
    symptoms: ["blood pressure", "hypertension"],
    usage: "Used as prescribed to help manage blood pressure."
  },
  {
    category: "Diabetes",
    terms: ["metformin", "glimepiride", "gliclazide", "insulin", "dapagliflozin", "sitagliptin"],
    symptoms: ["blood sugar", "diabetes"],
    usage: "Used as prescribed to help manage blood sugar."
  },
  {
    category: "Skin Care",
    terms: ["clotrimazole", "mupirocin", "calamine", "benzoyl peroxide", "hydrocortisone", "terbinafine"],
    symptoms: ["skin", "rash", "itch", "acne"],
    usage: "Used for skin irritation, rash, or acne as directed."
  }
];

const generalConversationTerms = [
  "hi",
  "hii",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "thanks",
  "thank you",
  "ok",
  "okay",
  "bye",
  "goodbye"
];

const referenceMedicineDirectory = {
  Fever: [
    {
      name: "Paracetamol 500mg",
      usage: "Commonly used to reduce fever and relieve mild pain.",
      precautions: "Follow the label dose and seek medical advice if fever persists."
    }
  ],
  Headache: [
    {
      name: "Paracetamol 500mg",
      usage: "Commonly used for headache relief.",
      precautions: "Do not exceed the recommended dose and consult a doctor if headaches are severe or frequent."
    }
  ],
  Cold: [
    {
      name: "Cetirizine 10mg",
      usage: "May help with sneezing or runny nose from common cold or allergy symptoms.",
      precautions: "Can cause drowsiness; follow pharmacist or label instructions."
    }
  ],
  Cough: [
    {
      name: "Dextromethorphan syrup",
      usage: "May help soothe a dry cough.",
      precautions: "Use only as directed and seek medical advice if cough lasts more than a few days."
    }
  ],
  "Pain Relief": [
    {
      name: "Paracetamol 500mg",
      usage: "Commonly used for mild pain and fever.",
      precautions: "Avoid taking extra paracetamol from other products and follow the label instructions."
    },
    {
      name: "Ibuprofen 200mg",
      usage: "Used for short-term relief of pain and inflammation.",
      precautions: "Take with food and avoid if a doctor has told you not to use NSAIDs."
    }
  ],
  Vitamin: [
    {
      name: "Multivitamin tablets",
      usage: "May support general nutritional needs.",
      precautions: "Use only as directed and keep within the recommended daily dose."
    }
  ],
  "Skin Care": [
    {
      name: "Calamine lotion",
      usage: "May help soothe mild skin irritation or itching.",
      precautions: "For external use only and follow the product directions."
    }
  ],
  Other: []
};

const medicalConcernTerms = [
  "cancer",
  "tumor",
  "tumour",
  "asthma",
  "stroke",
  "heart attack",
  "heart failure",
  "kidney",
  "liver",
  "hepatitis",
  "epilepsy",
  "seizure",
  "anemia",
  "pregnancy",
  "ulcer",
  "thyroid",
  "hiv",
  "aids",
  "tb",
  "tuberculosis",
  "arthritis",
  "depression",
  "anxiety"
];

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const compactText = (value) => normalizeText(value).replace(/[^a-z0-9]+/g, "");

const levenshteinDistance = (left, right) => {
  const a = compactText(left);
  const b = compactText(right);

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const previousRow = Array.from({ length: b.length + 1 }, (_value, index) => index);
  for (let rowIndex = 1; rowIndex <= a.length; rowIndex += 1) {
    const currentRow = [rowIndex];

    for (let columnIndex = 1; columnIndex <= b.length; columnIndex += 1) {
      const substitutionCost = a[rowIndex - 1] === b[columnIndex - 1] ? 0 : 1;
      currentRow[columnIndex] = Math.min(
        currentRow[columnIndex - 1] + 1,
        previousRow[columnIndex] + 1,
        previousRow[columnIndex - 1] + substitutionCost
      );
    }

    previousRow.splice(0, previousRow.length, ...currentRow);
  }

  return previousRow[b.length];
};

const nameSimilarity = (left, right) => {
  const a = compactText(left);
  const b = compactText(right);
  const longestLength = Math.max(a.length, b.length);

  if (!longestLength) {
    return 1;
  }

  return 1 - levenshteinDistance(a, b) / longestLength;
};

const isSameMedicine = (left, right) => {
  const leftName = left?.name || "";
  const rightName = right?.name || "";
  const leftCategory = normalizeText(left?.category || left?.aiClassification?.category || "");
  const rightCategory = normalizeText(right?.category || right?.aiClassification?.category || "");

  const sameCategory = !leftCategory || !rightCategory || leftCategory === rightCategory;
  return sameCategory && nameSimilarity(leftName, rightName) >= 0.82;
};

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openaiClient;
};

const normalizeCategory = (category) => {
  const match = MEDICINE_CATEGORIES.find((item) => item.toLowerCase() === String(category || "").toLowerCase());
  return match || "Other";
};

const tokenizeMessage = (message) =>
  new Set(
    normalizeText(message)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2)
  );

const getMedicineKey = (medicine) =>
  [medicine.name, medicine.manufacturer, medicine.category].map(normalizeText).filter(Boolean).join("|");

const dedupeMedicines = (medicines) => {
  const chosen = new Map();

  medicines.forEach((medicine) => {
    const currentStock = Number(medicine.stock) || 0;
    const currentUpdatedAt = new Date(medicine.updatedAt || medicine.createdAt || 0).getTime();
    const existingEntry = [...chosen.entries()].find(([, existingMedicine]) => isSameMedicine(existingMedicine, medicine));

    if (!existingEntry) {
      chosen.set(getMedicineKey(medicine) || `${compactText(medicine.name)}-${medicine._id}`, medicine);
      return;
    }

    const [existingKey, existing] = existingEntry;
    const existingStock = Number(existing.stock) || 0;
    const existingUpdatedAt = new Date(existing.updatedAt || existing.createdAt || 0).getTime();

    if (currentStock > existingStock || (currentStock === existingStock && currentUpdatedAt > existingUpdatedAt)) {
      chosen.set(existingKey, medicine);
    }
  });

  return [...chosen.values()];
};

const escapeXml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toDataUrl = (base64) => `data:image/png;base64,${base64}`;

const extractSymptoms = (text) => {
  const haystack = text.toLowerCase();
  const symptoms = new Set();

  keywordMap.forEach(({ terms }) => {
    terms.forEach((term) => {
      if (haystack.includes(term)) {
        symptoms.add(term);
      }
    });
  });

  return [...symptoms].slice(0, 8);
};

const findMedicineHint = (text) => {
  const haystack = text.toLowerCase();
  return medicineNameHints.find(({ terms }) => terms.some((term) => haystack.includes(term))) || null;
};

const findKeywordMatch = (text) => {
  const haystack = text.toLowerCase();
  const hint = findMedicineHint(haystack);
  const match = keywordMap.find(({ terms }) => terms.some((term) => haystack.includes(term)));
  const category = hint?.category || match?.category || "Other";
  const symptoms = Array.from(
    new Set([...(hint?.symptoms || []), ...extractSymptoms(haystack)])
  ).slice(0, 8);

  return { category, symptoms, usage: hint?.usage || "" };
};

const hasMedicineRequestSignal = (message) => {
  const normalized = normalizeText(message);
  if (!normalized) {
    return false;
  }

  const { category, symptoms } = findKeywordMatch(normalized);
  if (category !== "Other" || symptoms.length) {
    return true;
  }

  const medicineHint = findMedicineHint(normalized);
  if (medicineHint) {
    return true;
  }

  return /\b(medicine|tablet|pill|syrup|dose|dosage|mg|ml|symptom|fever|headache|cold|cough|pain|rash|itch|diabetes|pressure|infection|allergy|vomit|nausea|dizziness)\b/.test(normalized);
};

const hasMedicalConcernSignal = (message) => {
  const normalized = normalizeText(message);
  if (!normalized) {
    return false;
  }

  if (medicalConcernTerms.some((term) => normalized.includes(term))) {
    return true;
  }

  if (/\bchest\b/.test(normalized) && /\b(pain|tightness|pressure|hurt|hurts|hurting)\b/.test(normalized)) {
    return true;
  }

  if (/\b(shortness of breath|difficulty breathing|trouble breathing|breathless|fainting|passed out)\b/.test(normalized)) {
    return true;
  }

  return /\b(i have|i've|i am having|i'm having|suffering from|diagnosed with|doctor said|prescribed for|diagnosed)\b/.test(normalized) &&
    /\b(cancer|tumou?r|asthma|stroke|heart attack|heart failure|kidney|liver|hepatitis|epilepsy|seizure|anemia|pregnancy|ulcer|thyroid|hiv|aids|tb|tuberculosis|arthritis|depression|anxiety|diabetes|hypertension|blood pressure|infection)\b/.test(normalized);
};

const detectAssistantIntent = (message) => {
  const normalized = normalizeText(message);

  if (!normalized) {
    return "general";
  }

  const isGeneralGreeting = generalConversationTerms.some((term) =>
    normalized === term || normalized.startsWith(`${term} `) || normalized.endsWith(` ${term}`) || normalized.includes(` ${term} `)
  );

  if (isGeneralGreeting && !hasMedicineRequestSignal(normalized) && !hasMedicalConcernSignal(normalized)) {
    return "general";
  }

  if (hasMedicalConcernSignal(normalized)) {
    return "medical";
  }

  if (hasMedicineRequestSignal(normalized)) {
    return "medicine";
  }

  return "health";
};

const scoreMedicineForTokens = (tokens, medicine) => {
  const fields = [
    medicine.name,
    medicine.category,
    medicine.description,
    medicine.manufacturer,
    ...(medicine.symptoms || []),
    ...(medicine.aiClassification?.symptoms || [])
  ]
    .join(" ")
    .toLowerCase();

  return [...tokens].reduce((total, token) => total + (fields.includes(token) ? 1 : 0), 0);
};

const isGenericUsage = (usage) => {
  const normalized = String(usage || "").trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const genericPatterns = [
    /^use as directed\b/,
    /^used as directed\b/,
    /^consult (a )?(doctor|pharmacist|healthcare professional)\b/,
    /^consult your (doctor|pharmacist|healthcare professional)\b/,
    /^follow label instructions\b/,
    /^follow the label\b/,
    /^other\b/,
    /^helps relieve other\b/,
    /^helps manage other\b/,
    /^general symptom relief\b/,
    /^symptom relief\b/,
    /^for symptom relief\b/,
    /^for use only\b/,
    /^not enough information\b/
  ];

  return genericPatterns.some((pattern) => pattern.test(normalized));
};

const buildUsageText = (_name, category) => {
  const categoryUsage = {
    Headache: "Helps relieve headaches and migraine discomfort.",
    Fever: "Helps reduce fever and lower body temperature.",
    Cold: "Helps relieve cold symptoms such as congestion and sneezing.",
    Cough: "Helps soothe cough and throat irritation.",
    Diabetes: "Used as prescribed to help manage blood sugar.",
    "Blood Pressure": "Used as prescribed to help manage blood pressure.",
    Vitamin: "Used as a vitamin supplement to support nutritional needs.",
    "Pain Relief": "Helps relieve mild to moderate pain.",
    "Skin Care": "Used for skin irritation, rash, or acne as directed.",
    Antibiotic: "Used as prescribed to treat bacterial infections.",
    Other: "Use as directed by a qualified healthcare professional."
  };

  return categoryUsage[category] || categoryUsage.Other;
};

const buildDescriptionText = (name, manufacturer, category, symptoms) => {
  const symptomText = symptoms.length ? symptoms.slice(0, 3).join(", ") : category.toLowerCase();
  const brandText = manufacturer ? `manufactured by ${manufacturer}` : "in pharmacy inventory";
  return `${name} is a ${category.toLowerCase()} medicine ${brandText}. It is commonly associated with ${symptomText} and is intended to be used as directed by a qualified healthcare professional.`;
};

const buildImagePrompt = (name, category, manufacturer) =>
  `Create a clean, realistic product-style medical image of ${name}${manufacturer ? ` by ${manufacturer}` : ""}. It should look like a pharmacy inventory product photo or illustration, isolated on a light background, with no human subjects, no watermark, and no visible brand labels.`;

const buildFallbackImageDataUrl = ({ name, category }) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff6ff" />
          <stop offset="100%" stop-color="#ecfdf5" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="56" fill="url(#bg)" />
      <rect x="220" y="240" width="584" height="544" rx="48" fill="#ffffff" stroke="#dbeafe" stroke-width="8" />
      <circle cx="512" cy="390" r="88" fill="#dbeafe" />
      <rect x="470" y="316" width="84" height="148" rx="30" fill="#2563eb" />
      <rect x="388" y="392" width="248" height="84" rx="30" fill="#10b981" />
      <text x="512" y="610" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#0f172a">${escapeXml(name)}</text>
      <text x="512" y="676" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#475569">${escapeXml(category || "Other")}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const fallbackProfile = ({ name, manufacturer, descriptionHint }) => {
  const text = `${name} ${manufacturer || ""} ${descriptionHint || ""}`.toLowerCase();
  const { category, symptoms, usage: usageHint } = findKeywordMatch(text);
  const usage = !isGenericUsage(usageHint) ? usageHint : buildUsageText(name, category, symptoms);
  const description = descriptionHint?.trim() || buildDescriptionText(name, manufacturer, category, symptoms);
  const warnings = "Follow label instructions and consult a doctor or pharmacist when symptoms persist.";

  return {
    category,
    symptoms,
    description,
    usage,
    warnings,
    imagePrompt: buildImagePrompt(name, category, manufacturer),
    raw: { source: "local-fallback" }
  };
};

const parseJson = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  }
};

export const buildMedicineProfile = async ({ name, manufacturer, descriptionHint }) => {
  const client = getOpenAIClient();

  if (!client) {
    return fallbackProfile({ name, manufacturer, descriptionHint });
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You classify medicines for inventory metadata and also generate a concise inventory description. Return only valid JSON with category, symptoms, description, usage, warnings, and imagePrompt. Use category only from: Headache, Fever, Cold, Cough, Diabetes, Blood Pressure, Vitamin, Pain Relief, Skin Care, Antibiotic, Other. The description must be 1 to 2 short sentences, neutral, and suitable for a pharmacy inventory card. The usage must be a specific, conservative one-sentence common-use summary. If the medicine is a branded or combination OTC product, infer the most likely common use from the medicine name and manufacturer. Avoid vague output such as 'other', 'general symptom relief', or 'use as directed' unless there is truly no safe inference. The imagePrompt must describe a clean product-style medicine image on a light background, with no people, no watermark, and no visible labels."
        },
        {
          role: "user",
          content: `Analyze this medicine and classify it.\nMedicine Name: ${name}\nManufacturer: ${manufacturer || "Unknown"}\nAdditional Notes: ${descriptionHint || "None"}\nReturn JSON: {"category":"","symptoms":[""],"description":"","usage":"","warnings":"","imagePrompt":""}`
        }
      ],
      temperature: 0.2
    });

    const parsed = parseJson(completion.choices[0]?.message?.content || "{}");

    if (!parsed) {
      return fallbackProfile({ name, manufacturer, descriptionHint });
    }

    const fallback = fallbackProfile({ name, manufacturer, descriptionHint });
    const category = normalizeCategory(parsed.category);
    const resolvedCategory = category === "Other" && fallback.category !== "Other" ? fallback.category : category;
    const parsedSymptoms = Array.isArray(parsed.symptoms)
      ? parsed.symptoms.map((item) => String(item).toLowerCase()).filter(Boolean)
      : [];
    const symptoms = parsedSymptoms.length ? parsedSymptoms : fallback.symptoms;
    const usage = !isGenericUsage(parsed.usage) ? String(parsed.usage).trim() : fallback.usage;

    return {
      category: resolvedCategory,
      symptoms,
      description: String(parsed.description || descriptionHint || buildDescriptionText(name, manufacturer, resolvedCategory, symptoms)).trim() || buildDescriptionText(name, manufacturer, resolvedCategory, symptoms),
      usage: usage || buildUsageText(name, resolvedCategory, symptoms),
      warnings: String(parsed.warnings || fallback.warnings).trim() || fallback.warnings,
      imagePrompt: String(parsed.imagePrompt || buildImagePrompt(name, resolvedCategory, manufacturer)).trim() || buildImagePrompt(name, resolvedCategory, manufacturer),
      raw: parsed
    };
  } catch (error) {
    const fallback = fallbackProfile({ name, manufacturer, descriptionHint });
    fallback.raw = { source: "local-fallback", openaiError: error.message };
    return fallback;
  }
};

export const generateMedicineImage = async ({ name, category, manufacturer, imagePrompt }) => {
  const client = getOpenAIClient();
  const prompt =
    imagePrompt ||
    buildImagePrompt(name, category || "Other", manufacturer);

  if (!client) {
    return buildFallbackImageDataUrl({ name, category });
  }

  try {
    const response = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
      quality: "standard"
    });

    const generated = response.data?.[0];
    if (generated?.b64_json) {
      return toDataUrl(generated.b64_json);
    }

    if (generated?.url) {
      return generated.url;
    }
  } catch (error) {
    console.error("Image generation failed:", error.message);
  }

  return buildFallbackImageDataUrl({ name, category });
};

export const classifyMedicine = async ({ name, description }) => {
  const profile = await buildMedicineProfile({ name, manufacturer: "", descriptionHint: description });
  return {
    category: profile.category,
    symptoms: profile.symptoms,
    usage: profile.usage,
    warnings: profile.warnings,
    raw: profile.raw
  };
};

export const findMatchingMedicines = (message, medicines) => {
  const tokens = tokenizeMessage(message);

  return dedupeMedicines(medicines)
    .map((medicine) => {
      const score = scoreMedicineForTokens(tokens, medicine);
      return { medicine, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ medicine }) => medicine);
};

export const findAlternativeMedicines = (message, medicines) => {
  const tokens = tokenizeMessage(message);
  const { category, symptoms } = findKeywordMatch(message);
  const preferredCategory = normalizeCategory(category);

  const ranked = dedupeMedicines(medicines)
    .map((medicine) => {
      const fields = [
        medicine.name,
        medicine.category,
        medicine.description,
        medicine.manufacturer,
        ...(medicine.symptoms || []),
        ...(medicine.aiClassification?.symptoms || []),
        medicine.aiClassification?.usage,
        medicine.aiClassification?.warnings
      ]
        .join(" ")
        .toLowerCase();

      const medicineName = compactText(medicine.name);
      const queryText = compactText(message);
      const medicineCategory = normalizeCategory(medicine.category || medicine.aiClassification?.category);
      const aiCategory = normalizeCategory(medicine.aiClassification?.category);
      const tokenHits = [...tokens].filter((token) => fields.includes(token) || medicineName.includes(token));
      const symptomHits = symptoms.filter((symptom) => fields.includes(symptom));

      let score = 0;
      let signals = 0;

      if (queryText && medicineName && (queryText.includes(medicineName) || medicineName.includes(queryText))) {
        score += 4;
        signals += 1;
      }

      if (preferredCategory !== "Other" && medicineCategory === preferredCategory) {
        score += 3;
        signals += 1;
      }

      if (preferredCategory !== "Other" && aiCategory === preferredCategory) {
        score += 2;
        signals += 1;
      }

      if (symptomHits.length) {
        score += symptomHits.length * 3;
        signals += symptomHits.length;
      }

      if (tokenHits.length) {
        score += Math.min(2, tokenHits.length);
        signals += 1;
      }

      return { medicine, score, signals };
    })
    .filter(({ score, signals }) => score >= 3 && signals > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const stockA = Number(a.medicine.stock) || 0;
      const stockB = Number(b.medicine.stock) || 0;
      return stockB - stockA;
    });

  return ranked.slice(0, 2).map(({ medicine }) => medicine);
};

export const findReferenceMedicines = (message) => {
  const { category } = findKeywordMatch(message);
  const normalizedCategory = normalizeCategory(category);
  const referenceCandidates = referenceMedicineDirectory[normalizedCategory] || referenceMedicineDirectory.Other || [];

  return referenceCandidates.map((medicine) => ({
    ...medicine,
    category: normalizedCategory,
    referenceOnly: true
  }));
};

const formatExactHealthResponse = (matches) => {
  const lines = matches.map((medicine) => {
    const usage = medicine.aiClassification?.usage || medicine.description;
    const precautions = medicine.aiClassification?.warnings || "Follow label directions and avoid self-medication.";
    return `Medicine Name: ${medicine.name}\nUsage: ${usage}\nPrecautions: ${precautions}`;
  });

  return `${lines.join("\n\n")}\n\nDisclaimer: Consult a doctor for serious symptoms.`;
};

const formatUnavailableHealthResponse = (alternatives) => {
  const lines = alternatives.length
    ? ["I couldn’t find the exact medicine in stock right now, but I found a closely relevant available option."]
    : ["The requested medicine is currently out of stock right now."];

  alternatives.slice(0, 2).forEach((medicine) => {
    const usage = medicine.aiClassification?.usage || medicine.description;
    const precautions = medicine.aiClassification?.warnings || "Follow label instructions and consult a doctor or pharmacist when symptoms persist.";
    lines.push(`Closest relevant option: ${medicine.name}\nUsage: ${usage}\nPrecautions: ${precautions}`);
  });

  lines.push("I’m informing the owner/admin now so it can be added within a few hours.");
  lines.push("If the symptoms are serious or getting worse, please come to the store or seek medical care.");
  lines.push("Admin reminder: Requested medicine is not available in current inventory.");

  return lines.join("\n\n");
};

const formatReferenceHealthResponse = (references) => {
  const lines = references.length
    ? ["I couldn’t find the exact medicine in stock right now, so here is a reference suggestion."]
    : ["The requested medicine is currently out of stock right now."];

  references.slice(0, 2).forEach((medicine) => {
    lines.push(`Reference suggestion: ${medicine.name}\nUsage: ${medicine.usage}\nPrecautions: ${medicine.precautions}`);
  });

  lines.push("I’m informing the owner/admin now so it can be added within a few hours.");
  lines.push("If the symptoms are serious or getting worse, please come to the store or seek medical care.");
  lines.push("Admin reminder: Requested medicine is not available in current inventory.");

  return lines.join("\n\n");
};

const formatClarificationResponse = () =>
  [
    "I can help with health-related questions, medicine names, symptoms, usage, or side effects.",
    "Please send a symptom or medicine name, for example: 'I have fever and headache' or 'Paracetamol 500mg'.",
    "If this is an emergency or severe symptom, please contact a doctor or visit the nearest clinic immediately."
  ].join("\n\n");

const formatMedicalConcernResponse = () =>
  [
    "I’m sorry you’re dealing with that.",
    "I can’t diagnose or prescribe treatment for serious conditions like cancer.",
    "Please contact a qualified doctor or specialist as soon as possible.",
    "If you want, I can still help you check supportive medicines in stock for symptoms, or explain medicines already in the inventory."
  ].join("\n\n");

export const generateHealthResponse = async ({ message, matchedMedicines, inventory = [] }) => {
  const client = getOpenAIClient();
  const intent = detectAssistantIntent(message);

  if (intent === "general") {
    return {
      response:
        "Hi! How can I help you today?\n\nYou can ask me about health symptoms, medicine availability, usage, or side effects. Please keep your question health-related.",
      suggestedMedicines: [],
      adminReminder: "",
      matchType: "General"
    };
  }

  if (intent === "medical") {
    return {
      response: formatMedicalConcernResponse(),
      suggestedMedicines: [],
      adminReminder: "",
      matchType: "Medical"
    };
  }

  const uniqueMatches = dedupeMedicines(matchedMedicines);

  if (!uniqueMatches.length) {
    if (!hasMedicineRequestSignal(message) && !hasMedicalConcernSignal(message)) {
      return {
        response: formatClarificationResponse(),
        suggestedMedicines: [],
        adminReminder: "",
        matchType: "General"
      };
    }

    const alternatives = findAlternativeMedicines(message, inventory).slice(0, 1);
    const references = alternatives.length ? [] : findReferenceMedicines(message).slice(0, 1);
    const suggestedMedicines = alternatives.length ? alternatives : references;
    const adminReminder = `Customer request needs restock follow-up: ${message}`;
    return {
      response: alternatives.length ? formatUnavailableHealthResponse(alternatives) : formatReferenceHealthResponse(references),
      suggestedMedicines,
      adminReminder,
      matchType: alternatives.length ? "Alternative" : references.length ? "Reference" : "Unavailable"
    };
  }

  const responseMedicines = uniqueMatches.map((medicine) => ({
    name: medicine.name,
    description: medicine.description,
    category: medicine.category,
    symptoms: medicine.symptoms,
    usage: medicine.aiClassification?.usage,
    warnings: medicine.aiClassification?.warnings,
    stock: medicine.stock
  }));

  if (!client) {
    return {
      response: formatExactHealthResponse(uniqueMatches),
      suggestedMedicines: uniqueMatches,
      adminReminder: "",
      matchType: "Exact"
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a healthcare assistant. Never diagnose diseases. Suggest only medicines explicitly included in the provided inventory. Recommend based on inventory symptoms. Mention each medicine at most once and do not repeat the same medicine. Always include Medicine Name, Usage, Precautions, and the disclaimer: Consult a doctor for serious symptoms. If the prompt says the exact medicine is unavailable, recommend the closest available option only if it is in the provided inventory and include a short note that the requested medicine will be added within a few hours."
        },
        {
          role: "user",
          content: `User symptoms: ${message}\nAvailable inventory candidates: ${JSON.stringify(responseMedicines)}`
        }
      ],
      temperature: 0.3
    });

    return {
      response: completion.choices[0]?.message?.content || formatExactHealthResponse(uniqueMatches),
      suggestedMedicines: uniqueMatches,
      adminReminder: "",
      matchType: "Exact"
    };
  } catch {
    return {
      response: formatExactHealthResponse(uniqueMatches),
      suggestedMedicines: uniqueMatches,
      adminReminder: "",
      matchType: "Exact"
    };
  }
};
