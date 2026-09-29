"use client";
import { IVehicle } from "@/models/vehicle.model";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, IndianRupee } from "lucide-react";
import Image from "next/image";
import axios from "axios";

type PropsType = {
  open: boolean;
  onClose: () => void;
  data: IVehicle | null;
};
function PricingModal({ open, onClose, data }: PropsType) {
  const [image, setImage] = useState<File | null>();
  const [preview, setPreview] = useState<string | null>(null);
  const [baseFare, setBaseFare] = useState("");
  const [pricePerKM, setPricePerKM] = useState("");
  const [waitingCharge, setWaitingCharge] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (data) {
      setPreview(data.imageUrl || null);
      setBaseFare(data.baseFare?.toString() || "");
      setPricePerKM(data.pricePerKM?.toString() || "");
      setWaitingCharge(data.waitingCharge?.toString() || "");
    }
  }, [data]);
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("baseFare", baseFare);
      formData.append("pricePerKM", pricePerKM);
      formData.append("waitingCharge", waitingCharge);
      if (image) {
        formData.append("image", image);
      }
      const { data } = await axios.post(
        "/api/partner/onboarding/pricing",
        formData,
      );
      console.log("0000", data);
      setLoading(false);
      onClose();
    } catch (error: any) {
      console.log(error.reponse.data.message ?? error);
    }
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center
          justify-center z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Pricing and Vehicle Image</h2>
            </div>
            <div className="p-6 space-y-6">
              <label
                htmlFor="imageLabel"
                className="relative h-44 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer"
              >
                {!preview ? (
                  <ImagePlus size={28} />
                ) : (
                  <Image
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    src={preview}
                    width={100}
                    height={100}
                    alt="preview"
                  />
                )}
                <input
                  id="imageLabel"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setImage(e.target.files[0]);
                      setPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />
              </label>
              <div>
                <p className="text-sm font-semibold mb-1">Base Fare</p>
                <div className="flex items-center gap-2 border rounded-xl px-4 py-3 bg-white">
                  <IndianRupee size={18} />
                  <input
                    className="w-full outline-none"
                    placeholder="base Fare"
                    type="text"
                    value={baseFare}
                    onChange={(e) => setBaseFare(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Price Per KM </p>
                <div className="flex items-center gap-2 border rounded-xl px-4 py-3 bg-white">
                  <IndianRupee size={18} />
                  <input
                    className="w-full outline-none"
                    placeholder="price peer KM"
                    type="text"
                    value={pricePerKM}
                    onChange={(e) => setPricePerKM(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Waiting Charge</p>
                <div className="flex items-center gap-2 border rounded-xl px-4 py-3 bg-white">
                  <IndianRupee size={18} />
                  <input
                    className="w-full outline-none"
                    placeholder="waiting charge"
                    type="text"
                    value={waitingCharge}
                    onChange={(e) => setWaitingCharge(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border rounded-xl py-2"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 border rounded-xl bg-black text-white py-2"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PricingModal;
