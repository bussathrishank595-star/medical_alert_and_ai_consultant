import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

const categories = [
  "",
  "Headache",
  "Fever",
  "Cold",
  "Cough",
  "Diabetes",
  "Blood Pressure",
  "Vitamin",
  "Pain Relief",
  "Skin Care",
  "Antibiotic",
  "Other"
];

const MedicineInventory = ({ customerView = false }) => {
  const [medicines, setMedicines] = useState([]);
  const [filters, setFilters] = useState({ q: "", category: "", status: "" });
  const [loading, setLoading] = useState(true);

  const loadMedicines = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    try {
      const { data } = await api.get(`/medicines?${params.toString()}`);
      setMedicines(data.medicines);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadMedicines, 250);
    return () => clearTimeout(timeout);
  }, [filters.q, filters.category, filters.status]);

  const deleteMedicine = async (medicine) => {
    if (!window.confirm(`Delete ${medicine.name}?`)) {
      return;
    }

    try {
      await api.delete(`/medicines/${medicine._id}`);
      toast.success("Medicine deleted");
      setMedicines((current) => current.filter((item) => item._id !== medicine._id));
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
            {customerView ? "Search Medicines" : "Medicine Inventory"}
          </h2>
          <p className="muted">
            {customerView
              ? "Find available medicines and review expiry, stock, and category details."
              : "Manage stock, expiry dates, AI categories, and medicine details."}
          </p>
        </div>
        {!customerView ? (
          <Link className="btn btn-primary" to="/admin/medicines/new">
            <Plus className="h-4 w-4" />
            Add Medicine
          </Link>
        ) : null}
      </div>

      <section className="panel p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder="Search by name, symptom, category, or description"
            />
          </label>
          <select
            className="input"
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          >
            {categories.map((category) => (
              <option key={category || "all"} value={category}>
                {category || "All categories"}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
              <tr>
                <th className="px-5 py-3">Medicine</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Expiry</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {medicines.map((medicine) => (
                <tr key={medicine._id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {medicine.image ? (
                        <img
                          src={medicine.image}
                          alt={medicine.name}
                          className="h-11 w-11 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-500/15">
                          Rx
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{medicine.name}</p>
                        <p className="line-clamp-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                          {medicine.manufacturer}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{medicine.category}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{medicine.stock}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">Rs. {Number(medicine.price).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge expiryDate={medicine.expiryDate} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link className="btn btn-secondary p-2" to={`/medicines/${medicine._id}`} title="View details">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {!customerView ? (
                        <>
                          <Link
                            className="btn btn-secondary p-2"
                            to={`/admin/medicines/${medicine._id}/edit`}
                            title="Edit medicine"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            className="btn btn-danger p-2"
                            onClick={() => deleteMedicine(medicine)}
                            title="Delete medicine"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !medicines.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500 dark:text-slate-400" colSpan="6">
                    No medicines found.
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500 dark:text-slate-400" colSpan="6">
                    Loading medicines...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MedicineInventory;
