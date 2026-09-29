"use client";
import { BookingStatus, PaymentStatus } from "@/models/booking.modal";
import { IUser } from "@/models/user.model";
import { IVehicle } from "@/models/vehicle.model";
import axios from "axios";
import {
  Bike,
  Calendar,
  Car,
  ChevronRight,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Truck,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

interface IBooking {
  user: IUser;
  driver: IUser;
  vehicle: IVehicle;

  pickUpAddress: string;
  dropAddress: string;
  pickUpLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  dropLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  fare: number;

  userMobileNumber: string;
  driverMobileNumber: string;

  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;

  paymentDeadline: Date;

  adminCommission: number;
  partnerAmount: number;

  pickUpOtp: string;
  pickUpOtpExpires: Date;

  dropOtp: string;
  dropOtpExpires: Date;

  createdAt: Date;
  updatedAt: Date;
}

function Page() {
  const [bookings, setBookings] = useState<IBooking[] | []>([]);
  const [selectStatus, setSelectStatus] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/partner/bookings");
        setBookings(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    };
    fetch();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: "bg-blue-100 text-blue-600",
      awaiting_payment: "bg-yellow-100 text-yellow-600",
      confirmed: "bg-green-100 text-green-600",
      started: "bg-green-100 text-green-600",
      completed: "bg-green-100 text-green-600",
      cancelled: "bg-red-100 text-red-600",
      rejected: "bg-red-100 text-red-600",
      expired: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  };

  const getVehicleIcon = (vehicle: IVehicle) => {
    const icons: Record<string, any> = {
      bike: <Bike className="w-4 h-4 text-gray-400" />,
      loading: <Car className="w-4 h-4 text-gray-400" />,
      auto: <Car className="w-4 h-4 text-gray-400" />,
      car: <Car className="w-4 h-4 text-gray-400" />,
      truck: <Truck className="w-4 h-4 text-gray-400" />,
    };
    return icons[vehicle.type];
  };

  const filteredBookings =
    selectStatus === "All"
      ? bookings
      : bookings.filter((b) => b.bookingStatus === selectStatus.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto py-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car size={20} className="w-5 h-5 text-blue-600 " />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Partner Bookings
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {bookings?.length}{" "}
                  {bookings.length === 1 ? "ride " : "rides "}
                  assigned to you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              Showing {filteredBookings.length} bookings
            </div>
            <select
              onChange={(e) => setSelectStatus(e.target.value)}
              value={selectStatus}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm 
            text-gray-600 focus:outlne-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All</option>
              <option>requested</option>
              <option>awaiting_payment</option>
              <option>confirmed</option>
              <option>started</option>
              <option>completed</option>
              <option>cancelled</option>
              <option>rejected</option>
            </select>
          </div>
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin w-8 h-8 text-black-600" />
            </div>
          )}
          {!loading && filteredBookings.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h1 className="text-lg font-medium txt-gray-900">
                No bookings yet
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                When customers book rides, they'll appear here.
              </p>
            </div>
          )}

          {!loading && filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className="bg-white rounded-xl border border-gray-200 shadow-sm
                    hover:shadow-md transition-all overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 p-4 bg-linear-to-r
                    from-blue-50 to-indigo-50 border-b border-gray-20"
                    >
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden bg-blue-200
                      flex-shrink-0 border-2 border-white shadow-sm flex 
                      items-center justify-center"
                      >
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {item.user.name.toUpperCase() || "Customer"}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs
                            font-medium ${getStatusColor(item.bookingStatus)}`}
                          >
                            {item.bookingStatus ?? "--"}
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-1 mt-1
                        text-xs text-gray-600"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{item.userMobileNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pt-3">
                      <div className="bg-gray-50 rounded-lg p-2 flx items-center gap-2 ">
                        {getVehicleIcon(item.vehicle)}
                        <div className="text-xs text-gray-600">
                          {item.vehicle.vehicleModel} -
                          {item.vehicle.number || "Not assigned"}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full
                                flex items-center justify-center"
                        >
                          <MapPin className="w-3 h-3 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-green-600 uppercase tracking-wider">
                            Pick UP
                          </span>
                          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                            {item.pickUpAddress}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full
                                flex items-center justify-center"
                        >
                          <MapPin className="w-3 h-3 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-red-600 uppercase tracking-wider">
                            Drop
                          </span>
                          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                            {item.dropAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(item.createdAt?.toString()!)}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-gray-900">
                        <IndianRupee className="w-4 h-4" />
                        <span>{item.fare}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Payment :{" "}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full 
                          ${
                            item.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      </div>
                      {(item.bookingStatus === "completed" ||
                        item.bookingStatus === "confirmed" ||
                        item.bookingStatus === "started") && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push("/partner/active-ride")}
                            className="flex items-center gap-1 text-sm
                        font-medium text-blue-600 hover:text-blue-70
                        bg-blue-50 hover:bg-blue-100 px-4 py-1.5
                        rounded-lg transition-colors"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Page;
