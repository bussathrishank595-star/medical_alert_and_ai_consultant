import { Banknote, Check, Copy, CreditCard, LocateFixed, Loader2, MapPin, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const UPI_ID = import.meta.env.VITE_UPI_ID || "7989971353@ybl";

const CartCheckout = () => {
  const { user } = useAuth();
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [location, setLocation] = useState({ latitude: "", longitude: "" });
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const navigate = useNavigate();

  const total = useMemo(() => subtotal, [subtotal]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser does not support location detection");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6)
        });
        toast.success("Location detected");
      },
      () => {
        toast.error("Unable to detect location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopySuccess(true);
      toast.success("UPI ID copied");
      window.setTimeout(() => setCopySuccess(false), 1500);
    } catch {
      toast.error("Could not copy UPI ID");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!address.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items: items.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity
        })),
        address,
        paymentMode,
        notes,
        location: {
          latitude: location.latitude || undefined,
          longitude: location.longitude || undefined
        }
      };
      const { data } = await api.post("/orders", payload);
      clearCart();
      toast.success(data.message || "Order placed successfully");
      navigate("/app");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <section className="panel mx-auto max-w-2xl p-8 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-primary-600" />
        <h2 className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">Your cart is empty</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Add medicines from search or product details to continue to checkout.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn btn-primary" to="/medicines">
            Browse medicines
          </Link>
          <Link className="btn btn-secondary" to="/app">
            Go home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        <div className="panel p-5">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Cart & Checkout</h2>
          <p className="muted">Review your items, confirm the address, and choose a payment mode.</p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.medicineId} className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-white">{item.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                  <p className="text-sm text-medical-700 dark:text-medical-500">Rs. {Number(item.price).toFixed(2)} each</p>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button className="btn btn-secondary p-2" onClick={() => updateQuantity(item.medicineId, item.quantity - 1)} aria-label="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    className="input w-20 text-center"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.medicineId, event.target.value)}
                  />
                  <button className="btn btn-secondary p-2" onClick={() => updateQuantity(item.medicineId, item.quantity + 1)} aria-label="Increase quantity">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-950 dark:text-white">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                  <button className="mt-2 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700" onClick={() => removeFromCart(item.medicineId)}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <form className="panel space-y-5 p-5" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="address">
              Delivery address
            </label>
            <textarea
              id="address"
              className="input min-h-28"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={`House number, street, city, landmark${user?.name ? ` — for ${user.name}` : ""}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="label" htmlFor="location">
                Location coordinates
              </label>
              <button type="button" className="btn btn-secondary" onClick={detectLocation}>
                <LocateFixed className="h-4 w-4" />
                Detect location
              </button>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input
                id="latitude"
                className="input"
                value={location.latitude}
                onChange={(event) => setLocation((current) => ({ ...current, latitude: event.target.value }))}
                placeholder="Latitude"
              />
              <input
                id="longitude"
                className="input"
                value={location.longitude}
                onChange={(event) => setLocation((current) => ({ ...current, longitude: event.target.value }))}
                placeholder="Longitude"
              />
            </div>
            {location.latitude !== "" && location.longitude !== "" ? (
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800 dark:text-primary-300"
              >
                <MapPin className="h-4 w-4" />
                Open coordinates in Maps
              </a>
            ) : null}
          </div>

          <div>
            <label className="label" htmlFor="notes">
              Delivery notes
            </label>
            <textarea
              id="notes"
              className="input min-h-24"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Apartment number, call before arrival, etc."
            />
          </div>

          <div>
            <label className="label" htmlFor="paymentMode">
              Payment mode
            </label>
            <select id="paymentMode" className="input" value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
              <option value="cash">Cash on delivery</option>
              <option value="online">Online payment</option>
            </select>
          </div>

          {paymentMode === "online" ? (
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-500/30 dark:bg-primary-500/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">Pay using UPI</p>
                  <p className="mt-1 text-sm text-primary-800 dark:text-primary-100">Send the payment to {UPI_ID}</p>
                </div>
                <button type="button" className="btn btn-secondary" onClick={copyUpi}>
                  {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copySuccess ? "Copied" : "Copy UPI"}
                </button>
              </div>
              <div className="mt-4 grid gap-3 rounded-md bg-white p-4 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary-600" />
                  <span className="font-medium">UPI ID:</span> <span>{UPI_ID}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-medical-600" />
                  <span>After payment, admin will receive the order for confirmation.</span>
                </div>
              </div>
            </div>
          ) : null}

          <button className="btn btn-primary w-full justify-center py-3" type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Place order
          </button>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="panel p-5">
          <h3 className="font-semibold text-slate-950 dark:text-white">Order summary</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total quantity</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-950 dark:text-white">
              <span>Total</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-semibold text-slate-950 dark:text-white">What happens next?</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• Admin receives the order instantly.</li>
            <li>• Location coordinates are shared with the store.</li>
            <li>• Online orders show the UPI ID for quick payment.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default CartCheckout;
