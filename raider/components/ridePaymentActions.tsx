"use client";

import type { IBooking, PaymentStatus } from "@/models/booking.modal";
import axios from "axios";
import { Banknote, CreditCard, IndianRupee, Loader2 } from "lucide-react";
import { useState } from "react";

type RidePaymentBooking = Pick<
  IBooking,
  "_id" | "fare" | "bookingStatus" | "paymentStatus"
>;

type RazorpayOptions = {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
};

let razorpayScriptPromise: Promise<boolean> | undefined;

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function RidePaymentActions({
  booking,
  onPaymentUpdated,
}: {
  booking: RidePaymentBooking;
  onPaymentUpdated: (status: PaymentStatus) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRazorpay = (): Promise<boolean> => {
    if (typeof window === "undefined") return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);

    if (!razorpayScriptPromise) {
      razorpayScriptPromise = new Promise<boolean>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(Boolean(window.Razorpay));
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }).then((loaded) => {
        if (!loaded) razorpayScriptPromise = undefined;
        return loaded;
      });
    }
    return razorpayScriptPromise;
  };

  const payOnline = async () => {
    setLoading(true);
    setError("");

    try {
      if (!(await loadRazorpay())) {
        throw new Error("Could not load the online payment service.");
      }

      const { data: order } = await axios.post("/api/payment/create", {
        bookingId: booking._id.toString(),
      });
      const payment = new window.Razorpay!({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Raider",
        description: "Ride fare",
        order_id: order.orderId,
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response) => {
          try {
            const { data: verification } = await axios.post("/api/payment/verify", {
              bookingId: booking._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verification.success !== true) {
              throw new Error(
                verification.message ?? "Payment verification was not confirmed.",
              );
            }
            onPaymentUpdated("paid");
          } catch (paymentError) {
            setError(
              axios.isAxiosError(paymentError)
                ? paymentError.response?.data?.message ?? "Payment verification failed."
                : "Payment verification failed.",
            );
          } finally {
            setLoading(false);
          }
        },
      });
      payment.open();
    } catch (paymentError) {
      setError(
        axios.isAxiosError(paymentError)
          ? paymentError.response?.data?.message ?? paymentError.message
          : paymentError instanceof Error
            ? paymentError.message
            : "Could not start payment.",
      );
      setLoading(false);
    }
  };

  const confirmCashPayment = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`/api/booking/${booking._id.toString()}/confirm`);
      onPaymentUpdated("cash");
    } catch (paymentError) {
      setError(
        axios.isAxiosError(paymentError)
          ? paymentError.response?.data?.message ?? "Could not confirm cash payment."
          : "Could not confirm cash payment.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (booking.bookingStatus !== "started") return null;

  return (
    <section className="border-t border-zinc-100 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Ride fare
          </p>
          <p className="mt-1 flex items-center text-2xl font-black text-zinc-900">
            <IndianRupee size={19} />
            {booking.fare.toFixed(2)}
          </p>
        </div>
        {booking.paymentStatus !== "pending" && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            {booking.paymentStatus === "cash" ? "Cash recorded" : "Paid"}
          </span>
        )}
      </div>

      {booking.paymentStatus === "pending" ? (
        <>
          <p className="mt-2 text-sm text-zinc-500">
            Pay the driver after reaching your destination. The drop OTP will be sent after payment.
          </p>
          <button
            type="button"
            onClick={payOnline}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
            Pay ₹{booking.fare.toFixed(2)} online
          </button>
          <button
            type="button"
            onClick={confirmCashPayment}
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 font-bold text-zinc-800 disabled:opacity-50"
          >
            <Banknote size={17} />
            I have paid ₹{booking.fare.toFixed(2)} in cash
          </button>
          <p className="mt-2 text-center text-xs text-zinc-400">
            Confirm cash only after handing the fare to your driver.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">
          Payment recorded. Your driver can now send the drop OTP.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

export default RidePaymentActions;
