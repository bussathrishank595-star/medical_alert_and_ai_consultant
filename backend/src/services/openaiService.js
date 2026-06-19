import OpenAI from "openai";
import { MEDICINE_CATEGORIES } from "../models/Medicine.js";

let openaiClient;

const keywordMap = [
  { category: "Fever", terms: ["fever", "temperature", "pyrexia"] },
  { category: "Headache", terms: ["headache", "migraine", "head pain"] },
  { category: "Cold", terms: ["cold", "runny nose", "sneezing", "congestion"] },
  { category: "Cough", terms: ["cough", "throat", "sore throat"] },
  { category: "Diabetes", terms: ["diabetes", "glucose", "blood sugar", "insulin"] },
  { category: "Blood Pressure", terms: ["blood pressure", "hypertension", "bp"] },
  { category: "Vitamin", terms: ["vitamin", "supplement", "deficiency"] },
  { category: "Pain Relief", terms: ["pain", "ache", "inflammation", "analgesic"] },
  { category: "Skin Care", terms: ["skin", "rash", "itch", "acne", "cream"] },
  { category: "Antibiotic", terms: ["antibiotic", "infection", "bacterial"] }
];

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

const findKeywordMatch = (text) => {
  const haystack = text.toLowerCase();
  const match = keywordMap.find(({ terms }) => terms.some((term) => haystack.includes(term)));
  const category = match?.category || "Other";
  const symptoms = extractSymptoms(haystack);

  return { category, symptoms };
};

const buildUsageText = (name, category, symptoms) => {
  const symptomText = symptoms.length ? symptoms.slice(0, 3).join(", ") : category.toLowerCase();
  return `${name} is commonly stocked to help manage ${symptomText}.`;
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
  const { category, symptoms } = findKeywordMatch(text);
  const usage = buildUsageText(name, category, symptoms);
  const description = descriptionHint?.trim() || buildDescriptionText(name, manufacturer, category, symptoms);
  const warnings = "Follow label instructions and consult a doctor or pharmacist when symptoms persist.";

  return {
    category,
    symptoms: symptoms.length ? symptoms : [category.toLowerCase()],
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
            "You classify medicines for inventory metadata and also generate a concise inventory description. Return only valid JSON with category, symptoms, description, usage, warnings, and imagePrompt. Use category only from: Headache, Fever, Cold, Cough, Diabetes, Blood Pressure, Vitamin, Pain Relief, Skin Care, Antibiotic, Other. The description must be 1 to 2 short sentences, neutral, and suitable for a pharmacy inventory card. The imagePrompt must describe a clean product-style medicine image on a light background, with no people, no watermark, and no visible labels."
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

    const category = normalizeCategory(parsed.category);
    const fallback = fallbackProfile({ name, manufacturer, descriptionHint });
    const parsedSymptoms = Array.isArray(parsed.symptoms)
      ? parsed.symptoms.map((item) => String(item).toLowerCase()).filter(Boolean)
      : [];
    const symptoms = parsedSymptoms.length ? parsedSymptoms : fallback.symptoms;

    return {
      category,
      symptoms,
      description: String(parsed.description || descriptionHint || buildDescriptionText(name, manufacturer, category, symptoms)).trim() || buildDescriptionText(name, manufacturer, category, symptoms),
      usage: String(parsed.usage || buildUsageText(name, category, symptoms)).trim() || buildUsageText(name, category, symptoms),
      warnings: String(parsed.warnings || fallback.warnings).trim() || fallback.warnings,
      imagePrompt: String(parsed.imagePrompt || buildImagePrompt(name, category, manufacturer)).trim() || buildImagePrompt(name, category, manufacturer),
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
  const query = message.toLowerCase();
  const tokens = new Set(query.split(/[^a-z0-9]+/).filter((token) => token.length > 2));

  return medicines
    .map((medicine) => {
      const fields = [
        medicine.name,
        medicine.category,
        medicine.description,
        ...(medicine.symptoms || []),
        ...(medicine.aiClassification?.symptoms || [])
      ]
        .join(" ")
        .toLowerCase();

      const score = [...tokens].reduce((total, token) => total + (fields.includes(token) ? 1 : 0), 0);
      return { medicine, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ medicine }) => medicine);
};

const formatFallbackHealthResponse = (matches) => {
  if (!matches.length) {
    return [
      "I could not find a suitable medicine from the current inventory for those symptoms.",
      "",
      "Please consult a doctor or pharmacist for guidance. Consult a doctor for serious symptoms."
    ].join("\n");
  }

  const lines = matches.map((medicine) => {
    const usage = medicine.aiClassification?.usage || medicine.description;
    const precautions = medicine.aiClassification?.warnings || "Follow label directions and avoid self-medication.";
    return `Medicine Name: ${medicine.name}\nUsage: ${usage}\nPrecautions: ${precautions}`;
  });

  return `${lines.join("\n\n")}\n\nDisclaimer: Consult a doctor for serious symptoms.`;
};

export const generateHealthResponse = async ({ message, matchedMedicines }) => {
  const client = getOpenAIClient();

  if (!client) {
    return formatFallbackHealthResponse(matchedMedicines);
  }

  if (!matchedMedicines.length) {
    return formatFallbackHealthResponse([]);
  }

  const inventory = matchedMedicines.map((medicine) => ({
    name: medicine.name,
    description: medicine.description,
    category: medicine.category,
    symptoms: medicine.symptoms,
    usage: medicine.aiClassification?.usage,
    warnings: medicine.aiClassification?.warnings,
    stock: medicine.stock
  }));

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a healthcare assistant. Never diagnose diseases. Suggest only medicines explicitly included in the provided inventory. Recommend based on inventory symptoms. Always include Medicine Name, Usage, Precautions, and the disclaimer: Consult a doctor for serious symptoms."
        },
        {
          role: "user",
          content: `User symptoms: ${message}\nAvailable inventory candidates: ${JSON.stringify(inventory)}`
        }
      ],
      temperature: 0.3
    });

    return completion.choices[0]?.message?.content || formatFallbackHealthResponse(matchedMedicines);
  } catch {
    return formatFallbackHealthResponse(matchedMedicines);
  }
};
