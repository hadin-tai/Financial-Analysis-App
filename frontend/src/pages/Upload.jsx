import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import BlueBoxHeader from "../components/common/BlueBoxHeader";
import FileUploadBox from "../components/upload/FileUploadBox";
import TransactionForm from "../components/upload/TransactionForm";
import BalanceSheetForm from "../components/upload/BalanceSheetForm";
import BudgetForm from "../components/upload/BudgetForm";
import ToggleTabs from "../components/upload/ToggleTabs";
import TransactionsTable from "../components/upload/TransactionsTable";
import BalanceSheetTable from "../components/upload/BalanceSheetTable";
import BudgetTable from "../components/upload/BudgetTable";

function Upload() {
  const [activeTab, setActiveTab] = useState("transactions");

  const tabs = [
    { key: "transactions", label: "Transactions" },
    { key: "balanceSheet", label: "Balance Sheet" },
    { key: "budget", label: "Budget" }
  ];

  return (
    <AppLayout>
      <BlueBoxHeader
        heading="Upload Data"
        subtext="Upload your financial data files or manually enter data below."
      />

      {/* Toggle Tabs */}
      <div className="mb-8">
        <ToggleTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* File Upload Section */}
      <div className="mb-8">
        <FileUploadBox type={activeTab} />
      </div>

      {/* Manual Entry Forms */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Manual Entry</h2>

        {activeTab === "transactions" && <TransactionForm />}
        {activeTab === "balanceSheet" && <BalanceSheetForm />}
        {activeTab === "budget" && <BudgetForm />}
      </div>

      {/* Tables */}
      <div className="mt-10 space-y-12">
        <TransactionsTable />
        <BalanceSheetTable />
        <BudgetTable />
      </div>
    </AppLayout>
  );
}

export default Upload;
