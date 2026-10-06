"use client";
import { BookingStatus, IBooking, PaymentStatus } from "@/models/booking.modal";
import axios from "axios";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronUp,
  KeyRound,
  MapPin,
  Zap,
} from "lucide-react";
import PanelContent from "@/components/panelContent";
import { getSocket } from "@/lib/soket";
import CompletedScreen from "@/components/completedScreen";

const LiveRideMap = dynamic(() => import("@/components/liveRideMap"), {
  ssr: false,
});

const MAP_STATUS: Record<BookingStatus, "arriving" | "ongoing" | "completed"> =
  {
    idle: "arriving",
    requested: "arriving",
    awaiting_payment: "arriving",
    confirmed: "arriving",
    started: "ongoing",
    completed: "completed",
    cancelled: "completed",
    rejected: "completed",
    expired: "completed",
  };

const STATUS_LABEL: Record<
  BookingStatus,
  { label: string; sublabel: string; dot: string }
> = {
  idle: {
    label: "Awaiting Confirmation",
    sublabel: "Booking is being processed",
    dot: "bg-amber-400",
  },
  requested: {
    label: "Awaiting Confirmation",
    sublabel: "Booking is being processed",
    dot: "bg-amber-400",
  },
  awaiting_payment: {
    label: "Payment Pending",
    sublabel: "Customer payment is pending",
    dot: "bg-purple-400",
  },
  confirmed: {
    label: "Heading to Pickup",
    sublabel: "Drive to the pickup location",
    dot: "bg-amber-400",
  },
  started: {
    label: "Ride in Progress",
    sublabel: "Heading to drop location",
    dot: "bg-emerald-400",
  },
  completed: {
    label: "Ride Completed",
    sublabel: "Trip has ended successfully",
    dot: "bg-zinc-400",
  },
  cancelled: {
    label: "Ride Cancelled",
    sublabel: "This ride has been cancelled",
    dot: "bg-red-400",
  },
  rejected: {
    label: "Ride Rejected",
    sublabel: "Ride was rejected",
    dot: "bg-red-400",
  },
  expired: {
    label: "Request Expired",
    sublabel: "Booking timed out",
    dot: "bg-orange-400",
  },
};

const PAYMENT_BADGE: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-700",
  },
  paid: {
    label: "Paid",
    cls: "bg-emerald-100 text-emerald-700",
  },
  cash: {
    label: "Cash",
    cls: "bg-zinc-100 text-zinc-700",
  },
  failed: {
    label: "Failed",
    cls: "bg-red-100 text-red-700",
  },
};

