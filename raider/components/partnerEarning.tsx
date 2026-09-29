"use client";
import axios from "axios";
import { BarChart2, Star, TrendingDown, TrendingUp, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

type Earning = {
  date: string;
  earnings: number;
};
function PartnerEarning() {
  const [earningData, setEarningData] = useState<Earning[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/partner/earning");
        // console.log("data", data);
        const last7DaysData: Earning[] = data.slice(-7);
        setEarningData(last7DaysData);
      } catch (error) {
        console.log("first", error);
      }
    };
    fetchData();
  }, []);

  const total = earningData.reduce((a, d) => a + d.earnings, 0);
  const avg = earningData.length ? Math.round(total / earningData.length) : 0;
  const max = earningData.length
    ? Math.max(...earningData.map((d) => d.earnings))
    : 0;
  const bestDay = earningData.find((d) => d.earnings === max);
  const today = earningData[earningData.length - 1];
  const yesterday = earningData[earningData.length - 2];
  const delta = today && yesterday ? today.earnings - yesterday.earnings : 0;
  const deltaPositive = delta >= 0;
  const deltaPct = yesterday
    ? Math.abs(Math.round((delta / yesterday.earnings) * 100))
    : 0;

  const fmt = (n: number) => {
    return "₹" + n.toLocaleString();
  };

  const metrics = [
    {
      label: "Best day",
      value: fmt(max),
      sub: bestDay?.date ?? "-",
      icon: <Star size={14} />,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Daily Avg",
      value: fmt(avg),
      sub: "per day",
      icon: <BarChart2 size={14} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Today",
      value: today ? fmt(today.earnings) : "-",
      sub:
        today && yesterday
          ? `${deltaPositive ? "+" : ""}${fmt(delta)} vs yesterday`
          : "-",
      icon: <Zap size={14} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <span
            className="inline-block text-[11px] font-semibold tracking-widest uppercase
            text-blue-600 bg-blue-50 rounded-full px-3 py-1 mb-2"
          >
            Partner Dashboard
          </span>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Daily Earning
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Last 7 days performance
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold text-gray-400 uppecase tracking-widest mb-1">
            Weekly total
          </p>

          <motion.div
            key={total}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 font-mono tracking-tight"
          >
            {fmt(total)}
          </motion.div>

          <div
            className={`flex items-center justify-end gap-1 text-xs font-semibold mt-1
            ${deltaPositive ? "text-emerald-600" : "text-rose-500"}`}
          >
            {deltaPositive ? (
              <TrendingUp size={13} />
            ) : (
              <TrendingDown size={13} />
            )}
            <span>{deltaPct}% vs yesterday</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {metrics.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="bg-gray-50 rounded-2xl p-4"
          >
            <div
              className={`flex items-center gap-1.5 text-[11px] font-semibold
             uppercase tracking-wider mb-2 ${item.color}`}
            >
              <span className={`${item.bg} p-1 rounded-lg ${item.color}`}>
                {item.icon}
              </span>
              {item.label}
            </div>
            <p className="text-lg font-bold text-gray-900 font-mono leading-none">
              {item.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scaleY: 0.92 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="h-56"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningData} barCategoryGap={"30%"}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)
                }
              />
              <Bar dataKey="earnings" radius={[8, 8, 3, 3]}>
                {earningData.map((v, i) => {
                  const isToday = i === earningData.length - 1;
                  const isBest = v.earnings === max && !isToday;
                  return (
                    <Cell
                      key={`cell-${i}`}
                      fill={
                        isToday ? "#10b981" : isBest ? "#8b5cf6" : "#bfdbfe"
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default PartnerEarning;
