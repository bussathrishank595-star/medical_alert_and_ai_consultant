import { Lock, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", password: "" });
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/chat/history")
      .then(({ data }) => setHistory(data.history))
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

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Chat History</h2>
          <p className="muted">Your recent AI assistant conversations.</p>
        </div>
        <div className="max-h-[620px] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
          {history.map((item) => (
            <article key={item._id} className="space-y-3 p-5">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.message}</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.response}</p>
            </article>
          ))}
          {!history.length ? <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No chats yet.</p> : null}
        </div>
      </section>
    </div>
  );
};

export default Profile;
