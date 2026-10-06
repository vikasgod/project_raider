"use client";

import axios from "axios";
import {
  BarChart3,
  CalendarDays,
  Check,
  Filter,
  Star,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Earning = {
  date: string;
  earnings: number;
};

const EARNING_RANGES = [
  { value: "today", label: "Today", period: "Today" },
  { value: "week", label: "Weekly", period: "Last 7 days" },
  { value: "month", label: "Monthly", period: "Last 30 days" },
  { value: "threeMonths", label: "3 Months", period: "Last 3 months" },
  { value: "sixMonths", label: "6 Months", period: "Last 6 months" },
  { value: "year", label: "Year", period: "Last 12 months" },
] as const;

type EarningRange = (typeof EARNING_RANGES)[number]["value"];

const getTodayDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

function formatDate(date: string, includeYear = false) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "2-digit" as const } : {}),
    timeZone: "UTC",
  });
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function EarningDashboard({
  endpoint,
  audience,
}: {
  endpoint: string;
  audience: "Partner" | "Admin";
}) {
  const [earningData, setEarningData] = useState<Earning[]>([]);
  const [previousEarningData, setPreviousEarningData] = useState<Earning[]>([]);
  const [range, setRange] = useState<EarningRange>("week");
  const [startDate, setStartDate] = useState(getTodayDate);
  const [endDate, setEndDate] = useState(getTodayDate);
  const [appliedDates, setAppliedDates] = useState<{
    startDate: string;
    endDate: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get<Earning[]>(endpoint, {
          params: {
            range: appliedDates ? "custom" : range,
            ...(appliedDates ?? {}),
          },
        });
        let previousData: Earning[] = [];
        if (data.length) {
          const firstDate = data[0].date;
          const lastDate = data[data.length - 1].date;
          const duration =
            (Date.parse(`${lastDate}T00:00:00.000Z`) -
              Date.parse(`${firstDate}T00:00:00.000Z`)) /
              86_400_000 +
            1;
          const previousEnd = addDays(firstDate, -1);
          const previousStart = addDays(previousEnd, 1 - duration);
          try {
            const response = await axios.get<Earning[]>(endpoint, {
              params: {
                range: "custom",
                startDate: previousStart,
                endDate: previousEnd,
              },
            });
            previousData = response.data;
          } catch {
            previousData = [];
          }
        }
        if (active) {
          setEarningData(data);
          setPreviousEarningData(previousData);
        }
      } catch (fetchError) {
        if (active) {
          setError(
            axios.isAxiosError(fetchError)
              ? (fetchError.response?.data?.message ??
                  "Could not load earnings.")
              : "Could not load earnings.",
          );
          setEarningData([]);
          setPreviousEarningData([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [endpoint, range, appliedDates]);

  const total = earningData.reduce((sum, day) => sum + day.earnings, 0);
  const average = earningData.length ? total / earningData.length : 0;
  const bestEarning = earningData.length
    ? Math.max(...earningData.map((day) => day.earnings))
    : 0;
  const previousTotal = previousEarningData.reduce(
    (sum, day) => sum + day.earnings,
    0,
  );
  const previousAverage = previousEarningData.length
    ? previousTotal / previousEarningData.length
    : 0;
  const previousBest = previousEarningData.length
    ? Math.max(...previousEarningData.map((day) => day.earnings))
    : 0;
  const getChange = (current: number, previous: number) => {
    if (!previousEarningData.length) return undefined;
    if (previous === 0) return current > 0 ? null : 0;
    return ((current - previous) / previous) * 100;
  };
  const bestDay = earningData.find((day) => day.earnings === bestEarning);
  const selectedRange = EARNING_RANGES.find((item) => item.value === range)!;
  const periodDescription = appliedDates
    ? `${formatDate(appliedDates.startDate, true)} – ${formatDate(appliedDates.endDate, true)}`
    : selectedRange.period;

  const applyCustomDates = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !startDate ||
      !endDate ||
      startDate > endDate ||
      endDate > getTodayDate()
    ) {
      setError("Please choose a valid date range up to today.");
      return;
    }
    setError("");
    setAppliedDates({ startDate, endDate });
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const metrics = [
    {
      label: "Best day",
      value: formatCurrency(bestEarning),
      sub: bestDay ? formatDate(bestDay.date, true) : "No earnings yet",
      change: getChange(bestEarning, previousBest),
      comparison: "vs previous best",
      icon: <Star size={21} fill="currentColor" />,
      card: "border-amber-100 bg-amber-50/70",
      iconStyle: "bg-amber-100 text-amber-700",
      valueStyle: "text-zinc-900",
    },
    {
      label: "Daily average",
      value: formatCurrency(average),
      sub: "per day",
      change: getChange(average, previousAverage),
      comparison: "vs previous period",
      icon: <BarChart3 size={21} />,
      card: "border-blue-100 bg-blue-50/70",
      iconStyle: "bg-blue-100 text-blue-700",
      valueStyle: "text-zinc-900",
    },
    {
      label: "Period total",
      value: formatCurrency(total),
      sub: periodDescription,
      change: getChange(total, previousTotal),
      comparison: "vs previous period",
      icon: <Wallet size={21} />,
      card: "border-emerald-100 bg-emerald-50/70",
      iconStyle: "bg-emerald-100 text-emerald-700",
      valueStyle: "text-zinc-900",
    },
  ];

  return (
    <section className="w-full rounded-3xl border border-slate-100 bg-white p-5 text-zinc-900 shadow-xl shadow-slate-200/50 sm:p-7">
      <header className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xl font-bold tracking-tight sm:text-2xl">
            {greeting}, {audience} 👋
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s your business performance overview
          </p>
        </div>

        <form
          onSubmit={applyCustomDates}
          className="grid min-w-0 grid-cols-2 gap-3 xl:flex xl:flex-wrap xl:items-end"
        >
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 xl:w-auto">
            Start date
            <input
              type="date"
              value={startDate}
              max={getTodayDate()}
              onChange={(event) => setStartDate(event.target.value)}
              required
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 xl:w-auto"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 xl:w-auto">
            End date
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={getTodayDate()}
              onChange={(event) => setEndDate(event.target.value)}
              required
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 xl:w-auto"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 xl:w-auto">
            Period
            <select
              value={range}
              onChange={(event) => {
                setRange(event.target.value as EarningRange);
                setAppliedDates(undefined);
              }}
              className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 xl:min-w-32 xl:w-auto"
            >
              {EARNING_RANGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 xl:w-auto"
          >
            <Filter size={16} />
            Apply dates
          </button>
        </form>
      </header>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.4 }}
            className={`rounded-2xl border p-4 sm:p-5 ${metric.card}`}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${metric.iconStyle}`}
                >
                  {metric.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {metric.label}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-black tracking-tight sm:text-3xl ${metric.valueStyle}`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {metric.sub}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`flex items-center justify-end gap-1 text-xs font-bold sm:text-sm ${
                    metric.change === undefined
                      ? "text-slate-400"
                      : metric.change === null || metric.change >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                  }`}
                >
                  {metric.change === undefined
                    ? "—"
                    : metric.change === null
                      ? "New"
                      : `${metric.change > 0 ? "+" : ""}${Math.round(metric.change)}%`}
                  {metric.change !== undefined &&
                    (metric.change === null || metric.change >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    ))}
                </p>
                <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                  {metric.comparison}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <BarChart3 size={20} />
            </span>
            <div>
              <h3 className="font-bold text-zinc-900">Earnings overview</h3>
              <p className="text-xs text-slate-500">
                {periodDescription} performance
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            {[
              { label: "Daily earnings", color: "bg-zinc-400" },
              { label: "Best day", color: "bg-amber-500" },
              { label: "Today", color: "bg-emerald-500" },
            ].map((item) => (
              <span
                key={item.label}
                className="group flex cursor-default items-center gap-2 rounded-full px-1 py-1 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:scale-105 hover:text-zinc-900"
              >
                <i
                  className={`h-2.5 w-2.5 rounded-full ${item.color} transition-all duration-300 ease-in-out group-hover:scale-150 group-hover:shadow-[0_0_10px_currentColor]`}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${range}-${appliedDates?.startDate ?? ""}-${appliedDates?.endDate ?? ""}`}
            initial={{ opacity: 0, scaleY: 0.96 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningData} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e4e4e7"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: string) =>
                    formatDate(date, range === "year")
                  }
                  tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
                  axisLine={{ stroke: "#d4d4d8" }}
                  tickLine={false}
                  minTickGap={12}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) =>
                    `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                  }
                />
                <Tooltip
                  cursor={{ fill: "#e4e4e7", opacity: 0.55 }}
                  contentStyle={{
                    border: "1px solid #e4e4e7",
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    color: "#18181b",
                  }}
                  labelStyle={{ color: "#52525b" }}
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Earnings",
                  ]}
                  labelFormatter={(label) => formatDate(String(label), true)}
                />
                <Bar dataKey="earnings" radius={[7, 7, 2, 2]} maxBarSize={34}>
                  {earningData.map((day) => {
                    const isToday = day.date === getTodayDate();
                    const isBest =
                      day.earnings === bestEarning && bestEarning > 0;
                    return (
                      <Cell
                        key={day.date}
                        fill={
                          isToday ? "#10b981" : isBest ? "#f59e0b" : "#a1a1aa"
                        }
                        fillOpacity={isToday || isBest ? 1 : 0.82}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
        {loading && (
          <p className="mt-2 text-center text-sm text-slate-500">
            Loading earnings...
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl bg-white p-5 text-slate-900 shadow-lg">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <CalendarDays size={18} className="text-blue-600" />
            Earnings breakdown
          </h3>
          <div className="grid grid-cols-3 divide-x divide-zinc-200">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`min-w-0 px-2 ${index === 0 ? "pl-0" : ""}`}
              >
                <p className="truncate text-xs font-medium text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-1 truncate text-lg font-extrabold">
                  {metric.value}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {index === 0 && bestDay
                    ? formatDate(bestDay.date, true)
                    : index === 1
                      ? "per day"
                      : periodDescription}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="hidden rounded-2xl border border-slate-100 bg-slate-50 p-5 text-slate-900 shadow-sm md:block">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <span className="text-lg">💡</span>
            Quick insights
          </h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <Check
                size={17}
                className="mt-0.5 shrink-0 rounded-full bg-emerald-100 p-0.5 text-emerald-600"
              />
              {bestDay ? (
                <>
                  Your best earning day was
                  <strong>{formatDate(bestDay.date, true)}</strong> with{" "}
                  <strong>{formatCurrency(bestEarning)}</strong>.
                </>
              ) : (
                "No completed earnings in this period yet."
              )}
            </li>
            <li className="flex items-start gap-2">
              <Check
                size={17}
                className="mt-0.5 shrink-0 rounded-full bg-emerald-100 p-0.5 text-emerald-600"
              />
              Daily average earnings are{" "}
              <strong>{formatCurrency(average)}</strong> across{" "}
              {earningData.length} days.
            </li>
            <li className="flex items-start gap-2">
              <Check
                size={17}
                className="mt-0.5 shrink-0 rounded-full bg-emerald-100 p-0.5 text-emerald-600"
              />
              Total earnings for {periodDescription.toLowerCase()} are{" "}
              <strong>{formatCurrency(total)}</strong>.
            </li>
          </ul>
        </section>
      </div>
    </section>
  );
}

export default EarningDashboard;
