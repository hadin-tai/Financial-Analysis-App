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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  fetchBudgetVsActualByCategory,
  fetchBudgetPerformanceOverTime,
  fetchBudgetAllocationPie
} from "../../api/budgetApi";

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

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#06b6d4", "#eab308", "#10b981", "#f59e0b"];

export default function BudgetInsightsSection() {
  const [loading, setLoading] = useState(false);
  const [enhanced, setEnhanced] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [allocation, setAllocation] = useState([]);
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
        // Calculate months based on date range
        let months = 12; // default
        if (range.startDate && range.endDate) {
          const start = new Date(range.startDate);
          const end = new Date(range.endDate);
          const diffTime = Math.abs(end - start);
          const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // average days per month
          months = Math.max(1, Math.min(60, diffMonths)); // limit between 1 and 60 months
        }
        
        const [en, perf, alloc] = await Promise.all([
          fetchBudgetVsActualByCategory({ ...range }),
          fetchBudgetPerformanceOverTime({ 
            months,
            startDate: range.startDate,
            endDate: range.endDate
          }),
          fetchBudgetAllocationPie({ ...range }),
        ]);
        if (!isMounted) return;
        setEnhanced(en);
        setPerformance(perf);
        setAllocation(alloc);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
  }, [range]);

  const barData = useMemo(() => {
    return (enhanced?.byCategory || []).map(c => ({
      category: c.category,
      budgeted: Math.round(c.budgeted * 100) / 100,
      actual: Math.round(c.actual * 100) / 100,
    }));
  }, [enhanced]);

  const lineData = useMemo(() => {
    return (performance?.monthlyPerformance || []).map(m => ({
      month: `${m.monthName?.slice(0,3) || m.month}`,
      budgeted: m.budgeted,
      actual: m.actual,
    }));
  }, [performance]);

  const pieData = useMemo(() => {
    const items = allocation || [];
    const total = items.reduce((s,i)=>s+i.budgeted,0) || 1;
    return items.map((i) => ({ name: i.category, value: i.budgeted, percent: Math.round((i.budgeted/total)*10000)/100 }));
  }, [allocation]);

  return (
    <section className="mt-10">
      <div className="px-1 mb-4">
        <div className="text-lg font-semibold text-gray-900">Budget Insights</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Budget vs Actual Expenses per Category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} minTickGap={28}/>
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v, n) => [`₹ ${Number(v).toLocaleString("en-IN")}`, n]} />
              <Legend />
              <Bar dataKey="budgeted" name="Budgeted" fill="#3b82f6" radius={[6,6,0,0]} barSize={28} />
              <Bar dataKey="actual" name="Actual" fill="#ef4444" radius={[6,6,0,0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Planned vs Actual Spending Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} minTickGap={28} />
              <YAxis tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
              <RechartsTooltip formatter={(v, n) => [`₹ ${Number(v).toLocaleString("en-IN")}`, n]} />
              <Legend />
              <Line type="monotone" dataKey="budgeted" name="Budgeted" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Budget Allocation Across Categories">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RechartsTooltip formatter={(v, n, p) => [`₹ ${Number(v).toLocaleString("en-IN")}`, p?.payload?.name || "Category"]} />
              <Legend verticalAlign="bottom" height={24} />
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {loading ? <div className="text-sm text-gray-500 mt-3">Loading insights…</div> : null}
    </section>
  );
}


