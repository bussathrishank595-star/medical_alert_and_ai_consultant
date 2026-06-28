import { Activity, Lock, Mail } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/app"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const nextUser = await login(form);
      toast.success("Signed in successfully");
      navigate(nextUser.role === "admin" ? "/admin" : "/app");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-primary-700 p-8 text-white sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/15">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="mt-8 text-3xl font-bold">MediAlert AI</h1>
          <p className="mt-4 max-w-md text-primary-50">
            Track inventory, catch expiry risks early, and manage operations with AI-supported medicine analytics.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-primary-50">
            <span className="rounded-md bg-white/10 px-3 py-2">JWT-secured admin dashboard</span>
            <span className="rounded-md bg-white/10 px-3 py-2">OpenAI classification for medicine metadata</span>
            <span className="rounded-md bg-white/10 px-3 py-2">Expiry alerts and operational analytics</span>
          </div>
        </div>

        <form className="p-8 sm:p-10" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-medical-600">Secure login</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Access your workspace</h2>
          </div>

          <div className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="label">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="input pl-9"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="admin@example.com"
                  required
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="label">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="input pl-9"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                />
              </span>
            </label>
          </div>

          <button className="btn btn-primary mt-7 w-full" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
