"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { IBooking } from "@/models/booking.modal";
import { Clock, IndianRupee, Loader2, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/soket";

function Page() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/partner/bookings/pending");
      setBookings(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.on("new-booking", (data: any) => {
      setBookings((prev) => [...prev, data]);
    });
    return () => {
      socket.off("new-booking");
    };
  }, []);

  const handleAccept = async (id: string) => {
    try {
      const { data } = await axios.get(`/api/partner/bookings/${id}/accept`);
      router.push("/partner/bookings");
    } catch (error) {
      console.log(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { data } = await axios.get(`/api/partner/bookings/${id}/reject`);
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="min-h-screen bg-[#f4f5f7">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-semibold text-gray-900">
            Ride Requests
          </h1>
          <p className="mt-3 text-gray-500 text-lg">
            Manage incoming ride requests and respond in real time
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-gray-700" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
            <p className="text-gray-500 text-lg">No pending ride requests.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-gray-200 
          rounded-2xl hover:shadow-md transition p-8 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center              ">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400 mb-1">
                          Pickup Location
                        </p>
                        <p className="text-gray-900 font-medium">
                          {booking.pickUpAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center              ">
                        <Navigation size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400 mb-1">
                          Drop Location
                        </p>
                        <p className="text-gray-900 font-medium">
                          {booking.dropAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center text-sm text-gray-500 mt-2">
                      <Clock size={14} className="font-medium" />
                      <span className="font-medium">
                        {new Date(booking.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between lg:items-end gap-6 w-full lg:w-auto">
                    <div className="text-left lg:text-right">
                      <p className="text-xs tracking-wide text-gray-400 uppercase mb-1">
                        Estimated Fare
                      </p>
                      <div className="flex items-center gap-2 text-3xl font-bold text-gray-900 lg:justify-end">
                        <IndianRupee size={20} />
                        {booking.fare.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                      <button
                        onClick={() => handleReject(booking._id.toString())}
                        className="flex-1 lg:flex-none bg-white hover:bg-gray-200
                       text-gray-700 py-2 px-8 rounded-xl transition-all duration-300 flex items-center justify-center"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAccept(booking._id.toString())}
                        className="flex-1 lg:flex-none bg-black hover:bg-gray-900
                       text-white py-2 px-8 rounded-xl transition-all duration-300 flex items-center justify-center"
                      >
                        Accept Ride
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
