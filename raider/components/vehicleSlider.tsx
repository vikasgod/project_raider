'use client';

import React, { useState } from "react";
import {
  Bike,
  Bus,
  CarTaxiFront,
  Car,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const vehicleCategories = [
  {
    title: "All Vehicles",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: CarTaxiFront,
    tag: "all",
  },
  {
    title: "Cars",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: Car,
    tag: "car",
  },
  {
    title: "Bikes",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: Bike,
    tag: "bike",
  },
  {
    title: "SUVs",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: Car,
    tag: "bus",
  },
  {
    title: "vans",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: Bus,
    tag: "van",
  },
  {
    title: "trucks",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: Truck,
    tag: "truck",
  },
];

function VehicleSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % vehicleCategories.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) =>
      (prev - 1 + vehicleCategories.length) % vehicleCategories.length
    );
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStart(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStart === null) return;

    const distance = event.changedTouches[0].clientX - touchStart;

    if (distance > 50) {
      handlePrev();
    } else if (distance < -50) {
      handleNext();
    }

    setTouchStart(null);
  };

  const visibleCategories = [
    ...vehicleCategories.slice(activeIndex),
    ...vehicleCategories.slice(0, activeIndex),
  ].slice(0, 3);

  return (
    <div className="w-full bg-white py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-zinc-900" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Fleet
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 leading-none">
              Vehicle <br />
              <span className="relative inline-block">
                Categories
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 right-0 -bottom-1 h-0.5 bg-zinc-900 origin-left"
                />
              </span>
            </h2>
            <p className="text-zinc-400 text-sm mt-3 font-medium">
              Choose from our wide range of vehicles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handlePrev}
              className="w-11 h-11 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all text-zinc-700 shadow-sm"
              aria-label="Previous vehicles"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleNext}
              className="w-11 h-11 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all text-zinc-700 shadow-sm"
              aria-label="Next vehicles"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </motion.button>
          </div>
        </motion.div>

        <div className="relative">
          <div className="overflow-hidden pt-8 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-5"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {visibleCategories.map((category, index) => {
                  const Icon = category.icon;

                  return (
                    <motion.article
                      key={`${category.tag}-${index}`}
                      whileHover={{
                        y: -6,
                        scale: 1.01,
                        backgroundColor: "#18181b",
                        color: "#ffffff",
                      }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="group min-w-[280px] flex-1 rounded-[32px] border border-zinc-200 bg-zinc-50 p-7 shadow-[0_20px_60px_-25px_rgba(24,24,27,0.25)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white transition-colors duration-300 group-hover:bg-white group-hover:text-zinc-900">
                          <Icon size={22} />
                        </div>
                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900">
                          {category.tag}
                        </span>
                      </div>
                      <h3 className="mt-6 text-xl font-black text-zinc-900 transition-colors duration-300 group-hover:text-white">
                        {category.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-500 transition-colors duration-300 group-hover:text-zinc-200">
                        {category.desc}
                      </p>
                    </motion.article>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay:0.7}}
        className="flex items-center gap-6 mt-8 pt-6 border-t border-zinc-100"
        >
          {
            [
              {
                num:"6+",
                label:"Categories",
              },
              {
                num:"100+", 
                label:"Vehicles types",
              },
              {
                num :"24/7",
                label:"Support and availability",
              }
            ].map((item,index)=>(
              <div key={index} className="flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-zinc-900">{item.num}</span>
                <span className="text-sm font-medium text-zinc-500">{item.label}</span>
              </div>
            ))
          }

        </motion.div>
      </div>
    </div>
  );
}

export default VehicleSlider;
