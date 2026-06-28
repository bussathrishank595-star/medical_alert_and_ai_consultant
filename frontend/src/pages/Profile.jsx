import { CalendarClock, CreditCard, Lock, MapPin, Package, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", password: "" });
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/chat/history"), api.get("/orders/mine")])
      .then(([chatResponse, ordersResponse]) => {
        setHistory(chatResponse.data.history);
        setOrders(ordersResponse.data.orders);
      })
      .catch((error) => toast.error(error.message));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = { name: form.name };
      if (form.password) {
        payload.password = form.password;
      }
      await updateProfile(payload);
      setForm((current) => ({ ...current, password: "" }));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="panel p-5">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">Profile</h2>
        <p className="muted">Update your display name or password.</p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="label">Name</span>
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="label">New Password</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Leave blank to keep current password"
                minLength={8}
              />
            </span>
          </label>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <section className="space-y-6">
        <div className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Chat History</h2>
            <p className="muted">Your recent AI assistant conversations.</p>
          </div>
          <div className="max-h-[320px] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
            {history.map((item) => (
              <article key={item._id} className="space-y-3 p-5">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.message}</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.response}</p>
                {item.recommendations?.length ? (
                  <div className="grid gap-2 pt-1 sm:grid-cols-2">
                    {item.recommendations.map((recommendation) =>
                      recommendation.medicineId ? (
                        <Link
                          key={recommendation.medicineId?._id || recommendation.medicineId || recommendation.name}
                          to={`/medicines/${recommendation.medicineId?._id || recommendation.medicineId}`}
                          className="rounded-md border border-slate-200 bg-white p-3 text-sm transition hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <p className="font-semibold text-slate-950 dark:text-white">{recommendation.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{recommendation.usage}</p>
                        </Link>
                      ) : (
                        <div
                          key={recommendation.name}
                          className="rounded-md border border-dashed border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-950 dark:text-white">{recommendation.name}</p>
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-100">
                              Reference
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{recommendation.usage}</p>
                        </div>
                      )
                    )}
                  </div>
                ) : null}
              </article>
            ))}
            {!history.length ? <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No chats yet.</p> : null}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">My Orders</h2>
            <p className="muted">Your recent medicine orders and delivery details.</p>
          </div>
          <div className="max-h-[360px] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
            {orders.map((order) => (
              <article key={order._id} className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {(order.items || [])
                        .map((item) => item.name)
                        .slice(0, 2)
                        .join(", ")}
                      {(order.items || []).length > 2 ? ` +${(order.items || []).length - 2} more` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{order.address}</p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-100">
                    {order.status}
                  </span>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                  <p className="inline-flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Rs. {Number(order.total).toFixed(2)}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {order.paymentMode === "online" ? "Online" : "Cash on delivery"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {order.location?.latitude != null && order.location?.longitude != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800 dark:text-primary-300"
                  >
                    <MapPin className="h-4 w-4" />
                    View shared location
                  </a>
                ) : null}
              </article>
            ))}
            {!orders.length ? <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No orders yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
