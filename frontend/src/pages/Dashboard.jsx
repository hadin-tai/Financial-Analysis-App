// src/pages/Dashboard.jsx
import AppLayout from "../components/layout/AppLayout";
import BlueBoxHeader from "../components/common/BlueBoxHeader";
import KPISection from "../components/dashboard/KPISection";
import TransactionInsightsSection from "../components/dashboard/TransactionInsightsSection";
import BalanceSheetInsightsSection from "../components/dashboard/BalanceSheetInsightsSection";
import BudgetInsightsSection from "../components/dashboard/BudgetInsightsSection";

export default function Dashboard() {
  return (
    <AppLayout>
      <BlueBoxHeader
        heading="Dashboard"
        subtext="View your financial summary, trends, and insights at a glance."
      />
      <KPISection />
      <TransactionInsightsSection />
      <BalanceSheetInsightsSection />
      <BudgetInsightsSection />
    </AppLayout>
  );
}
