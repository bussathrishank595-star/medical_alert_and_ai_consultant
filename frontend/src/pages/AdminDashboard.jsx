import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  Clock3,
  PackageCheck,
  Pill,
  ShoppingBag,
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <MetricCard title="Total Orders" value={cards.totalOrders} icon={ShoppingBag} tone="blue" />
        <MetricCard title="Pending Orders" value={cards.pendingOrders} icon={Clock3} tone="amber" />
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

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h3 className="font-semibold text-slate-950 dark:text-white">Medicine Requests</h3>
          <p className="muted">Customer requests that need restock follow-up.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
              <tr>
                <th className="px-5 py-3">Customer Request</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Advice</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {(stats?.medicineRequests || []).map((request) => (
                <tr key={request._id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-950 dark:text-white">{request.message}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{request.adminReminder || "Stock review needed"}</p>
                    {request.recommendations?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {request.recommendations.map((recommendation) => (
                          <span key={recommendation.medicineId?._id || recommendation.name} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-100">
                            {recommendation.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      request.matchType === "Exact"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100"
                        : request.matchType === "Alternative"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100"
                          : request.matchType === "Reference"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-100"
                          : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-100"
                    }`}>
                      {request.matchType}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {request.response}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {new Date(request.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!stats?.medicineRequests?.length ? (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500 dark:text-slate-400" colSpan="4">
                    No pending medicine requests right now.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h3 className="font-semibold text-slate-950 dark:text-white">Recent Orders</h3>
          <p className="muted">Latest customer checkout requests received by the store.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {(stats?.recentOrders || []).map((order) => (
                <tr key={order._id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-950 dark:text-white">{order.customerName}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.customerEmail}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.address}</p>
                    {order.notes ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Note: {order.notes}</p> : null}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    <div className="space-y-1">
                      {(order.items || []).slice(0, 3).map((item) => (
                        <p key={`${order._id}-${item.name}`} className="text-xs">
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                      {(order.items || []).length > 3 ? <p className="text-xs text-slate-400">+{(order.items || []).length - 3} more</p> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    <p>{order.paymentMode === "online" ? "Online" : "Cash"}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.paymentStatus}</p>
                    {order.paymentMode === "online" ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">UPI: {order.upiId}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {order.location?.latitude != null && order.location?.longitude != null ? (
                      <a
                        href={`https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-700 hover:text-primary-800 dark:text-primary-300"
                      >
                        {order.location.latitude}, {order.location.longitude}
                      </a>
                    ) : (
                      "Location not shared"
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">Rs. {Number(order.total).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-100">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!stats?.recentOrders?.length ? (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500 dark:text-slate-400" colSpan="6">
                    No orders received yet.
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
