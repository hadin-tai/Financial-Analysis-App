import { useEffect, useMemo, useState } from "react";
import { fetchTransactionSummary } from "../../api/transactionApi";
import { fetchFinancialHealth } from "../../api/balanceApi";

// Format numbers in Indian numbering system (lakhs, crores)
const formatNumberIN = (value, fractionDigits = 0) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(Number(value) || 0);
  } catch {
    return String(value ?? 0);
  }
};

const formatCurrencyINR = (value, { showSign = false } = {}) => {
  const numeric = Number(value) || 0;
  const sign = showSign ? (numeric > 0 ? "+" : numeric < 0 ? "-" : "") : "";
  return `₹ ${sign}${formatNumberIN(Math.abs(numeric), 0)}`;
};

// Dynamically discover dashboard icons; safe even if none exist
const iconFiles = import.meta.glob("../../assets/dashboard/*.{svg,png}", {
  eager: true,
  as: "url",
});

const findIconUrl = (keyword) => {
  const lower = String(keyword).toLowerCase();
  for (const [path, url] of Object.entries(iconFiles)) {
    const file = path.split("/").pop()?.toLowerCase() || "";
    if (file.includes(lower)) return url;
  }
  return null;
};

function computeRange(optionKey) {
  // Use the current date so filters reflect real-time ranges
  const end = new Date();
  const start = new Date(end);
  
  switch (optionKey) {
    case '7d':
      start.setDate(end.getDate() - 6); // June 24-30, 2025
      break;
    case '15d':
      start.setDate(end.getDate() - 14); // June 16-30, 2025
      break;
    case '30d':
      start.setDate(end.getDate() - 29); // June 1-30, 2025
      break;
    case '6m':
      start.setMonth(end.getMonth() - 5);
      start.setDate(1); // January 1, 2025
      break;
    case '12m':
      start.setMonth(end.getMonth() - 11);
      start.setDate(1); // July 1, 2024
      break;
    case '5y':
      start.setFullYear(end.getFullYear() - 5); // June 30, 2020
      break;
    case 'all':
    default:
      return { key: 'all', startDate: null, endDate: null };
  }
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return { key: optionKey, startDate: iso(start), endDate: iso(end) };
}

