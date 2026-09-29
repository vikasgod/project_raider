"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  CreditCard,
  Landmark,
  Phone,
} from "lucide-react";

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function Page() {
  const router = useRouter();
  const [bankForm, setBankForm] = useState({
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    upi: "",
    mobileNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sanitizedIFSC = String(bankForm.ifsc ?? "")
    .trim()
    .toUpperCase();
  const accountHolder = String(bankForm.accountHolder ?? "");
  const accountNumber = String(bankForm.accountNumber ?? "");
  const mobileNumber = String(bankForm.mobileNumber ?? "");

  const isNameValid = accountHolder.trim().length >= 3;
  const isAccountValid = accountNumber.trim().length >= 9;
  const isIfscValid = IFSC_REGEX.test(sanitizedIFSC);
  const isMobileValid = /^\d{10}$/.test(mobileNumber.trim());

  const canSubmit =
    isNameValid && isAccountValid && isMobileValid && isIfscValid;

  const handleBank = async () => {
    if (!canSubmit) {
      setError("Please complete all required bank details correctly");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await axios.post("/api/partner/onboarding/bank", {
        accountHolder: bankForm.accountHolder.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        ifsc: sanitizedIFSC,
        upi: bankForm.upi.trim(),
        mobileNumber: bankForm.mobileNumber.trim(),
      });
      setLoading(false);
      window.location.href = "/"
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Something went wrong";
      setError(message);
      console.log("bank error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data } = await axios.get("/api/partner/onboarding/bank");
        setBankForm({
          accountHolder: data?.partnerBank?.accountHolder ?? "",
          accountNumber: data?.partnerBank?.accountNumber ?? "",
          ifsc: data?.partnerBank?.ifsc ?? "",
          upi: data?.partnerBank?.upi ?? "",
          mobileNumber: data?.mobileNumber ?? "",
        });
      } catch (fetchError: any) {
        console.log("documents fetch error", fetchError);
      }
    };

    fetchDocs();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-white rounded-3xl border border-gray-200 shadow-[0_25px_70px_rgba(0,0,0,0.15)] p-6 sm:p-8"
      >
        <div className="relative text-center">
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-0 w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="text-xs text-gray-500 font-medium">step 3 of 3</p>
          <h1 className="text-2xl font-bold mt-1">Bank & Payout Setup</h1>
          <p className="text-sm text-gray-500 mt-2">Used for partner payouts</p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <label
              className="text-xs font-semibold text-gray-500"
              htmlFor="account-holder"
            >
              Account holder name
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400">
                <BadgeCheck />
              </div>
              <input
                id="account-holder"
                type="text"
                value={bankForm.accountHolder}
                onChange={(e) =>
                  setBankForm((prev) => ({
                    ...prev,
                    accountHolder: e.target.value,
                  }))
                }
                placeholder="As per bank records"
                className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isNameValid && bankForm.accountHolder.length > 0 ? "border-red-300 focus-red-300" : "border-gray-300 focus:border-black"}`}
              />
            </div>
            {!isNameValid && bankForm.accountHolder.length > 0 && (
              <p className="mt-1 text-xs text-red-500">
                Minimum 3 characters required
              </p>
            )}
          </div>
          <div>
            <label
              className="text-xs font-semibold text-gray-500"
              htmlFor="account-number"
            >
              Bank Account Number
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400">
                <CreditCard />
              </div>
              <input
                id="account-number"
                type="text"
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                placeholder="Enter account number"
                className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isAccountValid && bankForm.accountNumber.length > 0 ? "border-red-300 focus-red-300" : "border-gray-300 focus:border-black"}`}
              />
            </div>
            {!isAccountValid && bankForm.accountNumber.length > 0 && (
              <p className="mt-1 text-xs text-red-500">
                Account number must be at least 9 digits
              </p>
            )}
          </div>
          <div>
            <label
              className="text-xs font-semibold text-gray-500"
              htmlFor="ifsc"
            >
              IFSC Code
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400">
                <Landmark />
              </div>
              <input
                id="ifsc"
                type="text"
                value={bankForm.ifsc}
                onChange={(e) =>
                  setBankForm((prev) => ({
                    ...prev,
                    ifsc: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="ICICI122324"
                className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isIfscValid && bankForm.ifsc.length > 0 ? "border-red-300 focus-red-300" : "border-gray-300 focus:border-black"}`}
              />
            </div>
            {!isIfscValid && bankForm.ifsc.length > 0 && (
              <p className="mt-1 text-xs text-red-500">
                Enter a valid IFSC code
              </p>
            )}
          </div>
          <div>
            <label
              className="text-xs font-semibold text-gray-500"
              htmlFor="mobile-number"
            >
              Mobile number
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400">
                <Phone />
              </div>
              <input
                id="mobile-number"
                type="text"
                value={bankForm.mobileNumber}
                onChange={(e) =>
                  setBankForm((prev) => ({
                    ...prev,
                    mobileNumber: e.target.value,
                  }))
                }
                placeholder="10 digit mobile number"
                className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isMobileValid && bankForm.mobileNumber.length > 0 ? "border-red-300 focus-red-300" : "border-gray-300 focus:border-black"}`}
              />
            </div>
            {!isMobileValid && bankForm.mobileNumber.length > 0 && (
              <p className="mt-1 text-xs text-red-500">
                Enter 10-digit mobile number
              </p>
            )}
          </div>
          <div>
            <label
              className="text-xs font-semibold text-gray-500"
              htmlFor="upi"
            >
              UPI ID (optional)
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                id="upi"
                type="text"
                value={bankForm.upi}
                onChange={(e) =>
                  setBankForm((prev) => ({ ...prev, upi: e.target.value }))
                }
                placeholder="name@axis"
                className="flex-1 border-b pb-2 text-sm focus:outline-none border-gray-300 focus:border-black"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-start gap-3 text-xs text-gray-500">
          <CheckCircle size={16} className="mt-0.5" />
          <p>
            Bank details are verified before first payout. This usually takes
            24-48 hours.
          </p>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            *{error}
          </div>
        )}
        <motion.button
          disabled={loading || !canSubmit}
          onClick={handleBank}
          whileHover={canSubmit && !loading ? { scale: 1.02 } : undefined}
          whileTap={canSubmit && !loading ? { scale: 0.97 } : undefined}
          className="mt-8 w-full h-14 rounded-2xl bg-black text-white font-semibold disabled:opacity-40 transition flex items-center justify-center"
        >
          {loading ? "Submitting..." : "Continue"}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Page;
