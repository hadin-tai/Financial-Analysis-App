import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  fetchTransactionSummary,
  fetchExpenseDistribution,
  fetchCashFlowTrends,
} from "../../api/transactionApi";

function Card({ title, children, actionNode }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white w-full">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="text-base font-semibold text-gray-800 leading-tight">
          {title}
        </div>
        {actionNode || null}
      </div>
      <div className="px-2 pb-4 pt-4 sm:px-4" style={{ height: 340 }}>
        {children}
      </div>
    </div>
  );
}

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#06b6d4", "#eab308", "#10b981", "#f59e0b"];

export default function TransactionInsightsSection() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [expenseDist, setExpenseDist] = useState(null);
  const [cashflow, setCashflow] = useState({ period: "monthly", cashFlowTrends: [] });
  const [period, setPeriod] = useState("monthly");
  const [range, setRange] = useState({ startDate: null, endDate: null });

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const params = { ...range };
        const [s, e, c] = await Promise.all([
          fetchTransactionSummary(params),
          fetchExpenseDistribution(params),
          fetchCashFlowTrends({ period, ...params }),
        ]);
        if (!isMounted) return;
        setSummary(s);
        setExpenseDist(e);
        setCashflow(c);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();

    const onAppDataChanged = () => fetchAll();
    window.addEventListener("app:data:changed", onAppDataChanged);
    window.addEventListener("transactions:changed", onAppDataChanged);
    return () => {
      isMounted = false;
      window.removeEventListener("app:data:changed", onAppDataChanged);
      window.removeEventListener("transactions:changed", onAppDataChanged);
    };
  }, [period, range]);

  // Listen to global range change events from KPISection
  useEffect(() => {
    const handler = (evt) => {
      const { startDate, endDate } = (evt && evt.detail) || {};
      setRange({ startDate: startDate || null, endDate: endDate || null });
    };
    window.addEventListener('dashboard:range-changed', handler);
    return () => window.removeEventListener('dashboard:range-changed', handler);
  }, []);

  const incomeVsExpense = useMemo(() => {
    const income = summary?.totalIncome || 0;
    const expense = summary?.totalExpense || 0;
    return [
      { name: "Income", amount: income },
      { name: "Expense", amount: expense },
    ];
  }, [summary]);

  const expensePieData = useMemo(() => {
    const items = expenseDist?.chartData || [];
    return items.map((d) => ({ name: d.category, value: d.totalExpense }));
  }, [expenseDist]);

  const trendsData = useMemo(() => {
    return cashflow?.cashFlowTrends || [];
  }, [cashflow]);

  return (
    <section className="mt-8">
      <div className="px-1 mb-4">
        <div className="text-lg font-semibold text-gray-900">Transaction Insights</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Total Income vs Total Expense">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpense} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v) => [`₹ ${Number(v).toLocaleString("en-IN")}`, "Amount"]} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={28}>
                {incomeVsExpense.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.name === "Income" ? "#16a34a" : "#dc2626"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Category-wise Expense Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RechartsTooltip formatter={(v, n, p) => [`₹ ${Number(v).toLocaleString("en-IN")}`, p?.payload?.name || "Category"]} />
              <Legend verticalAlign="bottom" height={24} />
              <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} label>
                {expensePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card
          title="Monthly/Weekly Income & Expense Trends"
          actionNode={
            <div className="inline-flex items-center gap-1 text-xs bg-gray-100 rounded-md p-1">
              <button
                className={`px-2 py-1 rounded ${period === "monthly" ? "bg-white shadow border" : "text-gray-600"}`}
                onClick={() => setPeriod("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-2 py-1 rounded ${period === "weekly" ? "bg-white shadow border" : "text-gray-600"}`}
                onClick={() => setPeriod("weekly")}
              >
                Weekly
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} minTickGap={28} />
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v, n) => [`₹ ${Number(v).toLocaleString("en-IN")}`, n]} />
              <Legend />
              <Line type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Cash Flow Trend Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} minTickGap={28} />
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v) => [`₹ ${Number(v).toLocaleString("en-IN")}`, "Net Cash Flow"]} />
              <Line type="monotone" dataKey="netCashFlow" name="Net Cash Flow" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 mt-3">Loading insights…</div>
      ) : null}
    </section>
  );
}


