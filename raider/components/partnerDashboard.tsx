"use client";
import { RootState } from "@/redux/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Clock,
  Lock,
  RocketIcon,
  Video,
} from "lucide-react";
import RejectionCard from "./rejectionCard";
import StatusCard from "./statusCard";
import ActionCard from "./actionCard";
import axios from "axios";
import PricingModal from "./pricingModal";
import { IVehicle } from "@/models/vehicle.model";
import PartnerEarning from "./partnerEarning";

type Step = {
  id: number;
  title: string;
  route?: string;
};

const STEPS: Step[] = [
  { id: 1, title: "Vehicle", route: "/partner/onboarding/vehicle" },
  { id: 2, title: "Documents", route: "/partner/onboarding/documents" },
  { id: 3, title: "Bank", route: "/partner/onboarding/bank" },
  { id: 4, title: "Review" },
  { id: 5, title: "Video KYC" },
  { id: 6, title: "Pricing" },
  { id: 7, title: "Final Review" },
  { id: 8, title: "Live" },
];

const TOTAL_STEPS = STEPS.length;

function PartnerDashboard() {
  const [activeStep, setActiveStep] = useState(1);
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);
  const [requestLoading, setRequestLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState<IVehicle | null>(null);
  const [showPricng, setShowPricing] = useState(false);

  useEffect(() => {
    if (userData) {
      setActiveStep(userData.partnerOnboardingSteps + 1);
    }
  }, [userData]);

  const handleGetPricing = async () => {
    try {
      const { data } = await axios.get("/api/partner/onboarding/pricing");
      console.log("ata", data);
      setVehicleData(data);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    handleGetPricing();
  }, []);

  const goToStep = (step: Step) => {
    if (
      step.id == 6 &&
      userData?.partnerStatus === "approved" &&
      userData.videoKycStatus === "approved"
    ) {
      setShowPricing(true);
      return;
    }
    if (step.route && step.id <= activeStep) {
      router.push(step.route);
    }
  };
  console.log("339", activeStep);
  const progressPercentage = ((activeStep - 1) / (TOTAL_STEPS - 1)) * 100;
  console.log("progressPercentage", progressPercentage);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-4 pt-28 pb-20">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-600 shadow-sm">
            Partner workspace
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Partner Onboarding
          </h1>
          <p className="text-sm text-slate-600">
            Complete all steps to activate your account.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 overflow-x-auto">
          <div className="relative min-w-[760px]">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-7 h-[3px] rounded-full bg-slate-200" />
              <motion.div
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute left-0 top-7 h-[3px] rounded-full bg-slate-900"
              />

              <div className="relative z-10 flex w-full items-start justify-between">
                {STEPS.map((item) => {
                  const completed = item.id < activeStep;
                  const active = item.id === activeStep;
                  const locked = item.id > activeStep;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={locked}
                      onClick={() => goToStep(item)}
                      className="flex flex-col items-center gap-3 outline-none cursor-pointer"
                    >
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          completed
                            ? "border-slate-900 bg-slate-900 text-white"
                            : active
                              ? "border-slate-900 bg-white text-slate-900 shadow-lg shadow-slate-900/10"
                              : "border-slate-300 bg-white text-slate-500"
                        }`}
                      >
                        {completed ? (
                          <Check size={20} strokeWidth={3} />
                        ) : locked ? (
                          <Lock size={18} />
                        ) : (
                          <span className="text-sm font-semibold">
                            {item.id}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-xs font-semibold tracking-wide ${
                          active
                            ? "text-slate-900"
                            : completed
                              ? "text-slate-700"
                              : "text-slate-500"
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        {activeStep == 4 && userData?.partnerStatus == "rejected" && (
          <RejectionCard
            title="Partner Rejected"
            reason={userData.rejectionReason}
            actionLabel={"Review and Update"}
            onAction={() => router.push("/partner/onboarding/vehicle")}
          />
        )}
        {activeStep == 4 && userData?.partnerStatus == "pending" && (
          <StatusCard
            icon={<Clock size={18} />}
            desc="Admin is verifying your documents."
            title="Documents under review"
          />
        )}

        {activeStep == 5 &&
          (userData?.videoKycStatus == "approved" ? (
            <StatusCard
              icon={<Check size={18} />}
              title="Video kyc Approved"
              desc="You can now proceed to pricing"
            />
          ) : userData?.videoKycStatus == "rejected" ? (
            <RejectionCard
              title="Video KYC Rejected"
              reason={userData.videoKycRejectionReason}
              actionLabel={requestLoading ? "Requesting" : "Request Again"}
              onAction={async () => {
                setRequestLoading(true);
                await axios.get("/api/partner/video-kyc/request");
                setRequestLoading(false);
              }}
            />
          ) : userData?.videoKycStatus == "in_progress" &&
            userData.videoKycRoomId ? (
            <ActionCard
              icon={<Video size={18} />}
              title="Admin start video KYC"
              button="Join Call"
              onClick={() =>
                router.push(`/video-kyc/${userData.videoKycRoomId}`)
              }
            />
          ) : (
            <StatusCard
              icon={<Clock size={18} />}
              title="Waiting for Admin"
              desc="Admin will initiate Video KYC shortly"
            />
          ))}
        {activeStep == 7 && vehicleData?.status == "pending" && (
          <StatusCard
            icon={<Clock size={20} />}
            title="Pricing Under Review"
            desc="Admin is reviewing your pricing"
          />
        )}
        {activeStep == 7 && vehicleData?.status == "rejected" && (
          <RejectionCard
            title="Pricing Rejection"
            reason={vehicleData.rejectionReason}
            actionLabel="Edit & Resubmit"
            onAction={() => setShowPricing(true)}
          />
        )}

        {activeStep == 8 && vehicleData?.status == "approved" && (
          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black text-white rounded-3xl p-10 shadow-2xl"
          >
            <h2 className="text-sm flex font-bold gap-2">
              <RocketIcon size={18} /> You're Live
            </h2>
            <button className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
              Go to Booking <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      <PartnerEarning />
      </div>

      <PricingModal
        data={vehicleData}
        open={showPricng}
        onClose={() => setShowPricing(false)}
      />
    </div>
  );
}

export default PartnerDashboard;
