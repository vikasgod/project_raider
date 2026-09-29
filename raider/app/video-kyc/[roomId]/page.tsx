"use client";
import React, { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { motion } from "motion/react";
import {
  CheckCircle,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  X,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { AnimatePresence } from "motion/react";

function page() {
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);
  const [joined, setJoined] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aLoading, setALoading] = useState(false);
  const [rLoading, setRLoading] = useState(false);
  const [reason, setReason] = useState("");
  const { roomId } = useParams();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  useEffect(() => {
    if (joined) return;
    let localStream: MediaStream;
    const init = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(localStream);
        if (previewRef.current) {
          previewRef.current.srcObject = localStream;
        }
      } catch (error) {
        console.log("error", error);
      }
    };
    init();
  }, []);
  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => (track.enabled = !isCameraOn));
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => (track.enabled = !isMicOn));
    setIsMicOn(!isMicOn);
  };

  const handleApprove = async () => {
    setALoading(true);
    try {
      const { data } = await axios.post("/api/admin/videoKyc/complete", {
        roomId,
        action: "approved",
      });
      console.log(data);
      setALoading(false);
      router.push("/");
    } catch (error) {
      console.log("error", error);
      setALoading(false);
    }
  };
  const handleReject = async () => {
    setRLoading(true);
    try {
      const { data } = await axios.post("/api/admin/videoKyc/complete", {
        roomId,
        action: "rejected",
        reason,
      });
      console.log(data);
      setRLoading(false);
      router.push("/");
    } catch (error) {
      console.log("error", error);
      setRLoading(false);
    }
  };

  const startCall = async () => {
    if (!containerRef) {
      return null;
    }
    setLoading(true);
    const displayName =
      userData?.role == "admin"
        ? "Admin"
        : `${userData?.name} ${userData?.email}`;
    try {
      const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET;
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appId,
        serverSecret!,
        roomId?.toString()!,
        userData?._id.toString()!,
        displayName,
      );
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, // To implement 1-on-1 calls, modify the parameter here to [ZegoUIKitPrebuilt.OneONoneCall].
        },
        showPreJoinView: false,
      });
      setJoined(true);
      setLoading(false);
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Image src="/logo.png" width={100} height={100} alt="Kyc" priority />
          <p className="text-xs text-graay-400">
            {userData?.role == "admin"
              ? "Admin Verification"
              : "Partner Video KYC"}
          </p>
        </div>
        {joined && (
          <div className="flex flex-wrap gap-3">
            {userData?.role === "admin" && (
              <>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                >
                  <XCircle size={1} />
                  Reject
                </button>
              </>
            )}
            <button className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <PhoneOff size={16} />
              End Call
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className={`absolute inset-0 ${joined ? "block" : "hidden"}`}
        />
        {!joined && (
          <div className="h-full flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-[300px] sm:h-[400px] object-cover"
                />
                {!isCameraOn && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <VideoOff size={40} />
                  </div>
                )}
              </div>

              <div className="space-y-8 text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Secure Video KYC
                </h1>
                <div className="flex justify-center lg:justify-start gap-6">
                  <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${isCameraOn ? "bg-white text-black" : "bg-white/10 border border-white/20"}`}
                  >
                    {isCameraOn ? <Video /> : <VideoOff />}
                  </button>
                  <button
                    onClick={toggleMic}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${isMicOn ? "bg-white text-black" : "bg-white/10 border border-white/20"}`}
                  >
                    {isMicOn ? <Mic /> : <MicOff />}
                  </button>
                </div>
                <button
                  disabled={loading}
                  onClick={startCall}
                  className="w-full bg-white text-black py-4 rounded-xl font-semibold"
                >
                  {loading ? "Connecting..." : "Join Scure Call"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showApprovalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              className="relative bg-[#111] w-full max-w-md rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <button
                onClick={() => setShowApprovalModal(false)}
                className="absolute top-4 right-4 text-gray-400"
              >
                <X size={16} />
              </button>
              <h2 className="text-lg font-semibold mb-4">Confirm Approval</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 border rounded-xl py-2"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-green-600 rounded-xl py-2"
                  disabled={aLoading}
                  onClick={handleApprove}
                >
                  {aLoading ? "Processing..." : "Approve"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              className="relative bg-[#111] w-full max-w-md rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <button
                onClick={() => setShowRejectModal(false)}
                className="absolute top-4 right-4 text-gray-400"
              >
                <X size={16} />
              </button>
              <h2 className="text-lg font-semibold mb-4">Reject Partner</h2>
              <textarea
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 mb-4 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Give rejection Reason"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 border rounded-xl py-2"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-green-600 rounded-xl py-2"
                  disabled={rLoading}
                  onClick={handleReject}
                >
                  {rLoading ? "Processing..." : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default page;
