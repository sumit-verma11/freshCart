"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus,
  Users, ShoppingBag, DollarSign, Repeat2,
  Package, AlertTriangle, BarChart2, Download,
  RefreshCw, Wifi, WifiOff,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LiveData {
  todayOrders: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  activeSessions: number;
}

interface AnalyticsData {
  period: number;
  dailyRevenue: { date: string; label: string; revenue: number; orders: number }[];
  ordersByDow: { day: string; orders: number; revenue: number }[];
  categories: { name: string; revenue: number; units: number; orders: number }[];
  summary: {
    periodRevenue: number;
    periodOrders: number;
    prevPeriodRevenue: number;
    prevPeriodOrders: number;
    aov: number;
    totalRevenue: number;
    totalOrders: number;
    totalDiscount: number;
  };
  topProductsByRevenue: { productId: string; name: string; revenue: number; units: number; orderCount: number }[];
  topProductsByUnits:   { productId: string; name: string; units: number; revenue: number; orderCount: number }[];
  inventory: {
    lowStock:   { _id: string; name: string; slug: string; stockQty: number; salesVelocity: number }[];
    outOfStock: { _id: string; name: string; slug: string }[];
    slowMoving: { _id: string; name: string; slug: string; stockQty: number }[];
  };
  customers: {
    newThisWeek: number;
    returningThisWeek: number;
    repeatPurchaseRate: number;
    avgDaysBetweenOrders: number;
    topCustomers: { name: string; email: string; totalSpend: number; orderCount: number; lastOrderAt: string }[];
  };
  pincodes: { pincode: string; orders: number; revenue: number }[];
  funnel: { name: string; value: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

function pct(cur: number, prev: number) {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function TrendBadge({ cur, prev }: { cur: number; prev: number }) {
  const p = pct(cur, prev);
  if (p === null) return null;
  if (p > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
        <TrendingUp className="w-3 h-3" /> +{p}%
      </span>
    );
  if (p < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
        <TrendingDown className="w-3 h-3" /> {p}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
}

const PIE_COLORS = [
  "#1A6B3A", "#22c55e", "#86efac", "#facc15", "#fb923c",
  "#f87171", "#818cf8", "#38bdf8", "#e879f9", "#94a3b8",
];

const FUNNEL_COLORS = ["#1A6B3A", "#22c55e", "#86efac"];

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: React.ReactNode;
  trend?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod]     = useState(30);
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [live, setLive]         = useState<LiveData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [liveErr, setLiveErr]   = useState(false);
  const [productTab, setProductTab] = useState<"revenue" | "units">("revenue");
  const [invTab, setInvTab]     = useState<"low" | "out" | "slow">("low");

  // ── Fetch main analytics ───────────────────────────────────────────────────

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/analytics?period=${period}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // ── Poll live widgets every 30 s ──────────────────────────────────────────

  const fetchLive = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/analytics/live");
      const json = await res.json();
      if (json.success) { setLive(json.data); setLiveErr(false); }
    } catch { setLiveErr(true); }
  }, []);

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 30_000);
    return () => clearInterval(id);
  }, [fetchLive]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" /> Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue, orders, inventory &amp; customer insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period tabs */}
          {([7, 30, 90] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors
                          ${period === p
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {p}d
            </button>
          ))}
          {/* Refresh */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {/* CSV Exports */}
          <a
            href="/api/admin/export?type=orders"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Orders CSV
          </a>
          <a
            href="/api/admin/export?type=products"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Products CSV
          </a>
        </div>
      </div>

      {/* ── Live Widget Strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's orders */}
        <div className="bg-primary text-white rounded-2xl p-4 shadow">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Today's Orders</p>
          <p className="text-3xl font-bold mt-1">{live?.todayOrders ?? "—"}</p>
          <p className="text-xs opacity-70 mt-1">updates every 30 s</p>
        </div>
        {/* Today's revenue */}
        <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Today's Revenue</p>
          <p className="text-3xl font-bold mt-1">{live ? fmt(live.todayRevenue) : "—"}</p>
          {live && live.yesterdayRevenue > 0 && (
            <p className="text-xs opacity-70 mt-1">
              vs yesterday {fmt(live.yesterdayRevenue)}
              {" "}({pct(live.todayRevenue, live.yesterdayRevenue) ?? 0}%)
            </p>
          )}
        </div>
        {/* Active sessions */}
        <div className="bg-violet-600 text-white rounded-2xl p-4 shadow">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Active Sessions</p>
          <p className="text-3xl font-bold mt-1">{live?.activeSessions ?? "—"}</p>
          <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
            {liveErr
              ? <><WifiOff className="w-3 h-3" /> connection error</>
              : <><Wifi className="w-3 h-3" /> SSE connections</>}
          </p>
        </div>
        {/* Period AOV */}
        <div className="bg-amber-500 text-white rounded-2xl p-4 shadow">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Avg Order Value</p>
          <p className="text-3xl font-bold mt-1">{data ? fmt(data.summary.aov) : "—"}</p>
          <p className="text-xs opacity-70 mt-1">last {period} days</p>
        </div>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label={`Revenue (${period}d)`}
            value={fmt(data.summary.periodRevenue)}
            trend={<TrendBadge cur={data.summary.periodRevenue} prev={data.summary.prevPeriodRevenue} />}
            sub={`All-time: ${fmt(data.summary.totalRevenue)}`}
          />
          <StatCard
            icon={ShoppingBag}
            label={`Orders (${period}d)`}
            value={data.summary.periodOrders.toLocaleString()}
            trend={<TrendBadge cur={data.summary.periodOrders} prev={data.summary.prevPeriodOrders} />}
            sub={`All-time: ${data.summary.totalOrders.toLocaleString()}`}
          />
          <StatCard
            icon={Users}
            label="New Customers (7d)"
            value={data.customers.newThisWeek.toLocaleString()}
            sub={`Returning: ${data.customers.returningThisWeek}`}
          />
          <StatCard
            icon={Repeat2}
            label="Repeat Purchase Rate"
            value={`${data.customers.repeatPurchaseRate}%`}
            sub={`Avg ${data.customers.avgDaysBetweenOrders}d between orders`}
          />
        </div>
      )}

      {/* ── Revenue + Orders Line Chart ───────────────────────────────────── */}
      {data && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            Daily Revenue &amp; Orders — last {period} days
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.dailyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={period <= 14 ? 0 : period <= 30 ? 4 : 9}
              />
              <YAxis yAxisId="rev" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((val: unknown, name: string) =>
                  name === "revenue" ? [fmt(Number(val)), "Revenue"] : [val, "Orders"]
                ) as any}
              />
              <Legend />
              <Line
                yAxisId="rev"
                type="monotone"
                dataKey="revenue"
                stroke="#1A6B3A"
                strokeWidth={2}
                dot={false}
                name="revenue"
              />
              <Line
                yAxisId="ord"
                type="monotone"
                dataKey="orders"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Orders by DOW + Category Donut ────────────────────────────────── */}
      {data && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* DOW Bar Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-800 mb-4">Orders by Day of Week</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.ordersByDow} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#1A6B3A" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Donut */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-800 mb-4">Revenue by Category</h2>
            {data.categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.categories}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius="50%"
                    outerRadius="80%"
                    paddingAngle={2}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={({ name, percent }: any) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.categories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Funnel Chart ──────────────────────────────────────────────────── */}
      {data && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-1">Conversion Funnel — last 30 days</h2>
          <p className="text-xs text-gray-400 mb-4">Product views → add to cart → orders</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {data.funnel.map((step, i) => {
              const prevVal = i > 0 ? data.funnel[i - 1].value : null;
              const dropPct = prevVal && prevVal > 0
                ? Math.round(((prevVal - step.value) / prevVal) * 100)
                : null;
              return (
                <div key={step.name} className="flex flex-col items-center gap-1">
                  <div
                    className="rounded-2xl text-white font-bold flex items-center justify-center text-lg shadow"
                    style={{
                      backgroundColor: FUNNEL_COLORS[i],
                      width: `${Math.max(120, 200 - i * 30)}px`,
                      height: "72px",
                    }}
                  >
                    {step.value.toLocaleString()}
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{step.name}</p>
                  {dropPct !== null && (
                    <p className="text-xs text-red-400">▼ {dropPct}% drop</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Top Products ──────────────────────────────────────────────────── */}
      {data && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Top Products</h2>
            <div className="flex gap-2">
              {(["revenue", "units"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setProductTab(t)}
                  className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors
                              ${productTab === t
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {t === "revenue" ? "By Revenue" : "By Units"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-semibold">#</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Product</th>
                  <th className="text-right py-2 text-gray-500 font-semibold">Revenue</th>
                  <th className="text-right py-2 text-gray-500 font-semibold">Units</th>
                  <th className="text-right py-2 text-gray-500 font-semibold">Orders</th>
                </tr>
              </thead>
              <tbody>
                {(productTab === "revenue" ? data.topProductsByRevenue : data.topProductsByUnits).map(
                  (p, i) => (
                    <tr key={p.productId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-400 font-semibold w-8">{i + 1}</td>
                      <td className="py-2.5 text-gray-800 font-medium">{p.name}</td>
                      <td className="py-2.5 text-right text-gray-700">{fmt(p.revenue)}</td>
                      <td className="py-2.5 text-right text-gray-700">{p.units}</td>
                      <td className="py-2.5 text-right text-gray-700">{p.orderCount}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Inventory Alerts ──────────────────────────────────────────────── */}
      {data && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Inventory Alerts
            </h2>
            <div className="flex gap-2 flex-wrap">
              {(["low", "out", "slow"] as const).map((t) => {
                const counts = {
                  low:  data.inventory.lowStock.length,
                  out:  data.inventory.outOfStock.length,
                  slow: data.inventory.slowMoving.length,
                };
                const labels = { low: "Low Stock", out: "Out of Stock", slow: "Slow Moving" };
                return (
                  <button
                    key={t}
                    onClick={() => setInvTab(t)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex items-center gap-1
                                ${invTab === t
                                  ? "bg-amber-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {labels[t]}
                    <span className="text-xs">{counts[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {invTab === "low" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-semibold">Product</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Stock</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Sold (30d)</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.lowStock.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">All clear ✓</td></tr>
                  )}
                  {data.inventory.lowStock.map((p) => {
                    const dailyRate = p.salesVelocity / 30;
                    const daysLeft  = dailyRate > 0 ? Math.round(p.stockQty / dailyRate) : Infinity;
                    return (
                      <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 text-gray-800 font-medium">{p.name}</td>
                        <td className="py-2.5 text-right">
                          <span className={`font-semibold ${p.stockQty <= 5 ? "text-red-500" : "text-amber-500"}`}>
                            {p.stockQty}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-gray-600">{p.salesVelocity}</td>
                        <td className="py-2.5 text-right text-gray-600">
                          {daysLeft === Infinity ? "—" : `~${daysLeft}d`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {invTab === "out" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-semibold">Product</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Slug</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.outOfStock.length === 0 && (
                    <tr><td colSpan={2} className="py-6 text-center text-gray-400">No out-of-stock items ✓</td></tr>
                  )}
                  {data.inventory.outOfStock.map((p) => (
                    <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-800 font-medium">{p.name}</td>
                      <td className="py-2.5 text-gray-400 font-mono text-xs">{p.slug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {invTab === "slow" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-semibold">Product</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Stock</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.slowMoving.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-gray-400">No slow-moving products ✓</td></tr>
                  )}
                  {data.inventory.slowMoving.map((p) => (
                    <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-800 font-medium">{p.name}</td>
                      <td className="py-2.5 text-right text-gray-600">{p.stockQty}</td>
                      <td className="py-2.5 text-xs text-gray-400">No orders in 14 days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Customer Insights + Top Customers ────────────────────────────── */}
      {data && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer KPIs */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Customer Insights
            </h2>
            {[
              { label: "New this week",           value: data.customers.newThisWeek },
              { label: "Returning this week",     value: data.customers.returningThisWeek },
              { label: "Repeat purchase rate",    value: `${data.customers.repeatPurchaseRate}%` },
              { label: "Avg days between orders", value: `${data.customers.avgDaysBetweenOrders}d` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Top Customers table */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-800 mb-4">Top 10 Customers by LTV</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-semibold">Name</th>
                    <th className="text-left py-2 text-gray-500 font-semibold hidden sm:table-cell">Email</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Spent</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.topCustomers.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">No customer data yet</td></tr>
                  )}
                  {data.customers.topCustomers.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-800 font-medium">{c.name}</td>
                      <td className="py-2.5 text-gray-400 text-xs hidden sm:table-cell">{c.email}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-700">{fmt(c.totalSpend)}</td>
                      <td className="py-2.5 text-right text-gray-600">{c.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Pincode Table ─────────────────────────────────────────────────── */}
      {data && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Top Delivery Pincodes
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-semibold">#</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Pincode</th>
                  <th className="text-right py-2 text-gray-500 font-semibold">Orders</th>
                  <th className="text-right py-2 text-gray-500 font-semibold">Revenue</th>
                  <th className="text-right py-2 text-gray-500 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.pincodes.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-400">No orders yet</td></tr>
                )}
                {data.pincodes.map((p, i) => {
                  const totalOrders = data.pincodes.reduce((s, x) => s + x.orders, 0);
                  const share = totalOrders > 0 ? Math.round((p.orders / totalOrders) * 100) : 0;
                  return (
                    <tr key={p.pincode} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-400 font-semibold w-8">{i + 1}</td>
                      <td className="py-2.5 text-gray-800 font-mono font-semibold">{p.pincode || "—"}</td>
                      <td className="py-2.5 text-right text-gray-700">{p.orders}</td>
                      <td className="py-2.5 text-right text-gray-700">{fmt(p.revenue)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && !data && (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-gray-600">Loading analytics…</p>
          </div>
        </div>
      )}
    </div>
  );
}
