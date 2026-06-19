import { BrainCircuit } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client.js";

const ClassificationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/medicines/admin/classifications")
      .then(({ data }) => setLogs(data.logs))
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">AI Classification Logs</h2>
        <p className="muted">Review OpenAI classification output saved with each medicine.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {logs.map((log) => (
          <article key={log._id} className="panel p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-100">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950 dark:text-white">{log.name}</h3>
                <p className="muted">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="font-medium">Category</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{log.category}</p>
              </div>
              <div>
                <p className="font-medium">Symptoms</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{(log.symptoms || []).join(", ")}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Usage</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {log.aiClassification?.usage || "No usage returned"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Warnings</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {log.aiClassification?.warnings || "No warnings returned"}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {!loading && !logs.length ? <p className="muted">No classification logs yet.</p> : null}
      {loading ? <p className="muted">Loading AI logs...</p> : null}
    </div>
  );
};

export default ClassificationLogs;
