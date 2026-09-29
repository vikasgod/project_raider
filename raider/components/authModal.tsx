"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleDashed, Lock, Mail, User, X } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";
type propType = {
  open: boolean;
  onClose: () => void;
};
type stepType = "login" | "signup" | "otp";
function AuthModal({ open, onClose }: propType) {
  const [step, setStep] = useState<stepType>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const { data } = useSession();
  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      setStep("otp");
      setErr("");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setErr(error.response.data.message || "Something went wrong");
    }
  };
  const handleVerifyEmail = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/verify-email", {
        email,
        otp: otp.join(""),
      });
      setOtp(["", "", "", "", "", ""]);
      setStep("login");
      setErr("");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setErr(error.response.data.message || "Something went wrong");
    }
  };
  const handleLogin = async () => {
    setLoading(true);
    setErr("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setErr("Invalid email or password");
    }

    if (res?.ok) {
      onClose();
    }

    setLoading(false);
  };
  const handleGoogleLogin = async () => {
    await signIn("google");
  };
  const handleChangeOtp = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
    if (!value && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            >
              <div
                className="relative w-full max-w-md rounded-3xl bg-white border border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.35)] p-6 sm:p-8 text-black"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="absolute right-4 top-4 text-gray-500 hover:text-black transition"
                  onClick={onClose}
                >
                  <X size={20} />
                </div>
                <div className="mb-6 text-center">
                  <h1 className="text-3xl font-extrabold tracking-widest">
                    {" "}
                    RAIDER
                  </h1>
                  <p className="mt-1 text-xs text-grey-500">
                    Premium vehichel booking
                  </p>
                </div>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full h-11 rounded-xl
               border border-black/20
               flex items-center justify-center gap-3 text-sm font-semibold hover:bg-black hover:text-white transition
               "
                >
                  <Image
                    src="/google.png"
                    alt="google"
                    width={20}
                    height={20}
                  />
                  Continue with google
                </button>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-black/10" />
                  <div className="">OR</div>
                  <div className="flex-1 h-px bg-black/10" />
                </div>
                <div>
                  {step == "login" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <h1 className="text-1 font semobolad">Welcome Back</h1>
                      <div className="mt-5 space-y-4">
                        <div
                          className="flex items-center gap-3 border
                        border-black/20 rounded-xl px-4 py-3"
                        >
                          <Mail size={18} className="text-gray-500" />
                          <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder="email"
                            className="w-full bg-transparent outline-none text-sm"
                          />
                        </div>
                        <div
                          className="flex items-center gap-3 border
                        border-black/20 rounded-xl px-4 py-3"
                        >
                          <Lock size={18} className="text-gray-500" />
                          <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="password"
                            className="w-full bg-transparent outline-none text-sm"
                          />
                        </div>
                        {err && <p className="text-red-500">{err}</p>}
                        <button
                          disabled={loading}
                          onClick={handleLogin}
                          className="w-full h-11 rounded-xl flex items-center justify-center bg-black text-white font-semibold hover:bg-gray-900 transition"
                        >
                          {!loading ? (
                            `Login`
                          ) : (
                            <CircleDashed
                              size={18}
                              color="white"
                              className="animate-screen"
                            />
                          )}
                        </button>
                      </div>
                      <span className="mt-6 text-center text-sm text-gray-500">
                        Don't have a account?{" "}
                        <div
                          onClick={() => setStep("signup")}
                          className="text-black font-medium hover:underline"
                        >
                          Sign Up
                        </div>
                      </span>
                    </motion.div>
                  )}
                  {step == "signup" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <h1 className="text-1 font semobolad">
                        Create a account
                      </h1>
                      <div className="mt-5 space-y-4">
                        <div
                          className="flex items-center gap-3 border
                        border-black/20 rounded-xl px-4 py-3"
                        >
                          <User size={18} className="text-gray-500" />
                          <input
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            type="text"
                            placeholder="Full name"
                            className="w-full bg-transparent outline-none text-sm"
                          />
                        </div>
                        <div
                          className="flex items-center gap-3 border
                        border-black/20 rounded-xl px-4 py-3"
                        >
                          <Mail size={18} className="text-gray-500" />
                          <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder="email"
                            className="w-full bg-transparent outline-none text-sm"
                          />
                        </div>
                        <div
                          className="flex items-center gap-3 border
                        border-black/20 rounded-xl px-4 py-3"
                        >
                          <Lock size={18} className="text-gray-500" />
                          <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="password"
                            className="w-full bg-transparent outline-none text-sm"
                          />
                        </div>
                        {err && <p className="text-red-500">{err}</p>}
                        <button
                          disabled={loading}
                          onClick={handleSignUp}
                          className="w-full h-11 rounded-xl flex items-center justify-center bg-black text-white font-semibold hover:bg-gray-900 transition"
                        >
                          {!loading ? (
                            `Send OTP`
                          ) : (
                            <CircleDashed
                              size={18}
                              color="white"
                              className="animate-screen"
                            />
                          )}
                        </button>
                      </div>
                      <p className="mt-6 text-center text-sm text-gray-500">
                        Already have a account{" "}
                        <span
                          onClick={() => setStep("login")}
                          className="text-black font-medium hover:underline"
                        >
                          Login
                        </span>
                      </p>
                    </motion.div>
                  )}
                  {step == "otp" && (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-semibold">
                        Verify Email otp
                      </h2>
                      <div className="mt-6 flex justify-between gap-2">
                        {otp.map((v, i) => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            value={v}
                            maxLength={1}
                            className="w-10 h-12 sm:w-12 text-center text-lg font-semibold rounded-xl bg-white border border-black/20 outline-none"
                            onChange={(e) => handleChangeOtp(i, e.target.value)}
                          />
                        ))}
                      </div>
                      {err && <p className="text-red-500">{err}</p>}
                      <button
                        disabled={loading}
                        onClick={handleVerifyEmail}
                        className="mt-6 w-full h-11 flex items-center justify-center rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition"
                      >
                        {!loading ? (
                          `Verify and create Account`
                        ) : (
                          <CircleDashed
                            size={18}
                            color="white"
                            className="animate-screen"
                          />
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
