"use client";
import {} from "lucide-react";
import { motion } from "motion/react";
import React from "react";

function Footer() {
  return (
    <div className="w-full bg-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-16"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 ld:grid-cols-4 gap-12">
          <div>
            <h2 className="text-2xl font-bold tracking-wide">Ridair</h2>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Book any vehichel from bike and truck trusted owner. Transparent
              pricing
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
        <p>@ {new Date().getFullYear()} RAIDER. All rights reserved.</p>
        </div>
        </div>
      </motion.div>
    </div>
  ); 
}

export default Footer;
