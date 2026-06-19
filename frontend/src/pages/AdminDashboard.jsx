import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  PackageCheck,
  Pill,
  Users
} from "lucide-react";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import MetricCard from "../components/MetricCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then(({ data }) => setStats(data))
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const categoryChart = useMemo(() => {
    const rows = stats?.charts?.categoryDistribution || [];
    return {
      labels: rows.map((row) => row.category),
      datasets: [
        {
          data: rows.map((row) => row.count),
          backgroundColor: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#64748b", "#14b8a6", "#7c3aed"]
        }
      ]
    };
  }, [stats]);

  const monthlyChart = useMemo(() => {
    const rows = stats?.charts?.monthlyAdded || [];
    return {
      labels: rows.map((row) => row.month),
      datasets: [
        {
          label: "Medicines added",
          data: rows.map((row) => row.count),
          backgroundColor: "#10b981",
          borderRadius: 4
        }
      ]
    };
  }, [stats]);

  if (loading) {
    return <p className="muted">Loading dashboard...</p>;
  }

  const cards = stats?.cards || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Admin Dashboard</h2>
          <p className="muted">Expiry monitoring, inventory totals, and AI classification coverage.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/medicines/new">
          <Pill className="h-4 w-4" />
          Add Medicine
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Medicines" value={cards.totalMedicines} icon={PackageCheck} tone="blue" />
        <MetricCard title="Expired" value={cards.expiredMedicines} icon={AlertTriangle} tone="red" />
        <MetricCard title="Expiring Soon" value={cards.expiringSoonMedicines} icon={CalendarClock} tone="amber" />
        <MetricCard title="Total Users" value={cards.totalUsers} icon={Users} tone="green" />
        <MetricCard title="Total Stock" value={cards.totalStock} icon={Boxes} tone="blue" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5">
          <h3 className="font-semibold text-slate-950 dark:text-white">Category Distribution</h3>
          <div className="mt-5 h-72">
            <Doughnut data={categoryChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-semibold text-slate-950 dark:text-white">Monthly Added Medicines</h3>
          <div className="mt-5 h-72">
            <Bar data={monthlyChart} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h3 className="font-semibold text-slate-950 dark:text-white">Expiry Alerts</h3>
          <p className="muted">Medicines expired or expiring within 30 days.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
              <tr>
                <th className="px-5 py-3">Medicine</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Days</th>
                <th className="px-5 py-3">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {(stats?.alerts || []).map((alert) => (
                <tr key={alert._id}>
                  <td className="px-5 py-4 font-medium text-slate-950 dark:text-white">{alert.name}</td>
                  <td className="px-5 py-4">
                    <StatusBadge expiryDate={alert.expiryDate} />
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{alert.daysRemaining}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{alert.stock}</td>
                </tr>
              ))}
              {!stats?.alerts?.length ? (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500 dark:text-slate-400" colSpan="4">
                    No expiry alerts right now.
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

export default AdminDashboard;