function DateRangeSelector({ onChange }) {
  const options = [
    { key: '7d', label: 'Last 7 Days' },
    { key: '15d', label: 'Last 15 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: '6m', label: 'Last 6 Months' },
    { key: '12m', label: 'Last 12 Months' },
    { key: '5y', label: 'Last 5 Years' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="relative inline-flex items-center bg-white border-2 border-black rounded-xl px-3 py-2 shadow-sm select-none">
      <select
        className="appearance-none bg-transparent pr-6 border-none outline-none focus:ring-0 text-sm font-medium"
        defaultValue="all"
        onChange={(e) => onChange(computeRange(e.target.value))}
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>{opt.label}</option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-4 w-4 text-gray-700"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function KPICard({ title, iconUrl, iconFallback, valueNode }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white px-6 py-5 w-full max-w-[340px]">
      <div className="flex items-start justify-between">
        <div className="text-base font-semibold text-gray-800 leading-tight">
          {title}
        </div>
        {iconUrl ? (
          <img src={iconUrl} alt="" className="h-6 w-6 shrink-0" />
        ) : (
          <div className="text-xl select-none" aria-hidden>
            {iconFallback}
          </div>
        )}
      </div>
      <div className="mt-4">
        {valueNode}
      </div>
    </div>
  );
}

export default function KPISection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const REFRESH_INTERVAL_MS = 15000; // 15s background refresh
  const [range, setRange] = useState({ key: 'all', startDate: null, endDate: null });

  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;
        const [s, h] = await Promise.all([
          fetchTransactionSummary(params),
          fetchFinancialHealth(params),
        ]);
        if (!isMounted) return;
        setSummary(s);
        setHealth(h);
      } catch (e) {
        if (!isMounted) return;
        setError("Failed to load KPIs");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // initial load
    refresh();

    // periodic refresh
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);

    // refresh on focus/visibility and custom app events
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onAppDataChanged = () => refresh();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("app:data:changed", onAppDataChanged);
    window.addEventListener("transactions:changed", onAppDataChanged);
    window.addEventListener("balances:changed", onAppDataChanged);
    window.addEventListener("budgets:changed", onAppDataChanged);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("app:data:changed", onAppDataChanged);
      window.removeEventListener("transactions:changed", onAppDataChanged);
      window.removeEventListener("balances:changed", onAppDataChanged);
      window.removeEventListener("budgets:changed", onAppDataChanged);
    };
  }, [range]);

  // Broadcast range changes so other dashboard sections (charts) can react
  useEffect(() => {
    try {
      const detail = { startDate: range.startDate, endDate: range.endDate, key: range.key };
      window.dispatchEvent(new CustomEvent('dashboard:range-changed', { detail }));
    } catch (_) {
      // no-op if CustomEvent not available
    }
  }, [range]);

  const kpis = useMemo(() => {
    const totalIncome = summary?.totalIncome || 0;
    const totalExpense = summary?.totalExpense || 0;
    const netProfit = summary?.netProfit ?? totalIncome - totalExpense;

    const currentRatio = health?.financialMetrics?.currentRatio ?? null;
    const debtEquity = health?.financialMetrics?.debtToEquityRatio ?? null;
    // Read budget utilization from budgetMetrics per backend response shape
    const budgetUtilization = health?.budgetMetrics?.budgetUtilization ?? null;

    return [
      {
        title: "Total Income",
        iconUrl: findIconUrl("income"),
        iconFallback: "🪙",
        valueNode: (
          <div className="text-4xl font-bold tracking-tight text-green-600">
            {formatCurrencyINR(totalIncome, { showSign: true })}
          </div>
        ),
      },
      {
        title: "Total Expense",
        iconUrl: findIconUrl("expense"),
        iconFallback: "📉",
        valueNode: (
          <div className="text-4xl font-bold tracking-tight text-red-600">
            {formatCurrencyINR(-Math.abs(totalExpense), { showSign: true })}
          </div>
        ),
      },
      {
        title: (
          <>
            <span>Net Profit /</span>
            <br />
            <span>Loss</span>
          </>
        ),
        iconUrl: findIconUrl("profit"),
        iconFallback: "📈",
        valueNode: (
          <div
            className={
              "text-4xl font-bold tracking-tight " +
              (netProfit >= 0 ? "text-green-600" : "text-red-600")
            }
          >
            {formatCurrencyINR(netProfit, { showSign: true })}
          </div>
        ),
      },
      {
        title: "Current Ratio",
        iconUrl: findIconUrl("current"),
        iconFallback: "🔍",
        valueNode: (
          <div className="text-4xl font-extrabold text-gray-900">
            {currentRatio === null ? "—" : formatNumberIN(currentRatio, 2)}
          </div>
        ),
      },
      {
        title: (
          <>
            <span>Debt-to-Equity</span>
            <br />
            <span>Ratio</span>
          </>
        ),
        iconUrl: findIconUrl("debt") || findIconUrl("equity"),
        iconFallback: "⚖️",
        valueNode: (
          <div className="text-4xl font-extrabold text-gray-900">
            {debtEquity === null ? "—" : formatNumberIN(debtEquity, 2)}
          </div>
        ),
      },
      {
        title: (
          <>
            <span>Budget</span>
            <br />
            <span>Utilization</span>
          </>
        ),
        iconUrl: findIconUrl("budget") || findIconUrl("utilization"),
        iconFallback: "📋",
        valueNode: (
          <div className="text-4xl font-extrabold text-gray-900">
            {`% ${budgetUtilization === null ? "—" : formatNumberIN(budgetUtilization, 2)}`}
          </div>
        ),
      },
    ];
  }, [summary, health]);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-end mb-4">
        <DateRangeSelector onChange={setRange} />
      </div>
      {error ? (
        <div className="text-sm text-red-600 mb-4">{error}</div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center lg:justify-between">
        {(loading ? Array.from({ length: 6 }) : kpis).map((k, idx) => (
          <div key={idx} className="animate-pulse" hidden={!loading}>
            <div className="rounded-2xl h-28 bg-gray-100 w-full max-w-[340px]" />
          </div>
        ))}

        {!loading &&
          kpis.map((k, idx) => (
            <div key={idx} className="flex justify-center">
              <KPICard
                title={k.title}
                iconUrl={k.iconUrl}
                iconFallback={k.iconFallback}
                valueNode={k.valueNode}
              />
            </div>
          ))}
      </div>
    </section>
  );
}


