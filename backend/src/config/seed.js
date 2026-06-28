import Medicine from "../models/Medicine.js";
import User from "../models/User.js";
import { getExpiryStatus } from "../services/expiryService.js";

const buildDemoImage = (name, category) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff6ff" />
          <stop offset="100%" stop-color="#ecfdf5" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="64" fill="url(#bg)" />
      <rect x="192" y="256" width="640" height="512" rx="56" fill="#ffffff" stroke="#dbeafe" stroke-width="10" />
      <circle cx="512" cy="376" r="92" fill="#dbeafe" />
      <rect x="468" y="296" width="88" height="160" rx="32" fill="#2563eb" />
      <rect x="384" y="380" width="256" height="88" rx="32" fill="#10b981" />
      <text x="512" y="600" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700" fill="#0f172a">${name}</text>
      <text x="512" y="670" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#475569">${category}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const demoUsers = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@12345",
    role: "admin"
  },
  {
    name: "Customer User",
    email: "customer@example.com",
    password: "Customer@12345",
    role: "customer"
  }
];

const parseAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "admin@example.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const demoMedicines = [
  {
    name: "Paracetamol 500mg",
    category: "Fever",
    description: "Commonly used to reduce fever and relieve mild to moderate pain.",
    symptoms: ["fever", "headache", "body pain"],
    manufacturer: "Cipla",
    stock: 120,
    price: 24,
    expiryOffsetDays: 365,
    usage: "Helps reduce fever and relieve mild to moderate pain.",
    warnings: "Follow the label dose and avoid combining with other paracetamol products."
  },
  {
    name: "Cetirizine 10mg",
    category: "Cold",
    description: "Used to help relieve sneezing, runny nose, and allergy-like symptoms.",
    symptoms: ["cold", "sneezing", "runny nose"],
    manufacturer: "UCB",
    stock: 80,
    price: 18,
    expiryOffsetDays: 280,
    usage: "Helps relieve sneezing and runny nose.",
    warnings: "May cause drowsiness in some people."
  },
  {
    name: "Dextromethorphan Syrup",
    category: "Cough",
    description: "A syrup commonly used for dry cough relief.",
    symptoms: ["cough", "throat irritation"],
    manufacturer: "Johnson & Johnson",
    stock: 60,
    price: 65,
    expiryOffsetDays: 240,
    usage: "Helps soothe a dry cough.",
    warnings: "Use only as directed and seek care if cough persists."
  },
  {
    name: "Ibuprofen 200mg",
    category: "Pain Relief",
    description: "Used for temporary relief of pain and inflammation.",
    symptoms: ["pain", "inflammation", "headache"],
    manufacturer: "Abbott",
    stock: 90,
    price: 30,
    expiryOffsetDays: 320,
    usage: "Helps reduce pain and inflammation.",
    warnings: "Take with food and avoid if a doctor has told you not to use NSAIDs."
  },
  {
    name: "Multivitamin Tablets",
    category: "Vitamin",
    description: "Helps support general nutritional needs and daily wellness.",
    symptoms: ["vitamin", "deficiency", "weakness"],
    manufacturer: "Himalaya",
    stock: 75,
    price: 55,
    expiryOffsetDays: 300,
    usage: "Supports general nutritional needs.",
    warnings: "Use only as directed."
  }
];

const seedDemoUsers = async () => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  for (const demoUser of demoUsers) {
    const existingUser = await User.findOne({ email: demoUser.email });

    if (!existingUser) {
      await User.create(demoUser);
    }
  }
};

export const seedAdminUsers = async () => {
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminUsers = parseAdminEmails();

  for (const email of adminUsers) {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      await User.create({
        name: "Admin User",
        email,
        password: adminPassword,
        role: "admin"
      });
    }
  }
};

export const seedDemoMedicines = async () => {
  const totalMedicines = await Medicine.countDocuments();

  if (totalMedicines > 0) {
    return;
  }

  const today = new Date();
  const medicinesToInsert = demoMedicines.map((medicine) => {
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + medicine.expiryOffsetDays);

    return {
      name: medicine.name,
      category: medicine.category,
      description: medicine.description,
      symptoms: medicine.symptoms,
      manufacturer: medicine.manufacturer,
      stock: medicine.stock,
      price: medicine.price,
      image: buildDemoImage(medicine.name, medicine.category),
      expiryDate,
      expiryStatus: getExpiryStatus(expiryDate),
      aiClassification: {
        category: medicine.category,
        symptoms: medicine.symptoms,
        description: medicine.description,
        usage: medicine.usage,
        warnings: medicine.warnings,
        imagePrompt: `Demo image for ${medicine.name}`,
        imageSource: "fallback",
        raw: { source: "seed-demo-medicine" }
      }
    };
  });

  await Medicine.insertMany(medicinesToInsert);
};

const seedData = async () => {
  await seedAdminUsers();
  await seedDemoUsers();
  await seedDemoMedicines();
};

export default seedData;
