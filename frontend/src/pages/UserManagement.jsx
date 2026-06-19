import { Shield, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client.js";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/users")
      .then(({ data }) => setUsers(data.users))
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const updateRole = async (userId, role) => {
    try {
      const { data } = await api.patch(`/users/${userId}/role`, { role });
      setUsers((current) => current.map((user) => (user._id === userId ? data.user : user)));
      toast.success("Role updated");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">User Management</h2>
        <p className="muted">View users and manage admin or customer roles.</p>
      </div>

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((appUser) => (
                <tr key={appUser._id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-500/15">
                        <UserCog className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-950 dark:text-white">{appUser.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{appUser.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-medical-600" />
                      <select
                        className="input max-w-[160px]"
                        value={appUser.role}
                        onChange={(event) => updateRole(appUser._id, event.target.value)}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {new Date(appUser.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!loading && !users.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500 dark:text-slate-400" colSpan="4">
                    No users found.
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500 dark:text-slate-400" colSpan="4">
                    Loading users...
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

export default UserManagement;
