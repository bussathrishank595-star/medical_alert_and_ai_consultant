const MetricCard = ({ title, value, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-100",
    green: "bg-medical-50 text-medical-700 dark:bg-medical-500/15 dark:text-medical-500",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
  };

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value ?? 0}</p>
        </div>
        {Icon ? (
          <div className={`flex h-11 w-11 items-center justify-center rounded-md ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MetricCard;
