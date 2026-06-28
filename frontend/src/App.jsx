import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AddEditMedicine from "./pages/AddEditMedicine.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AiAssistant from "./pages/AiAssistant.jsx";
import CartCheckout from "./pages/CartCheckout.jsx";
import ClassificationLogs from "./pages/ClassificationLogs.jsx";
import Login from "./pages/Login.jsx";
import MedicineDetails from "./pages/MedicineDetails.jsx";
import MedicineInventory from "./pages/MedicineInventory.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/assistant" element={<AiAssistant />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/medicines" element={<MedicineInventory customerView />} />
        <Route path="/medicines/:id" element={<MedicineDetails />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={["customer"]} />}>
      <Route element={<AppShell />}>
        <Route path="/app" element={<UserDashboard />} />
        <Route path="/cart" element={<CartCheckout />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={["admin"]} />}>
      <Route element={<AppShell />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/medicines" element={<MedicineInventory />} />
        <Route path="/admin/medicines/new" element={<AddEditMedicine />} />
        <Route path="/admin/medicines/:id/edit" element={<AddEditMedicine />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/classifications" element={<ClassificationLogs />} />
      </Route>
    </Route>

    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;
