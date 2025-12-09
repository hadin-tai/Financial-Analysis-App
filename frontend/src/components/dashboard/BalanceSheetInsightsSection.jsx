import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { fetchAssetsVsLiabilities, fetchFinancialHealth } from "../../api/balanceApi";

function Card({ title, children }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white w-full">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="text-base font-semibold text-gray-800 leading-tight">{title}</div>
      </div>
      <div className="px-2 pb-4 pt-4 sm:px-4" style={{ height: 340 }}>
        {children}
      </div>
    </div>
  );
}

export default function BalanceSheetInsightsSection() {
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [health, setHealth] = useState(null);
  const [range, setRange] = useState({ startDate: null, endDate: null });

  useEffect(() => {
    const handler = (evt) => {
      const { startDate, endDate } = (evt && evt.detail) || {};
      setRange({ startDate: startDate || null, endDate: endDate || null });
    };
    window.addEventListener("dashboard:range-changed", handler);
    return () => window.removeEventListener("dashboard:range-changed", handler);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [cmp, h] = await Promise.all([
          fetchAssetsVsLiabilities({ ...range }),
          fetchFinancialHealth({ ...range }),
        ]);
        if (!isMounted) return;
        setComparison(cmp);
        setHealth(h);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
  }, [range]);

  const comparisonBars = useMemo(() => {
    return (comparison?.chartData || []).map((d) => ({
      period: d.period,
      assets: d.currentAssets,
      liabilities: d.totalLiabilities,
    }));
  }, [comparison]);

  const debtEquityTrend = useMemo(() => {
    return (comparison?.chartData || []).map((d) => ({
      period: d.period,
      ratio: d.debtToEquityRatio,
    }));
  }, [comparison]);

  const netWorthTrend = useMemo(() => {
    return (comparison?.chartData || []).map((d) => ({
      period: d.period,
      netWorth: d.netWorth,
    }));
  }, [comparison]);

  return (
    <section className="mt-10">
      <div className="px-1 mb-4">
        <div className="text-lg font-semibold text-gray-900">Balance Sheet Insights</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Assets vs Liabilities Comparison">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonBars} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v, n) => [`₹ ${Number(v).toLocaleString("en-IN")}`, n]} />
              <Legend />
              <Bar dataKey="assets" name="Assets" fill="#3b82f6" radius={[6,6,0,0]} barSize={28} />
              <Bar dataKey="liabilities" name="Liabilities" fill="#ef4444" radius={[6,6,0,0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Debt-to-Equity Ratio Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={debtEquityTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} minTickGap={28} />
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v) => [Number(v).toFixed(2), "Debt/Equity"]} />
              <Line type="monotone" dataKey="ratio" name="Debt/Equity" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Net Worth / Equity Growth Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorthTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} minTickGap={28} />
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v) => [`₹ ${Number(v).toLocaleString("en-IN")}`, "Net Worth"]} />
              <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {loading ? <div className="text-sm text-gray-500 mt-3">Loading insights…</div> : null}
    </section>
  );
}


