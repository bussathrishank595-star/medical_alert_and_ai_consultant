import { Loader2 } from "lucide-react";

const LoadingScreen = ({ label = "Loading MediAlert AI" }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  </div>
);

export default LoadingScreen;
