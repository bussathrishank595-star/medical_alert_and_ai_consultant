import { Bot, CalendarClock, PackageCheck, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import MetricCard from "../components/MetricCard.jsx";
import StatusBadge, { getExpiryStatus } from "../components/StatusBadge.jsx";

const UserDashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/medicines?limit=24")
      .then(({ data }) => setMedicines(data.medicines))
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();

    if (!needle) {
      return medicines.slice(0, 8);
    }

    return medicines
      .filter((medicine) =>
        [medicine.name, medicine.category, medicine.description, ...(medicine.symptoms || [])]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 8);
  }, [medicines, query]);

  const available = medicines.filter((medicine) => medicine.stock > 0 && getExpiryStatus(medicine.expiryDate).label !== "Expired");
  const expiringSoon = medicines.filter((medicine) => getExpiryStatus(medicine.expiryDate).label === "Expiring Soon");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Available Medicines" value={available.length} icon={PackageCheck} tone="green" />
        <MetricCard title="Expiring Soon" value={expiringSoon.length} icon={CalendarClock} tone="amber" />
        <MetricCard title="AI Assistant" value="Ready" icon={Bot} tone="blue" />
      </section>

      <section className="panel p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Find Medicines</h2>
            <p className="muted">Search by symptom, category, or medicine name.</p>
          </div>
          <Link className="btn btn-primary" to="/assistant">
            <Bot className="h-4 w-4" />
            Ask AI
          </Link>
        </div>
        <label className="relative mt-5 block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try fever, cough, vitamins, pain"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((medicine) => (
          <Link
            key={medicine._id}
            to={`/medicines/${medicine._id}`}
            className="panel overflow-hidden transition hover:border-primary-300"
          >
            {medicine.image ? (
              <img src={medicine.image} alt={medicine.name} className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-100">
                {medicine.category}
              </div>
            )}
            <div className="space-y-3 p-4">
              <StatusBadge expiryDate={medicine.expiryDate} />
              <div>
                <h3 className="font-semibold text-slate-950 dark:text-white">{medicine.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{medicine.description}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-medical-700 dark:text-medical-500">Rs. {Number(medicine.price).toFixed(2)}</span>
                <span className="text-slate-500 dark:text-slate-400">{medicine.stock} in stock</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {!loading && !filtered.length ? <p className="muted">No matching medicines found.</p> : null}
      {loading ? <p className="muted">Loading available medicines...</p> : null}
    </div>
  );
};

export default UserDashboard;
