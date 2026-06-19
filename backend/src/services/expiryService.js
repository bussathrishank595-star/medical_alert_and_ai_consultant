import Medicine from "../models/Medicine.js";

export const daysUntil = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (expiryDate) => {
  const days = daysUntil(expiryDate);

  if (days <= 0) {
    return "Expired";
  }

  if (days <= 30) {
    return "Expiring Soon";
  }

  return "Active";
};

export const updateExpiryStatuses = async () => {
  const medicines = await Medicine.find({}, "expiryDate expiryStatus");
  const updates = medicines
    .map((medicine) => {
      const nextStatus = getExpiryStatus(medicine.expiryDate);
      if (medicine.expiryStatus === nextStatus) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: medicine._id },
          update: { $set: { expiryStatus: nextStatus } }
        }
      };
    })
    .filter(Boolean);

  if (updates.length) {
    await Medicine.bulkWrite(updates);
  }

  return { checked: medicines.length, updated: updates.length };
};
