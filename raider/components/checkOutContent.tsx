"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Bike,
  Car,
  CheckCircle,
  Clock,
  CreditCard,
  IndianRupee,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { getSocket } from "@/lib/soket";

const VEHICLE_META: Record<string, { label: string; Icon: LucideIcon }> = {
  bike: { label: "Bike", Icon: Bike },
  auto: { label: "Auto", Icon: Car },
  car: { label: "Car", Icon: Car },
  loading: { label: "Loading", Icon: Truck },
  truck: { label: "Truck", Icon: Truck },
};

type Status =
  | "idle"
  | "requested"
  | "awaiting_payment"
  | "confirmed"
  | "rejected"
  | "expired";

type CheckoutBooking = {
  _id: string;
  bookingStatus: Status;
};

function CheckOutContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [pickup, setPickup] = useState(params.get("pickup") ?? "");
  const [drop, setDrop] = useState(params.get("drop") ?? "");
  const mobile = params.get("mobile") ?? "";
  const vehicle = params.get("vehicle") ?? "";
  const vehicleId = params.get("vehicleId") ?? "";
  const driverId = params.get("driverId") ?? "";
  const fare = params.get("fare") ?? "";
  const pickupLat = params.get("pickupLat") ?? "";
  const pickupLog = params.get("pickupLog") ?? "";
  const dropLat = params.get("dropLat") ?? "";
  const dropLog = params.get("dropLog") ?? "";
  const { Icon } = VEHICLE_META[vehicle] ?? VEHICLE_META.car;
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<CheckoutBooking>();
  const [requestError, setRequestError] = useState("");

  const handleRequestBooking = async () => {
    setRequestError("");
    try {
      setLoading(true);
      const { data } = await axios.post("/api/booking/create", {
        driverId,
        vehicleId,
        pickUpAddress: pickup,
        dropAddress: drop,
        pickUpLocation: {
          type: "Point",
          coordinates: [pickupLog, pickupLat],
        },
        dropLocation: {
          type: "Point",
          coordinates: [dropLog, dropLat],
        },
        fare: Number(fare),
        mobileNumber: mobile,
      });
      setBooking(data);
      setLoading(false);
      setStatus("requested");
      router.push(`/user/ride/${data._id}`);
    } catch (error: unknown) {
      setLoading(false);
      setRequestError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Could not request this ride."
          : "Could not request this ride.",
      );
    }
  };

  useEffect(() => {
    const socket = getSocket();
    socket.on("accept-booking", (data) => {
      setStatus("confirmed");
      if (data?.bookingId) {
        router.push(`/user/ride/${data.bookingId}`);
      }
    });

    socket.on("reject-booking", (data) => {
      setStatus(data);
    });

    axios
      .get("/api/user/me")
      .then(({ data }) => {
        socket.emit("identify", data._id);
      })
      .catch((error) => {
        console.log("socket identify error", error);
      });

    return () => {
      socket.off("accept-booking");
      socket.off("reject-booking");
    };
  }, []);

  const fetchActiveBookings = async () => {
    try {
      const { data } = await axios.get("/api/booking/active");
      if (!data.booking || typeof data.booking !== "object") {
        setBooking(undefined);
        setStatus("idle");
        return;
      }
      setBooking(data.booking);
      setStatus(data.booking.bookingStatus);
      if (["awaiting_payment", "confirmed", "started"].includes(data.booking.bookingStatus)) {
        router.replace(`/user/ride/${data.booking._id}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    try {
      await axios.post(`/api/booking/${booking._id}/cancel`);
      setStatus("idle");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchActiveBookings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-12">
      <div className="relative max-w-6xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-zinc-900" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Booking
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">
            Checkout
          </h1>
          <p className="text-zinc-400 text-sm mt-1.5 font-medium">
            Review your ride and confirm
          </p>
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.08,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="bg-white rounded-3xl border border-zinc-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden"
          >
            <div className="h-1 bg-zinc-900" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-1">
                    Selected Vehicle
                  </div>
                  <div className="text-3xl font-black tracking-tight text-zinc-900">
                    {vehicle}
                  </div>
                </div>
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon size={20} className="text-zinc-400" />
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden mb-8">
                <div className="flex gap-4 px-5 py-4 border-b border-zinc-100">
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
                    <div className="w-px flex-1 bg-zinc-300 my-1 style={{minHeight:12}}" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.18] text-zinc-400 mb-0.5">
                      Pickup
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 leading-snug truncate">
                      {pickup}
                    </div>
                  </div>
                  <MapPin
                    size={14}
                    className="text-zinc-400 flex-shrink-0 mt-1"
                  />
                </div>
                <div className="flex gap-4 px-5 py-4 border-b border-zinc-100">
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.18] text-zinc-400 mb-0.5">
                      Drop
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 leading-snug truncate">
                      {drop}
                    </div>
                  </div>
                  <Navigation
                    size={14}
                    className="text-zinc-400 flex-shrink-0 mt-1"
                  />
                </div>
              </div>

              <div className="flex items-end justify-between  pt-6 border-t border-zinc-100">
                <div>
                  <p className="text-[10px] font-black uppercasetrackin-[0.18em] text-zinc-400 mb-1">
                    Total Fare
                  </p>
                  <p className="text-zinc-400 text-xs font-medium">
                    Includes base + distance charges
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="text-zinc-400 text-lg font-black">
                    <IndianRupee />
                  </span>
                  <span className="text-zinc-900 text-5xl font-black tracking-tight leading-none">
                    {fare}
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.14,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="bg-white rounded-3xl border border-zinc-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col"
          >
            <div className="h-1 bg-zinc-900" />
            <div className="flex-1 p-8 sm:p-10 flex flex-col">
              <AnimatePresence mode="wait">
                {(status === "idle" || status === "rejected") && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col flex-1 justify-between"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-1">
                        Ready to go?
                      </p>
                      <h3 className="text-2xl font-black text-zinc-900 mb-6">
                        Confirm Your Ride
                      </h3>
                      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 space-y-3">
                        {[
                          {
                            icon: <Clock size={14} />,
                            text: "Driver will respond to your ride request",
                          },
                          {
                            icon: <ShieldCheck size={14} />,
                            text: "Verified & insured drivers only",
                          },
                          {
                            icon: <CreditCard size={14} />,
                            text: "Pay after the ride, then confirm drop with OTP",
                          },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-600 flex-shrink-0">
                              {item.icon}
                            </div>
                            <p className="text-zinc-500 text-xs font-semibold">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={handleRequestBooking}
                      disabled={loading}
                      className="w-full h-14 mt-8 bg-zinc-900 hover:bg-black disabled:opacity-40
                     text-white font-black text-sm rounded-2xl flex items-center justify-center
                     gap-2.5 transition-colors shadow-md"
                    >
                      <span>{loading ? "Sending Request..." : "Request Ride"}</span>
                      {!loading && <ArrowRight size={15} />}
                    </motion.button>
                    {requestError && (
                      <p role="alert" className="mt-3 text-sm text-red-600">
                        {requestError}
                      </p>
                    )}
                  </motion.div>
                )}
                {status == "requested" && (
                  <motion.div
                    key="requested"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col flex-1 items-center justify-center gap-6 text-center"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className="absolute inset-0 rounded-full bg-zinc-900"
                      />
                      <div className="relative w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center                   ">
                        <Loader2
                          size={28}
                          className="animate-spin text-zinc-900"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-zinc-900 mb-1">
                        Finding Your Driver
                      </h3>
                      <p className="text-zinc-400 text-sm font-medium">
                        Waiting for driver to accept ....
                      </p>
                    </div>

                    <motion.div
                      onClick={handleCancel}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors border
                    border-zinc-200 hover:border-zinc-400 px-4 py-2.5 rounded-xl"
                    >
                      <XCircle size={13} />
                      Cancel Request
                    </motion.div>
                  </motion.div>
                )}

                {status == "awaiting_payment" && (
                  <motion.div
                    key="awaiting_payment"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col flex-1 items-center justify-center gap-5 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 16,
                      }}
                      className="w-20 h-20 rounded-full bg-zinc-100 border-2 
                  border-zinc-200 flex items-center justify-center"
                    >
                      <CheckCircle size={36} className="text-zinc-900" />
                    </motion.div>

                    <div className="flex flex-col items-center">
                      <h3 className="text-xl font-black text-zinc-900 mb-1">
                        Driver has accepted your request
                      </h3>
                      <p className="text-zinc-400 text-sm font-medium">
                        Preparing payment option...
                      </p>
                    </div>
                    <div className="w-48 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2 }}
                        className="h-full bg-zinc-900 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}

                {status === "confirmed" && booking && (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col flex-1 items-center justify-center gap-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 240,
                        damping: 14,
                        delay: 0.1,
                      }}
                      className="relative"
                    >
                      <div
                        className="w-24 h-24 rounded-full 
                        bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center"
                      >
                        <CheckCircle size={44} className="text-zinc-900" />
                      </div>
                      {[0, 1].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 2.2 + i * 0.6, opacity: 0 }}
                          transition={{ duration: 0.9, delay: 0.2 + i * 0.15 }}
                          className="absolute inset-0 rounded-full border-2 border-zinc-900"
                        />
                      ))}
                    </motion.div>
                    <div>
                      <motion.h3
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-black text-zinc-900 mb-1"
                      >
                        Ride Confirmed!
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-zinc-400 text-sm font-medium max-w-xs"
                      >
                        Your driver is on the way. Track live from the ride
                        screen.
                      </motion.p>
                    </div>
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      onClick={() => {
                        router.push(`/user/ride/${booking._id}`);
                      }}
                      className="flex items-center gap-2.5 bg-zinc-900 hover:lg-black text-white font-black text-sm
                      px-8 py-4 rounded-2xl transition-colors shadow-md"
                    >
                      Track Your Ride
                      <ArrowRight size={16} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default CheckOutContent;
