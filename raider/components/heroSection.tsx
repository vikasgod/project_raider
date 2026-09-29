"use client";
import React from "react";
import { motion } from "motion/react";
import { Bike, Bus, Car, Truck } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";

function HeroSection({ onAuthRequired }: { onAuthRequired: () => void }) {
  const { userData } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/heroImage.jpg')" }}
      />
      <div className="abosolute insert-0 bg-black/80" />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-white font-extrabold text-4xl md:text-6xl lg:text-7xl"
        >
          Book Any Vehichel
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white text-lg md:text-xl lg:text-2xl max-w-2xl"
        >
          Find the perfect vehicle for your next adventure
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex gap-8 text-gray-300"
        >
          <Bike size={32} />
          <Car size={32} />
          <Bus size={32} />
          <Truck size={32} />
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-12 px-12 py-4 bg-white text-black rounded-full font-semibold shadow-xl cursor-pointer"
          onClick={() => {
            !userData ? onAuthRequired() : router.push("/user/book");
          }}
        >
          Book Now
        </motion.button>
      </div>
    </div>
  );
}

export default HeroSection;
