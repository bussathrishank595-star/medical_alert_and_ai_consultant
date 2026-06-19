import { differenceInCalendarDays, format } from "date-fns";

export const getExpiryStatus = (expiryDate) => {
  const days = differenceInCalendarDays(new Date(expiryDate), new Date());

  if (days <= 0) {
    return { label: "Expired", className: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300" };
  }

  if (days <= 30) {
    return {
      label: "Expiring Soon",
      className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
    };
  }

  return {
    label: "Active",
    className: "bg-medical-50 text-medical-700 ring-medical-500/20 dark:bg-medical-500/15 dark:text-medical-500"
  };
};

const StatusBadge = ({ expiryDate }) => {
  const status = getExpiryStatus(expiryDate);

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}>
      {status.label} - {format(new Date(expiryDate), "MMM d, yyyy")}
    </span>
  );
};

export default StatusBadge;