function Page() {
  const [bookings, setBookings] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [pickUpPos, setPickUpPos] = useState<[number, number] | null>(null);
  const [dropPos, setDropPos] = useState<[number, number] | null>(null);
  const [distanceTopPickUp, setDistanceTopPickUp] = useState(0);
  const [distanceTopDrop, setDistanceTopDrop] = useState(0);
  const [etaToPickUp, setEtaToPickUp] = useState(0);
  const [etaToDrop, setEtaToDrop] = useState(0);
  const [status, setStatus] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [expand, setExpand] = useState(false);
  // pick otp
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  // drop otp
  const [dropOtp, setDropOtp] = useState("");
  const [dropOtpSending, setDropOtpSending] = useState(false);
  const [dropOtpSent, setDropOtpSent] = useState(false);
  const [loadingDropOtp, setLoadingDropOtp] = useState(false);
  const [dropOtpError, setDropOtpError] = useState("");
  const dropOtpRequestedFor = useRef<string | null>(null);

  const handleSendPickupOtp = async () => {
    try {
      const { data } = await axios.post(
        "/api/partner/bookings/otp/pickup/send",
        {
          bookingId: bookings?._id,
        },
      );
      console.log("first", data);
      setOtpMode(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSendDropOtp = useCallback(async (bookingId: string, resend = false) => {
    setDropOtpError("");
    setDropOtpSending(true);
    try {
      await axios.post("/api/partner/bookings/otp/drop/send", {
        bookingId,
        resend,
      });
      setDropOtpSent(true);
    } catch (error) {
      console.log(error);
      setDropOtpSent(false);
      setDropOtpError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Could not send drop OTP"
          : "Could not send drop OTP",
      );
    } finally {
      setDropOtpSending(false);
    }
  }, []);

  const handleVerifyPickupOtp = async () => {
    setLoadingOtp(true);
    try {
      const { data } = await axios.post(
        "/api/partner/bookings/otp/pickup/verify",
        {
          bookingId: bookings?._id,
          otp,
        },
      );
      setOtpVerified(true);
      setLoadingOtp(false);
      setOtpMode(false);
      setStatus("started");
      setBookings((prev) =>
        prev ? { ...prev, bookingStatus: "started" } : prev,
      );
      console.log("first", data);
    } catch (error: unknown) {
      console.log(error);
      setLoadingOtp(false);
      setOtpError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Verification failed"
          : "Verification failed",
      );
    }
  };

  const handleVerifyDropOtp = async () => {
    setLoadingDropOtp(true);
    try {
      const { data } = await axios.post(
        "/api/partner/bookings/otp/drop/verify",
        {
          bookingId: bookings?._id,
          otp: dropOtp,
        },
      );
      setLoadingDropOtp(false);
      setStatus("completed");
      setBookings((prev) =>
        prev ? { ...prev, bookingStatus: "completed" } : prev,
      );
      setDropOtp("");
    } catch (error: unknown) {
      console.log(error);
      setLoadingDropOtp(false);
      setDropOtpError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Verification failed"
          : "Verification failed",
      );
    }
  };

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const { data } = await axios.get("/api/partner/my-active");
        if (!mounted) return;

        if (!data) {
          setBookings((previous) =>
            previous?.bookingStatus === "completed" ? previous : null,
          );
          return;
        }
        setBookings((previous) => {
          if (!previous || previous._id.toString() !== data._id.toString()) {
            return data;
          }

          const paymentWasRecorded =
            previous.paymentStatus === "paid" || previous.paymentStatus === "cash";
          if (
            paymentWasRecorded &&
            data.paymentStatus === "pending"
          ) {
            return { ...data, paymentStatus: previous.paymentStatus };
          }

          return data;
        });
        setStatus(data.bookingStatus);
        setPickUpPos([
          data.pickUpLocation.coordinates[1],
          data.pickUpLocation.coordinates[0],
        ]);
        setDropPos([
          data.dropLocation.coordinates[1],
          data.dropLocation.coordinates[0],
        ]);
      } catch (error) {
        console.log(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    const interval = window.setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const bookingId = bookings?._id.toString();
    if (
      !bookings ||
      !bookingId ||
      status !== "started" ||
      !["paid", "cash"].includes(bookings.paymentStatus) ||
      dropOtpRequestedFor.current === bookingId
    ) {
      return;
    }

    dropOtpRequestedFor.current = bookingId;
    void handleSendDropOtp(bookingId);
  }, [bookings?._id, bookings?.paymentStatus, handleSendDropOtp, status]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const socket = getSocket();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        setDriverPos([lat, long]);
        socket.emit("driver-location-update", {
          bookingId: bookings?._id,
          latitude: lat,
          longitude: long,
          status: status,
        });
      },
      (error) => {
        console.log("gps error", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      },
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [bookings?._id]);

  useEffect(() => {
    if (!bookings?._id) return;
    const socket = getSocket();
    socket.emit("join-ride", bookings?._id);
    socket.on("driver-location", ({ latitude, longitude }) => {
      setDriverPos([latitude, longitude]);
    });
    return () => {
      socket.off("join-ride");
      socket.off("driver-location");
    };
  }, [bookings?._id]);

  const onChatToggle = () => {
    setChatOpen(!chatOpen);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-white/40 text-sm tracking-widest uppercase font-medium">
            Loading Ride...
          </p>
        </div>
      </div>
    );
  }

  if (!bookings) {
    return (
      <div
        className="h-screen w-full bg-black flex items-center justify-center
    text-[20px] text-white"
      >
        No Active Ride Found
      </div>
    );
  }

  if (status === "completed" && bookings) {
    return <CompletedScreen booking={bookings} role="driver" />;
  }

  const cgf = STATUS_LABEL[bookings?.bookingStatus ?? "confirmed"];
  const isActive = ["confirmed", "started"].includes(status);
  const displayEta = status === "confirmed" ? etaToPickUp : etaToDrop;
  const displayDistance =
    status === "confirmed" ? distanceTopPickUp : distanceTopDrop;
  const canChat = bookings?.bookingStatus === "confirmed";
  const paymentStatus = PAYMENT_BADGE[bookings?.paymentStatus ?? "pending"];
  const panelProps = {
    isActive,
    displayDistance,
    displayEta,
    cgf,
    status,
    bookings,
    paymentStatus,
    canChat,
    chatOpen,
    onChatToggle,
    currentRole: "driver",
  };

  return (
    <div className="h-screen w-full bg-zinc-100 flex flex-col lg:flex-row overflow-hidden">
      <div className="relative flex-1 h-full z-0">
        <LiveRideMap
          driverLocation={driverPos}
          pickUpLocation={pickUpPos}
          dropLocation={dropPos}
          mapStatus={MAP_STATUS[bookings?.bookingStatus ?? "idle"]}
          onStats={({
            distanceToPickUp,
            etaToPickUp,
            distanceToDrop,
            etaToDrop,
          }) => {
            setDistanceTopPickUp(distanceToPickUp);
            setEtaToPickUp(etaToPickUp);
            setDistanceTopDrop(distanceToDrop);
            setEtaToDrop(etaToDrop);
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-none"
        >
          <div
            className="flex items-center gap-2 bg-white/95
          backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-zinc-100"
          >
            <span
              className={`w-2 h-2 rounded-full ${cgf?.dot} animate-pulse`}
            />
            <span className="text-xs font-semibold tracking-wide text-zinc-900">
              {cgf?.label}
            </span>
          </div>
        </motion.div>
      </div>

      {/* desktop view */}

      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-[420px] xl:w-[460px] bg-white border-1 border-zinc-100
       flex-col overflow-hidden"
      >
        <div className="bg-zinc-950 px-6 py-5 flex-shrink-0">
          <p className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-semibold mb-1">
            Driver Panel
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl font-bold">Active Ride</h1>
            {isActive && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Zap size={12} className="text-amber-400" />
                <span className="text-white font-semibold text-xs">
                  {Math.round(displayEta)} min
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scorllbar-hide">
            <PanelContent {...panelProps} />
          </div>

          <div className="flex-shrink-0 border-t border-zinc-100 bg-white px-5 py-4">
            <AnimatePresence mode="wait">
              {status === "confirmed" && !otpMode && !otpVerified && (
                <motion.button
                  key="arrived"
                  onClick={() => handleSendPickupOtp()}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 active:scale-[0.97]
                    text-white py-4 rounded-2xl font-bold text-sm tracking-widde
                    transition-all flex items-center justify-center gap-2"
                >
                  <MapPin size={16} /> Arrived at Pickup
                  <ArrowRight size={15} />
                </motion.button>
              )}

              {status === "confirmed" && otpMode && !otpVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden"
                >
                  <div className="bg-zinc-950 px-4 py-3 flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-400" />
                    <p className="text-white text-xs font-bold tracking-wide uppercase">
                      Enter Customer OTP
                    </p>
                  </div>
                  <div className="p-4 spacee-y-3">
                    <p className="text-xs text-zinc-500">
                      Ask the customer for their 4-digit OTP to start the ride
                    </p>
                    <div className="flex justify-center">
                      <input
                        type="text"
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          setOtpError("");
                        }}
                        placeholder="- - - -"
                        className="w-48 border-2 border-zinc-200 
                          focus:border-zinc-900 rounded-xl px-4 py-3
                          text-center text-2xl tracking-[0.5em] font-black
                          outline-none transition-colors"
                      />
                    </div>

                    {otpError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-xs text-center font-medium"
                      >
                        {otpError}
                      </motion.p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setOtpMode(false);
                          setOtp("");
                          setOtpError("");
                        }}
                        className="flex-1 border border-zinc-200 bg-white text-zinc-700 py-2.5
                          rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleVerifyPickupOtp}
                        disabled={loadingOtp || otp.length < 4}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800
                      disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.97]      
                      transition-all"
                      >
                        {loadingOtp ? (
                          <span className="flex items-center justify-center gap-2">
                            Verifying...
                          </span>
                        ) : (
                          <span>Verify OTP</span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === "started" && bookings.paymentStatus === "pending" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Ask the customer to pay the fare of ₹{bookings.fare.toFixed(2)} first. The drop OTP is sent after payment.
                </div>
              )}
              {status === "started" && dropOtpError && (
                <p role="alert" className="text-sm text-red-600">{dropOtpError}</p>
              )}

              {status === "started" &&
                ["paid", "cash"].includes(bookings.paymentStatus) &&
                (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden"
                >
                  <div className="bg-zinc-950 px-4 py-3 flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-400" />
                    <p className="text-white text-xs font-bold tracking-wide uppercase">
                      Enter Customer OTP
                    </p>
                  </div>
                  <div className="p-4 spacee-y-3">
                    <p className="text-xs text-zinc-500">
                      Payment received: ₹{bookings.fare.toFixed(2)}. Enter the drop OTP sent to the customer to complete this ride.
                    </p>
                    <p className={`text-center text-xs ${dropOtpSent ? "text-emerald-700" : dropOtpError ? "text-red-600" : "text-zinc-500"}`}>
                      {dropOtpSending
                        ? "Sending drop OTP to customer..."
                        : dropOtpSent
                          ? "Drop OTP sent to customer."
                          : "Drop OTP could not be sent yet."}
                    </p>
                    <div className="flex justify-center">
                      <input
                        type="text"
                        onChange={(e) => {
                          setDropOtp(e.target.value.replace(/\D/g, ""));
                          setDropOtpError("");
                        }}
                        placeholder=". . . ."
                        className="w-48 border-2 border-zinc-200 
                          focus:border-zinc-900 rounded-xl px-4 py-3
                          text-center text-2xl tracking-[0.5em] font-black
                          outline-none transition-colors"
                      />
                    </div>

                    {dropOtpError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-xs text-center font-medium"
                      >
                        {dropOtpError}
                      </motion.p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleVerifyDropOtp}
                        disabled={loadingDropOtp || !dropOtpSent || dropOtp.length < 4}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800
                      disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.97]      
                      transition-all"
                      >
                        {loadingDropOtp ? (
                          <span className="flex items-center justify-center gap-2">
                            Verifying...
                          </span>
                        ) : (
                          <span>Verify OTP</span>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSendDropOtp(bookings._id.toString(), true)}
                      disabled={dropOtpSending}
                      className="w-full py-2 text-xs font-semibold text-zinc-600 underline disabled:opacity-50"
                    >
                      {dropOtpSending ? "Sending..." : "Resend drop OTP"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Mobile view */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
        <motion.div
          className="bg-white rounded-t-3xl shadow-2xl
        pointer-events-auto
        overflow-hidden flex flex-col"
          animate={{ height: expand ? "82vh" : 142 }}
          transition={{ type: "spring", stiffness: 320, damping: 38 }}
        >
          <div
            onClick={() => setExpand((p) => !p)}
            className="flex-shrink-0 cursor-pointer select-none"
          >
            <div className="pt-3 pb-1">
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto" />
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cgf?.dot}`}
                />
                <div>
                  <p className="text-sm font-bold text-zinc-900 leading-tight">
                    {cgf?.label}
                  </p>
                  <p className="text-xs text-zinc-400 leading-tight">
                    {cgf?.sublabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isActive && (
                  <div className="text-right">
                    <p className="text-2xl font-black text-zinc-900 leading-none">
                      {Math.round(displayEta)}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                      min
                    </p>
                  </div>
                )}

                <motion.div
                  animate={{ rotate: expand ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center"
                >
                  <ChevronUp size={14} className="text-zinc-600" />
                </motion.div>
              </div>
            </div>

            <div className="h-px bg-zinc-100 mx-5" />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <PanelContent {...panelProps} />
          </div>

          <div className="flex-shrink-0 border-t border-zinc-100 bg-white px-5 py-4">
            <AnimatePresence mode="wait">
              {status === "confirmed" && !otpMode && !otpVerified && (
                <motion.button
                  key="arrived"
                  onClick={() => handleSendPickupOtp()}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 active:scale-[0.97]
                    text-white py-4 rounded-2xl font-bold text-sm tracking-widde
                    transition-all flex items-center justify-center gap-2"
                >
                  <MapPin size={16} /> Arrived at Pickup
                  <ArrowRight size={15} />
                </motion.button>
              )}

              {status === "confirmed" && otpMode && !otpVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden"
                >
                  <div className="bg-zinc-950 px-4 py-3 flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-400" />
                    <p className="text-white text-xs font-bold tracking-wide uppercase">
                      Enter Customer OTP
                    </p>
                  </div>
                  <div className="p-4 spacee-y-3">
                    <p className="text-xs text-zinc-500">
                      Ask the cistomer for their 4-digit OTP to start the ride
                    </p>
                    <div className="flex justify-center">
                      <input
                        type="text"
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          setOtpError("");
                        }}
                        placeholder=". . . ."
                        className="w-48 border-2 border-zinc-200 
                          focus:border-zinc-900 rounded-xl px-4 py-3
                          text-center text-2xl tracking-[0.5em] font-black
                          outline-none transition-colors"
                      />
                    </div>

                    {otpError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-xs text-center font-medium"
                      >
                        {otpError}
                      </motion.p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setOtpMode(false);
                          setOtp("");
                          setOtpError("");
                        }}
                        className="flex-1 border border-zinc-200 bg-white text-zinc-700 py-2.5
                          rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleVerifyPickupOtp}
                        disabled={loadingOtp || otp.length < 4}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800
                      disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.97]      
                      transition-all"
                      >
                        {loadingOtp ? (
                          <span className="flex items-center justify-center gap-2">
                            Verifying...
                          </span>
                        ) : (
                          <span>Verify OTP</span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === "started" && bookings.paymentStatus === "pending" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Ask the customer to pay the fare of ₹{bookings.fare.toFixed(2)} first. The drop OTP is sent after payment.
                </div>
              )}
              {status === "started" && dropOtpError && (
                <p role="alert" className="text-sm text-red-600">{dropOtpError}</p>
              )}

              {status === "started" &&
                ["paid", "cash"].includes(bookings.paymentStatus) &&
                (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden"
                >
                  <div className="bg-zinc-950 px-4 py-3 flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-400" />
                    <p className="text-white text-xs font-bold tracking-wide uppercase">
                      Enter Customer OTP
                    </p>
                  </div>
                  <div className="p-4 spacee-y-3">
                    <p className="text-xs text-zinc-500">
                      Payment received: ₹{bookings.fare.toFixed(2)}. Enter the drop OTP sent to the customer to complete this ride.
                    </p>
                    <p className={`text-center text-xs ${dropOtpSent ? "text-emerald-700" : dropOtpError ? "text-red-600" : "text-zinc-500"}`}>
                      {dropOtpSending
                        ? "Sending drop OTP to customer..."
                        : dropOtpSent
                          ? "Drop OTP sent to customer."
                          : "Drop OTP could not be sent yet."}
                    </p>
                    <div className="flex justify-center">
                      <input
                        type="text"
                        onChange={(e) => {
                          setDropOtp(e.target.value.replace(/\D/g, ""));
                          setDropOtpError("");
                        }}
                        placeholder=". . . ."
                        className="w-48 border-2 border-zinc-200 
                          focus:border-zinc-900 rounded-xl px-4 py-3
                          text-center text-2xl tracking-[0.5em] font-black
                          outline-none transition-colors"
                      />
                    </div>

                    {dropOtpError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-xs text-center font-medium"
                      >
                        {dropOtpError}
                      </motion.p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleVerifyDropOtp}
                        disabled={loadingDropOtp || !dropOtpSent || dropOtp.length < 4}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800
                      disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.97]      
                      transition-all"
                      >
                        {loadingDropOtp ? (
                          <span className="flex items-center justify-center gap-2">
                            Verifying...
                          </span>
                        ) : (
                          <span>Verify OTP</span>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSendDropOtp(bookings._id.toString(), true)}
                      disabled={dropOtpSending}
                      className="w-full py-2 text-xs font-semibold text-zinc-600 underline disabled:opacity-50"
                    >
                      {dropOtpSending ? "Sending..." : "Resend drop OTP"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Page;
