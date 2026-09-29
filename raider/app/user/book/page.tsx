"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Bike,
  Car,
  CheckCircle,
  ChevronRight,
  Droplet,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Truck,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { vehicleType } from "@/models/vehicle.model";

const stepVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const VEHICLE = [
  { id: "bike", label: "Bike", Icon: Bike, desc: "Quick & affortable" },
  { id: "auto", label: "Auto", Icon: Car, desc: "EveryDay rides" },
  { id: "car", label: "Car", Icon: Car, desc: "Comfort rides" },
  { id: "loading", label: "Loading", Icon: Truck, desc: "Small Cargo" },
  { id: "tuck", label: "Truck", Icon: Truck, desc: "Heavy transport" },
];

type place = {
  id: string;
  name: string;
  country?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  lat: number;
  lng: number;
};
function Page() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<vehicleType>();
  const [mobile, setMobile] = useState("");
  const [pickUp, setPickUp] = useState("");
  const [drop, setDrop] = useState("");
  const [pickUpCountry, setPickUpCountry] = useState("");
  const [pickUpLat, setPickUpLat] = useState<number | "">("");
  const [pickUpLog, setPickUpLog] = useState<number | "">("");
  const [dropCountry, setDropCountry] = useState("");
  const [dorpLat, setDropLat] = useState<number | "">("");
  const [dropLog, setDropLog] = useState<number | "">("");
  const [locating, setLocating] = useState(false);
  const [pickUpSuggestions, setPickUpSuggestions] = useState<place[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<place[]>([]);
  const progress = [
    !!vehicle,
    !!(mobile.length == 10),
    !!pickUp,
    !!drop,
  ].filter(Boolean).length;

  const canContinue = !!(
    vehicle &&
    mobile &&
    pickUp &&
    drop &&
    pickUpLat &&
    pickUpLog &&
    dropLog &&
    dorpLat
  );

  const searchAddress = async (
    q: string,
    setResults: (r: place[]) => void,
    restrict?: string | null,
  ) => {
    try {
      if (!q || q.trim().length < 3) {
        setResults([]);
        return;
      }
      const { data } = await axios.get(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q.trim())}&limit=8&lang=en`,
      );
      let results: place[] = (data.features ?? []).map((f: any) => ({
        id: String(f.properties.id),
        name: f.properties.name,
        country: f.properties.country,
        city: f.properties.city,
        state: f.properties.state,
        countryCode: f.properties.countryCode,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      }));
      if (restrict) {
        results = results.filter((p) => p.country === restrict);
      }
      setResults(results);
    } catch (error) {
      setResults([]);
      console.log(error);
    }
  };
  const suggestion = (p: place) =>
    [p.name, p.country, p.city, p.state].filter(Boolean).join(", ");

  const useCurrentLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { data } = await axios.get(
          `https://photon.komoot.io/reverse?lon=${position.coords.longitude}&lat=${position.coords.latitude}`,
        );
        if (data.features.length) {
          const p = data.features[0].properties;
          const address = [
            p.name,
            p.street,
            p.country,
            p.city,
            p.state,
            p.postcode
          ]
            .filter(Boolean)
            .join(", ");
          setPickUp(address);
          setPickUpCountry(p.country);
          setPickUpLat(data.features[0].geometry.coordinates[1]);
          setPickUpLog(data.features[0].geometry.coordinates[0]);
          setPickUpSuggestions([]);
          setLocating(false);
        }
      } catch (error) {
        setLocating(false);
      }
    });
  };
  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-4 mb-6 px-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => router.push("/")}
            className="w-11 h-11 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={13} className="text-zinc-900" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-zinc-900 text-xl font-black tracking-tight">
              Book a Ride
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              Fill in the details below
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {[0, 1, 2, 3].map((d, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i < progress ? 20 : 8,
                  background: i < progress ? "#09090b" : "#d4d4d8",
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-visible">
          <div className="h-1 bg-zinc-900 w-[90%] m-auto" />
          <div className="p-6 space-y-7">
            <motion.div
              variants={stepVariants}
              initial={"hidden"}
              animate={"visible"}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-back">1</span>
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  choose Vehicle
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {VEHICLE.map((v, i) => {
                  const active = vehicle == v.id;
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.07 + 1 * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setVehicle(v.id as vehicleType)}
                      className={`relative p-3.5 rounded-2xl border flex items-center 
                    gap-3 text-left transition-all duration-200
                     ${
                       active
                         ? "bg-zinc-900 border-zinc-900 shadow-lg"
                         : "bg-zinc-50 border-zinc-200 hover:border-zinc-400"
                     }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-white" : "bg-zinc-200"}`}
                      >
                        <v.Icon
                          size={18}
                          className={`ative ? 'text-zinc-900' : 'text-zinc-500' `}
                        />
                      </div>
                      <div className="minw-0">
                        <p
                          className={`text-sm font-bold truncate ${active ? "text-white" : "text-zinc-900"}`}
                        >
                          {v.label}
                        </p>
                        <p
                          className={`text-xs font-semibold ${active ? "text-white" : "text-zinc-900"}`}
                        >
                          {v.desc}
                        </p>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2.5 right-2.5"
                      >
                        <CheckCircle
                          size={13}
                          className="text-white fill-white/20"
                        />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
            <div className="h-px bg-zinc-800" />
            <motion.div
              variants={stepVariants}
              initial={"hidden"}
              animate={"visible"}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-back">2</span>
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Mobile Number
                </p>
              </div>
              <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-zinc-900 focus-within:bg-white transition-all">
                <div className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-zinc-600" />
                </div>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="Enter your mobile number"
                  className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <AnimatePresence>
                  {mobile.length == 10 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckCircle
                        size={16}
                        className="text-emerald-500 fill-emerald-50 flex-shrink-0"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-zinc-400 text-[10px] mt-1.5 ml-1">
                Ride updates will be sent to your mobile number
              </p>
            </motion.div>
            <div className="h-px bg-zinc-800" />
            <motion.div
              variants={stepVariants}
              initial={"hidden"}
              animate={"visible"}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[9px] font-back">3</span>
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Route
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-visible">
                <div className="relative z-30">
                  <div className="flex items-center gap-3 px-4 py-3.5 focus-within:bg-white rounded-t-2xl transition-colors">
                    <div className="flex flex-col items-center  flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white shadow" />
                      <div className="w-px h-5 bg-zinc-300 mt-1" />
                    </div>
                    <input
                      onChange={(e) => {
                        setPickUp(e.target.value);
                        searchAddress(e.target.value, setPickUpSuggestions);
                      }}
                      value={pickUp}
                      placeholder="Pickup Location"
                      className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                    />
                    <motion.button
                      onClick={useCurrentLocation}
                      whileTap={{ scale: 0.95 }}
                      disabled={locating}
                      className="w-8 h-8 cursor-pointer rounded-xl bg-zinc-200 hover:bg-zinc-300 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      <LocateFixed
                        size={14}
                        className={`text-zinc-700 ${locating ? "animate-spin" : ""}`}
                      />
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {pickUpSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-zinc-200 max-h-28 overflow-y-auto z-50"
                      >
                        {pickUpSuggestions.map((p, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                            onClick={() => {
                              setPickUp(suggestion(p));
                              setPickUpCountry(p.country ?? "");
                              setPickUpLat(p?.lat);
                              setPickUpLog(p?.lng);
                              setPickUpSuggestions([]);
                            }}
                          >
                            <MapPin
                              size={13}
                              className="text-zinc-400 flex-shrink-0"
                            />
                            <span className="text-sm font-medium truncate text-zinc-800">
                              {suggestion(p)}
                            </span>
                            <ChevronRight
                              size={13}
                              className="text-zinc-300 flex-shrink-0 ml-auto"
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-zinc-800 w-full" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 px-4 py-3.5 focus-within:bg-white rounded-t-2xl transition-colors">
                    <div className="flex flex-col items-center  flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white shadow" />
                    </div>

                    <input
                      onChange={(e) => {
                        setDrop(e.target.value);
                        searchAddress(
                          e.target.value,
                          setDropSuggestions,
                          pickUpCountry,
                        );
                      }}
                      disabled={!pickUpCountry}
                      value={drop}
                      placeholder={
                        pickUpCountry
                          ? "Drop Location"
                          : "Select PickUp Location First"
                      }
                      className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                    />
                    <Navigation
                      size={14}
                      className="text-zinc-300 flx-shrink-0"
                    />
                  </div>
                  <AnimatePresence>
                    {dropSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-y-auto z-50"
                      >
                        {dropSuggestions.map((p, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                            onClick={() => {
                              setDrop(suggestion(p));
                              setDropCountry(p.country ?? "");
                              setDropLat(p.lat);
                              setDropLog(p.lng);
                              setDropSuggestions([]);
                            }}
                          >
                            <Navigation
                              size={13}
                              className="text-zinc-400 flex-shrink-0"
                            />
                            <span className="text-sm font-medium truncate text-zinc-800">
                              {suggestion(p)}
                            </span>
                            <ChevronRight
                              size={13}
                              className="text-zinc-300 flex-shrink-0 ml-auto"
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={stepVariants}
              initial={"hidden"}
              animate={"visible"}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={!canContinue}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  router.push(
                    `/user/search?pickup=${encodeURIComponent(pickUp)}&drop=${encodeURIComponent(drop)}&vehicle=${encodeURIComponent(vehicle!)}&mobile=${encodeURIComponent(mobile)}&pickupLat=${pickUpLat}&pickupLog=${pickUpLog}
                    &dropLat=${dorpLat}
                    &dropLog=${dropLog}`
                  );
                }}
                className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-black disabled:opacity-10 text-white text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-colors shadow-lg disabled:shadow-none"
              >
                <span>Continue</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Page;
