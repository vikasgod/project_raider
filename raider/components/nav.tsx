"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthModal from "./authModal";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Bike, Car, ChevronRight, LogOut, Menu, Truck, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { clearUserData } from "@/redux/userSlice";
import axios from "axios";
import { getSocket } from "@/lib/soket";
const Nav_Items = ["Home", "Bookings", "About Us", "Contact"];
function Nav() {
  const pathName = usePathname();
  const [authOpen, SetAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { userData } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const handleLogout = async () => {
    await signOut({ redirect: false });
    dispatch(clearUserData());
    setProfileOpen(false);
  };

  const fetchCount = async () => {
    try {
      const { data } = await axios.get(
        "/api/partner/bookings/pendingRequestCount",
      );
      setPendingRequestCount(data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const socket = getSocket();
    socket.on("new-booking", (data: any) => {
      setPendingRequestCount((prev) => prev + 1);
    });
    return () => {
      socket.off("new-booking");
    };
  }, []);

  useEffect(() => {
    if (userData?.role === "partner") {
      fetchCount();
    }
  }, [userData]);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 w-[94%] md:w-[86%] z-50 rounded-full bg-black text-white shadow-[0_15px_50px_rgba(0,0,0,0.7)] py-3"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="Logo"
            width={44}
            height={44}
            priority
            className="h-11 w-11 object-contain"
            style={{ width: "auto", height: "auto" }}
          />
          <div className="hidden md:flex items-center gap-10">
            {userData?.role === "partner" ? (
              <>
                <Link
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  href="/"
                >
                  Home
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  href="/partner/pending-requests"
                >
                  Pending Requests
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 
                  rounded-full bg-white text-black 
                  text-xs flex items-center 
                  justify-center font-bold"
                  >
                    {pendingRequestCount ?? 0}
                  </span>
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  href="/partner/bookings"
                >
                  Bookings
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  href="/partner/active-ride"
                >
                  Active Ride
                </Link>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-3 relative">
            <div className="hidden md:block relative">
              {!userData ? (
                <button
                  className="px-4 py-1.5 rounded-full bg-white text-black text-sm"
                  onClick={() => SetAuthOpen(true)}
                >
                  Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-11 h-11 rounded-full bg-white text-black font-bold"
                  >
                    {userData.name.charAt(0).toUpperCase()}
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-14 right-0 w-[300] bg-white text-black rounded-2xl shadow-xl border"
                      >
                        <div className="p-4">
                          <p className="font-semibold text-lg">
                            {userData.name}
                          </p>
                          <p className="text-xs uppercase text-gray-500 mb-4">
                            {userData.role}
                          </p>
                          {userData.role != "partner" && (
                            <div
                              onClick={() => router.push("/user/bookings")}
                              className="w-full flex items-center gap-3 pl-3 pb-3 pt-3 hover:bg-gray-100 rounded-xl"
                            >
                              Bookings
                              <ChevronRight size={14} className="ml-auto" />
                            </div>
                          )}
                          {userData.role != "partner" && (
                            <div
                              onClick={() =>
                                router.push("/partner/onboarding/vehicle")
                              }
                              className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl"
                            >
                              <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                  <Bike size={16} />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                  <Car size={16} />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                  <Truck size={16} />
                                </div>
                              </div>
                              Become a Partner{" "}
                              <ChevronRight size={14} className="ml-auto" />
                            </div>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl mt-2"
                          >
                            <LogOut /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
            <div className="md:hidden">
              {!userData ? (
                <button
                  className="px-4 py-1.5 rounded-full bg-white text-black text-sm"
                  onClick={() => SetAuthOpen(true)}
                >
                  Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-11 h-11 rounded-full bg-white text-black font-bold"
                  >
                    {userData.name.charAt(0).toUpperCase()}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {profileOpen && userData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />

            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden"
            >
              <div className="p-4">
                <p className="font-semibold text-lg">{userData.name}</p>
                <p className="text-xs uppercase text-gray-500 mb-4">
                  {userData.role}
                </p>
                {userData.role != "partner" && (
                  <div
                    onClick={() => router.push("/user/bookings")}
                    className="w-full flex items-center gap-3 pl-3 pb-3 pt-3 hover:bg-gray-100 rounded-xl"
                  >
                    Bookings
                    <ChevronRight size={14} className="ml-auto" />
                  </div>
                )}
                {userData.role != "partner" && (
                  <div
                    onClick={() => router.push("/partner/onboarding/vehicle")}
                    className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl"
                  >
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Bike size={16} />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Car size={16} />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Truck size={16} />
                      </div>
                    </div>
                    Become a Partner{" "}
                    <ChevronRight size={14} className="ml-auto" />
                  </div>
                )}

                {userData?.role == "partner" && (
                  <div className="flex flex-col gap-4">
                    <Link
                      className="relative text-sm font-medium text-black hover:text-gray-500 transition flex items-center gap-2"
                      href="/partner/pending-requests"
                    >
                      <span>Pending Requests</span>
                      <span
                        className="w-5 h-5 
                  rounded-full bg-black text-white 
                  text-xs flex items-center 
                  justify-center font-bold"
                      >
                        {pendingRequestCount ?? 0}
                      </span>
                    </Link>
                    <Link
                      className="relative text-sm font-medium text-black hover:text-gray-500 transition"
                      href="/partner/bookings"
                    >
                      Bookings
                    </Link>
                    <Link
                      className="relative text-sm font-medium text-black hover:text-gray-500 transition"
                      href="/partner/active-ride"
                    >
                      Active Ride
                    </Link>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl mt-2"
                >
                  <LogOut /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AuthModal open={authOpen} onClose={() => SetAuthOpen(false)} />
    </>
  );
}

export default Nav;
