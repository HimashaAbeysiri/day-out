import React, { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  CreditCard,
  PartyPopper,
  Loader2,
  LogIn,
  LogOut,
  Users,
} from "lucide-react";

import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { db, auth } from "./firebase";

const PLACE_OPTIONS = [
  { id: "hotel", label: "Hotel", emoji: "🏨" },
  { id: "dayout", label: "Day Out", emoji: "🚗" },
  {
    id: "musical",
    label: "Musical Show",
    emoji: "🎵",
    fixedDate: "2026-08-22",
    fixedNote: "Heena • 22 Aug 2026, after 6pm",
  },
  { id: "sunshine", label: "Sun Shine", emoji: "☀️" },
  { id: "film", label: "Film", emoji: "🎬" },
  { id: "beach", label: "Beach", emoji: "🏖️" },
];

const FOOD_OPTIONS = [
  { id: "rice-curry", label: "Rice & Curry", emoji: "🍛" },
  { id: "kottu", label: "Kottu", emoji: "🥘" },
  { id: "bbq", label: "BBQ Chicken", emoji: "🍗" },
  { id: "hoppers", label: "Hoppers", emoji: "🥞" },
  { id: "fried-rice", label: "Fried Rice", emoji: "🍚" },
  { id: "noodles", label: "Noodles", emoji: "🍜" },
  { id: "kebab", label: "Fish Cutlets", emoji: "🧆" },
  { id: "prawns", label: "Prawns", emoji: "🍤" },
  { id: "corn", label: "Grilled Corn", emoji: "🌽" },
  { id: "salad", label: "Fresh Salad", emoji: "🥗" },
  { id: "watermelon", label: "Watermelon", emoji: "🍉" },
  { id: "fruits", label: "Fruit Platter", emoji: "🍍" },
  { id: "cake", label: "Cake", emoji: "🍰" },
  { id: "icecream", label: "Ice Cream", emoji: "🍨" },
  { id: "king-coconut", label: "King Coconut", emoji: "🥥" },
  { id: "softdrinks", label: "Soft Drinks", emoji: "🥤" },
];

const EVENT = {
  name: "Our Day Out, Babe 💕",
};

