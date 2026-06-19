import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import api from "../api/client.js";

const defaultForm = {
  name: "",
  manufacturer: "",
  price: "",
  stock: "",
  expiryDate: ""
};

const AddEditMedicine = () => {
  const { id } = useParams();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [savedMedicine, setSavedMedicine] = useState(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    api
      .get(`/medicines/${id}`)
      .then(({ data }) => {
        const medicine = data.medicine;
        setForm({
          name: medicine.name || "",
          manufacturer: medicine.manufacturer || "",
          price: medicine.price ?? "",
          stock: medicine.stock ?? "",
          expiryDate: medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : ""
        });
        setSavedMedicine(medicine);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock)
    };

    try {
      if (id) {
        const { data } = await api.put(`/medicines/${id}`, payload);
        setSavedMedicine(data.medicine);
        toast.success("Medicine updated and reclassified");
      } else {
        const { data } = await api.post("/medicines", payload);
        setSavedMedicine(data.medicine);
        toast.success("Medicine added and classified");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="muted">Loading medicine...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{id ? "Edit Medicine" : "Add Medicine"}</h2>
          <p className="muted">OpenAI generates the medicine description and image automatically when you save.</p>
        </div>
        <Link className="btn btn-secondary" to="/admin/medicines">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <form className="panel space-y-6 p-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="label">Medicine Name</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Paracetamol 500mg"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="label">Manufacturer</span>
            <input
              className="input"
              value={form.manufacturer}
              onChange={(event) => updateField("manufacturer", event.target.value)}
              placeholder="ACME Pharma"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="label">Price</span>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="25.00"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="label">Stock</span>
            <input
              className="input"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => updateField("stock", event.target.value)}
              placeholder="100"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="label">Expiry Date</span>
            <input
              className="input"
              type="date"
              value={form.expiryDate}
              onChange={(event) => updateField("expiryDate", event.target.value)}
              required
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Medicine"}
          </button>
        </div>
      </form>

      {savedMedicine ? (
        <section className="panel p-5">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">AI Generated Uses</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The assistant classified this medicine as <span className="font-semibold">{savedMedicine.category}</span>.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
            <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              {savedMedicine.image ? (
                <img src={savedMedicine.image} alt={savedMedicine.name} className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  No image generated
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="label">Generated Description</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{savedMedicine.description}</p>
              </div>
              <div>
                <p className="label">Use</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {savedMedicine.aiClassification?.usage || "No usage returned by the AI."}
                </p>
              </div>
              <div>
                <p className="label">Warnings</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {savedMedicine.aiClassification?.warnings || "No warnings returned by the AI."}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="label">Symptoms</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {(savedMedicine.aiClassification?.symptoms || []).join(", ") || "No symptoms detected."}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn btn-secondary" to="/admin/medicines">
              Back to inventory
            </Link>
            <Link className="btn btn-primary" to={`/medicines/${savedMedicine._id}`}>
              View medicine details
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default AddEditMedicine;
