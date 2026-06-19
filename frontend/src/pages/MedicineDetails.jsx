import { ArrowLeft, CalendarClock, Factory, PackageCheck, Pill, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import api from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

const MedicineDetails = () => {
  const { id } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/medicines/${id}`)
      .then(({ data }) => setMedicine(data.medicine))
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="muted">Loading medicine details...</p>;
  }

  if (!medicine) {
    return <p className="muted">Medicine not found.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link className="btn btn-secondary" to="/medicines">
        <ArrowLeft className="h-4 w-4" />
        Back to medicines
      </Link>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="panel overflow-hidden">
          {medicine.image ? (
            <img src={medicine.image} alt={medicine.name} className="h-80 w-full object-cover" />
          ) : (
            <div className="flex h-80 items-center justify-center bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-100">
              <Pill className="h-16 w-16" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <StatusBadge expiryDate={medicine.expiryDate} />
            <h2 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">{medicine.name}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{medicine.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel p-4">
              <Factory className="h-5 w-5 text-primary-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Manufacturer</p>
              <p className="font-semibold">{medicine.manufacturer}</p>
            </div>
            <div className="panel p-4">
              <PackageCheck className="h-5 w-5 text-medical-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Stock</p>
              <p className="font-semibold">{medicine.stock} units</p>
            </div>
            <div className="panel p-4">
              <Wallet className="h-5 w-5 text-amber-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Price</p>
              <p className="font-semibold">Rs. {Number(medicine.price).toFixed(2)}</p>
            </div>
            <div className="panel p-4">
              <CalendarClock className="h-5 w-5 text-red-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Category</p>
              <p className="font-semibold">{medicine.category}</p>
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="font-semibold text-slate-950 dark:text-white">AI Classification</h3>
            <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="font-medium">Symptoms</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {(medicine.symptoms || []).join(", ") || "No symptoms tagged"}
                </p>
              </div>
              <div>
                <p className="font-medium">Usage</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {medicine.aiClassification?.usage || "Use as directed."}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium">Warnings</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {medicine.aiClassification?.warnings || "Consult a qualified professional for medical guidance."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MedicineDetails;