export default function App() {
  const [mode, setMode] = useState("rsvp");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const [form, setForm] = useState({
    name: "",
    attending: null,
    places: [],
    date: "",
    time: "06:00 PM",
    food: [],
    payment: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setMode("organizer");
      }
    });

    return () => unsubscribe();
  }, []);

  const update = (patch) => {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  };

  const togglePlace = (id) => {
    setForm((current) => {
      const alreadySelected = current.places.includes(id);

      const places = alreadySelected
        ? current.places.filter((x) => x !== id)
        : [...current.places, id];

      let date = current.date;
      let time = current.time;

      if (!alreadySelected && id === "musical") {
        date = "2026-08-22";
        time = "06:00 PM";
      }

      return {
        ...current,
        places,
        date,
        time,
      };
    });
  };

  const toggleFood = (id) => {
    setForm((current) => ({
      ...current,
      food: current.food.includes(id)
        ? current.food.filter((x) => x !== id)
        : [...current.food, id],
    }));
  };

  const canProceed = () => {
    if (step === 0) {
      return form.name.trim().length > 0 && form.attending !== null;
    }

    if (step === 1) {
      return form.places.length > 0;
    }

    if (step === 2) {
      return form.date !== "" && form.time !== "";
    }

    if (step === 3) {
      return form.food.length > 0;
    }

    if (step === 4) {
      return form.payment !== null;
    }

    return true;
  };

  const submitRsvp = async () => {
    setSaving(true);

    try {
      await addDoc(collection(db, "rsvps"), {
        name: form.name.trim(),
        attending: form.attending,
        places: form.places,
        date: form.date,
        time: form.time,
        food: form.food,
        payment: form.payment,
        submittedAt: new Date().toISOString(),
      });

      setStep(5);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving your response.");
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (!canProceed()) return;

    if (step === 0 && form.attending === false) {
      await submitRsvp();
      return;
    }

    if (step === 4) {
      await submitRsvp();
      return;
    }

    setStep((current) => current + 1);
  };

  const back = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  const selectedPlaceNames = form.places
    .map(
      (id) => PLACE_OPTIONS.find((place) => place.id === id)?.label
    )
    .join(", ");

  const selectedFoodNames = form.food
    .map(
      (id) => FOOD_OPTIONS.find((food) => food.id === id)?.label
    )
    .join(", ");

  const login = async () => {
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    setLoggingIn(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      setLoginEmail("");
      setLoginPassword("");
      setMode("organizer");
    } catch (error) {
      console.error(error);
      setLoginError("Invalid email or password.");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setResponses([]);
    setMode("rsvp");
  };

  const loadResponses = async () => {
    if (!user) return;

    setLoadingResponses(true);

    try {
      const q = query(
        collection(db, "rsvps"),
        orderBy("submittedAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setResponses(data);
    } catch (error) {
      console.error(error);
      alert("Could not load responses.");
    } finally {
      setLoadingResponses(false);
    }
  };

  useEffect(() => {
    if (user && mode === "organizer") {
      loadResponses();
    }
  }, [user, mode]);

  /* ORGANIZER LOGIN */

  if (mode === "login") {
    return (
      <div className="min-h-screen bg-[#083D3A] flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-[#FFF4E0] rounded-3xl shadow-2xl p-7">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>

            <h1 className="text-2xl font-bold text-[#0B4F4A]">
              Organizer Login
            </h1>

            <p className="text-sm text-[#0B4F4A]/60 mt-1">
              Sign in to view RSVP responses
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-[#0B4F4A]">
                Email
              </label>

              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Organizer email"
                className="mt-2 w-full rounded-xl border-2 border-[#0E7C7B]/20 px-4 py-3 outline-none focus:border-[#0E7C7B] bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#0B4F4A]">
                Password
              </label>

              <input
                type="password"
                value={loginPassword}
                onChange={(e) =>
                  setLoginPassword(e.target.value)
                }
                placeholder="Password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") login();
                }}
                className="mt-2 w-full rounded-xl border-2 border-[#0E7C7B]/20 px-4 py-3 outline-none focus:border-[#0E7C7B] bg-white"
              />
            </div>

            {loginError && (
              <div className="rounded-xl bg-[#FF6F59]/10 border border-[#FF6F59]/30 text-[#FF6F59] p-3 text-sm">
                {loginError}
              </div>
            )}

            <button
              onClick={login}
              disabled={loggingIn}
              className="w-full rounded-xl py-3 bg-[#0E7C7B] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loggingIn ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <LogIn size={18} />
              )}

              {loggingIn ? "Logging in..." : "Login"}
            </button>

            <button
              onClick={() => setMode("rsvp")}
              className="w-full text-sm font-bold text-[#0B4F4A]/60"
            >
              ← Back to RSVP
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ORGANIZER DASHBOARD */

  if (mode === "organizer" && user) {
    return (
      <div className="min-h-screen bg-[#083D3A] p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#FFF4E0] rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#0E7C7B] p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[#FDB833] text-xs tracking-[0.2em] uppercase font-bold">
                  Organizer
                </p>

                <h1 className="text-2xl font-bold">
                  RSVP Responses 📋
                </h1>

                <p className="text-white/70 text-xs mt-1">
                  {user.email}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadResponses}
                  className="bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  Refresh
                </button>

                <button
                  onClick={logout}
                  className="bg-[#FF6F59] rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-[#0E7C7B]/10 rounded-xl p-3">
                  <Users
                    size={22}
                    className="text-[#0E7C7B]"
                  />
                </div>

                <div>
                  <p className="text-xs text-[#0B4F4A]/50">
                    Total responses
                  </p>

                  <p className="text-2xl font-bold text-[#0B4F4A]">
                    {responses.length}
                  </p>
                </div>
              </div>

              {loadingResponses ? (
                <div className="flex justify-center py-12">
                  <Loader2
                    className="animate-spin text-[#0E7C7B]"
                    size={32}
                  />
                </div>
              ) : responses.length === 0 ? (
                <div className="text-center py-12 text-[#0B4F4A]/50">
                  No responses yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div
                      key={response.id}
                      className="bg-white rounded-2xl border-2 border-[#0E7C7B]/10 p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-[#0B4F4A]">
                            {response.name}
                          </h2>

                          <p
                            className={`text-xs font-bold mt-1 ${
                              response.attending
                                ? "text-[#0E7C7B]"
                                : "text-[#FF6F59]"
                            }`}
                          >
                            {response.attending
                              ? "✓ Attending"
                              : "✕ Not attending"}
                          </p>
                        </div>

                        <span className="text-xs bg-[#FDB833]/20 text-[#0B4F4A] rounded-full px-3 py-1 font-bold">
                          {response.payment === "free"
                            ? "Free 🎉"
                            : "Pay on arrival 💵"}
                        </span>
                      </div>

                      {response.attending && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                          <div className="bg-[#FFF4E0] rounded-xl p-3">
                            <span className="text-[#0B4F4A]/50 block text-xs">
                              Places
                            </span>

                            <span className="font-bold text-[#0B4F4A]">
                              {response.places
                                ?.map(
                                  (id) =>
                                    PLACE_OPTIONS.find(
                                      (p) => p.id === id
                                    )?.label
                                )
                                .join(", ")}
                            </span>
                          </div>

                          <div className="bg-[#FFF4E0] rounded-xl p-3">
                            <span className="text-[#0B4F4A]/50 block text-xs">
                              Date & Time
                            </span>

                            <span className="font-bold text-[#0B4F4A]">
                              {response.date}{" "}
                              {response.time}
                            </span>
                          </div>

                          <div className="bg-[#FFF4E0] rounded-xl p-3 sm:col-span-2">
                            <span className="text-[#0B4F4A]/50 block text-xs">
                              Food
                            </span>

                            <span className="font-bold text-[#0B4F4A]">
                              {response.food
                                ?.map(
                                  (id) =>
                                    FOOD_OPTIONS.find(
                                      (f) => f.id === id
                                    )?.label
                                )
                                .join(", ")}
                            </span>
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-[#0B4F4A]/30 mt-3">
                        Submitted:{" "}
                        {response.submittedAt
                          ? new Date(
                              response.submittedAt
                            ).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-5">
            <button
              onClick={() => setMode("rsvp")}
              className="text-[#FFF4E0]/70 text-sm font-bold"
            >
              ← Back to RSVP
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* MAIN RSVP */

  return (
    <div
      className="min-h-screen w-full bg-[#083D3A] flex items-center justify-center p-4 sm:p-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(253,184,51,0.10), transparent 40%), radial-gradient(circle at 85% 80%, rgba(255,111,89,0.12), transparent 45%)",
      }}
    >
      <div className="relative w-full max-w-md">
        <span className="absolute -top-8 -left-3 text-3xl rotate-[-12deg] select-none pointer-events-none">
          ☀️
        </span>

        <span className="absolute -top-6 right-2 text-2xl rotate-[10deg] select-none pointer-events-none">
          🌴
        </span>

        <span className="absolute top-1/3 -right-6 text-2xl rotate-[8deg] select-none pointer-events-none hidden sm:block">
          🏖️
        </span>

        <span className="absolute bottom-10 -left-7 text-2xl rotate-[-6deg] select-none pointer-events-none hidden sm:block">
          🐚
        </span>

        <span className="absolute -bottom-6 right-6 text-2xl rotate-[14deg] select-none pointer-events-none">
          🍉
        </span>

        <div className="bg-[#FFF4E0] rounded-t-3xl shadow-2xl overflow-hidden">
          <div className="bg-[#0E7C7B] px-6 py-5 relative">
            <p className="text-[#FDB833] text-xs tracking-[0.2em] uppercase mb-1 font-bold">
              Boarding Pass
            </p>

            <h1 className="text-white text-2xl font-bold leading-tight">
              {EVENT.name}
            </h1>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[#FFF4E0]/90 text-xs">
              {form.places.length > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {selectedPlaceNames}
                </span>
              )}

              {form.date && (
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {form.date} {form.time}
                </span>
              )}
            </div>

            <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#083D3A]" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#083D3A]" />
          </div>

          <div className="border-t-2 border-dashed border-[#0E7C7B]/30 relative">
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#083D3A]" />
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#083D3A]" />
          </div>

          <div className="px-6 py-6 min-h-[280px] flex flex-col">
            {step === 0 && (
              <div className="flex flex-col gap-5 flex-1">
                <div>
                  <p className="text-[#0B4F4A] text-lg font-bold">
                    Hi Babe 😘
                  </p>

                  <p className="text-[#0B4F4A]/60 text-xs mt-1">
                    Fill this in so I can plan our day out ✨
                  </p>
                </div>

                <div>
                  <label className="text-[#0B4F4A] text-sm font-bold">
                    Your name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      update({ name: e.target.value })
                    }
                    placeholder="Enter your name"
                    className="mt-2 w-full rounded-xl border-2 border-[#0E7C7B]/20 focus:border-[#0E7C7B] outline-none px-4 py-3 bg-white text-[#0B4F4A]"
                  />
                </div>

                <div>
                  <label className="text-[#0B4F4A] text-sm font-bold">
                    Are you coming?
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        update({ attending: true })
                      }
                      className={`rounded-xl py-3 font-bold border-2 transition ${
                        form.attending === true
                          ? "bg-[#0E7C7B] border-[#0E7C7B] text-white"
                          : "border-[#0E7C7B]/20 text-[#0B4F4A] bg-white"
                      }`}
                    >
                      Yes, I'm in! 🎉
                    </button>

                    <button
                      onClick={() =>
                        update({ attending: false })
                      }
                      className={`rounded-xl py-3 font-bold border-2 transition ${
                        form.attending === false
                          ? "bg-[#FF6F59] border-[#FF6F59] text-white"
                          : "border-[#0E7C7B]/20 text-[#0B4F4A] bg-white"
                      }`}
                    >
                      Can't make it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4 flex-1">
                <p className="text-[#0B4F4A] text-sm font-bold">
                  Where do you want to go?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {PLACE_OPTIONS.map((place) => {
                    const active =
                      form.places.includes(place.id);

                    return (
                      <button
                        key={place.id}
                        onClick={() =>
                          togglePlace(place.id)
                        }
                        className={`relative rounded-xl p-3 flex flex-col items-center gap-1 border-2 transition ${
                          active
                            ? "bg-[#FDB833]/20 border-[#FDB833]"
                            : "border-[#0E7C7B]/15 bg-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1.5 right-1.5 bg-[#0E7C7B] rounded-full p-0.5">
                            <Check
                              size={10}
                              className="text-white"
                            />
                          </span>
                        )}

                        <span className="text-2xl">
                          {place.emoji}
                        </span>

                        <span className="text-xs font-bold text-[#0B4F4A] text-center">
                          {place.label}
                        </span>

                        {place.fixedNote && (
                          <span className="text-[9px] text-[#0B4F4A]/50 text-center leading-tight">
                            {place.fixedNote}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5 flex-1">
                <p className="text-[#0B4F4A] text-sm font-bold">
                  When are you joining?
                </p>

                <div className="rounded-xl bg-white border-2 border-[#0E7C7B]/20 p-4">
                  <label className="text-xs text-[#0B4F4A]/60 block">
                    Date
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      update({ date: e.target.value })
                    }
                    disabled={form.places.includes("musical")}
                    className="mt-1 w-full rounded-lg border-2 border-[#0E7C7B]/20 px-3 py-2 text-[#0B4F4A] bg-white outline-none disabled:bg-gray-100"
                  />

                  {form.places.includes("musical") && (
                    <p className="text-[10px] text-[#FF6F59] mt-2">
                      Musical Show — Heena is fixed on
                      22 Aug 2026, after 6pm 🎵
                    </p>
                  )}

                  <label className="text-xs text-[#0B4F4A]/60 mt-3 block">
                    Time
                  </label>

                  <select
                    value={form.time}
                    onChange={(e) =>
                      update({ time: e.target.value })
                    }
                    disabled={form.places.includes("musical")}
                    className="mt-1 w-full rounded-lg border-2 border-[#0E7C7B]/20 px-3 py-2 text-[#0B4F4A] bg-white outline-none disabled:bg-gray-100"
                  >
                    {[
                      "08:30 AM",
                      "09:00 AM",
                      "09:30 AM",
                      "10:00 AM",
                      "10:30 AM",
                      "11:00 AM",
                      "12:00 PM",
                      "01:00 PM",
                      "02:00 PM",
                      "03:00 PM",
                      "04:00 PM",
                      "05:00 PM",
                      "06:00 PM",
                      "06:30 PM",
                      "07:00 PM",
                      "07:30 PM",
                      "08:00 PM",
                      "08:30 PM",
                      "09:00 PM",
                    ].map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4 flex-1">
                <p className="text-[#0B4F4A] text-sm font-bold">
                  What do you want to eat?
                </p>

                <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-72 pr-1">
                  {FOOD_OPTIONS.map((food) => {
                    const active =
                      form.food.includes(food.id);

                    return (
                      <button
                        key={food.id}
                        onClick={() =>
                          toggleFood(food.id)
                        }
                        className={`relative rounded-xl p-3 flex flex-col items-center gap-1 border-2 transition ${
                          active
                            ? "bg-[#FDB833]/20 border-[#FDB833]"
                            : "border-[#0E7C7B]/15 bg-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1.5 right-1.5 bg-[#0E7C7B] rounded-full p-0.5">
                            <Check
                              size={10}
                              className="text-white"
                            />
                          </span>
                        )}

                        <span className="text-2xl">
                          {food.emoji}
                        </span>

                        <span className="text-xs font-bold text-[#0B4F4A] text-center">
                          {food.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-5 flex-1">
                <p className="text-[#0B4F4A] text-sm font-bold">
                  Payment method
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() =>
                      update({ payment: "arrival" })
                    }
                    className={`rounded-xl py-4 px-4 font-bold border-2 flex items-center justify-center gap-2 ${
                      form.payment === "arrival"
                        ? "bg-[#0E7C7B] border-[#0E7C7B] text-white"
                        : "border-[#0E7C7B]/20 text-[#0B4F4A] bg-white"
                    }`}
                  >
                    <CreditCard size={16} />
                    Pay when I arrive 💵
                  </button>

                  <button
                    onClick={() =>
                      update({ payment: "free" })
                    }
                    className={`rounded-xl py-4 px-4 font-bold border-2 ${
                      form.payment === "free"
                        ? "bg-[#FDB833] border-[#FDB833] text-[#0B4F4A]"
                        : "border-[#0E7C7B]/20 text-[#0B4F4A] bg-white"
                    }`}
                  >
                    Free 🎉
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col items-center text-center gap-3 flex-1 justify-center">
                {form.attending === false ? (
                  <>
                    <span className="text-4xl">🥺</span>

                    <p className="text-[#0B4F4A] font-bold text-lg">
                      Aww okay, {form.name} 💔
                    </p>

                    <p className="text-[#0B4F4A]/60 text-sm">
                      We'll miss you, babe. Next time for sure!
                    </p>
                  </>
                ) : (
                  <>
                    <PartyPopper
                      className="text-[#FDB833]"
                      size={36}
                    />

                    <p className="text-[#0B4F4A] font-bold text-lg">
                      Yay, can't wait babe! 💕
                    </p>

                    <div className="w-full text-left bg-white rounded-xl border-2 border-[#0E7C7B]/15 p-4 mt-2 text-sm text-[#0B4F4A] space-y-2">
                      <p>
                        <span className="text-[#0B4F4A]/50">
                          Name:
                        </span>{" "}
                        {form.name}
                      </p>

                      <p>
                        <span className="text-[#0B4F4A]/50">
                          Places:
                        </span>{" "}
                        {selectedPlaceNames}
                      </p>

                      <p>
                        <span className="text-[#0B4F4A]/50">
                          Date:
                        </span>{" "}
                        {form.date}
                      </p>

                      <p>
                        <span className="text-[#0B4F4A]/50">
                          Time:
                        </span>{" "}
                        {form.time}
                      </p>

                      <p>
                        <span className="text-[#0B4F4A]/50">
                          Food:
                        </span>{" "}
                        {selectedFoodNames}
                      </p>

                      <p>
                        <span className="text-[#0B4F4A]/50">
                          Payment:
                        </span>{" "}
                        {form.payment === "free"
                          ? "Free 🎉"
                          : "Pay when I arrive 💵"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {step < 5 && (
          <div className="bg-[#FFF4E0] rounded-b-3xl shadow-2xl px-6 pb-6 pt-1 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-1 text-[#0B4F4A]/60 disabled:opacity-0 text-sm font-bold"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === step
                      ? "bg-[#0E7C7B]"
                      : "bg-[#0E7C7B]/20"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={!canProceed() || saving}
              className="flex items-center gap-1 text-[#0E7C7B] disabled:opacity-30 text-sm font-bold"
            >
              {step === 4 ? "Confirm" : "Next"}
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="bg-[#FFF4E0] rounded-b-3xl shadow-2xl px-6 pb-6 pt-1">
            <button
              onClick={() => setMode("login")}
              className="w-full text-xs text-[#0B4F4A]/40 hover:text-[#0B4F4A] py-2"
            >
              Organizer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}