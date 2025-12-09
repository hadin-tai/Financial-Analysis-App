from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


def to_readable_date(date_value):
    """Safely convert any date into a readable format."""
    try:
        if isinstance(date_value, datetime):
            return date_value.strftime("%d %B %Y")
        return datetime.strptime(str(date_value), "%Y-%m-%d").strftime("%d %B %Y")
    except:
        return str(date_value) or "Unknown date"


def normalize(text: str):
    return " ".join(text.split()).strip()


def build_chunks(user_data: Dict[str, List[Any]]) -> List[Dict[str, Any]]:
    chunks = []

    transactions = user_data.get("transactions", [])
    budgets = user_data.get("budgets", [])
    balance_sheets = user_data.get("balance_sheets", [])
    print("transactions: \n", transactions)
    print("budgets: \n", budgets)
    print("balance_sheets: \n", balance_sheets)
    # -------------------------------------------------------------
    # 🔥 GROUP TRANSACTIONS BY YEAR-MONTH
    # -------------------------------------------------------------
    tx_by_month = defaultdict(list)
    for tx in transactions:
        try:
            d = datetime.fromisoformat(str(tx["date"]).replace("Z", ""))
            key = d.strftime("%Y-%m")   # Example: "2025-07"
        except:
            key = "unknown"
        tx_by_month[key].append(tx)

    # -------------------------------------------------------------
    # 🔥 TRANSACTION: MONTH-WISE CHUNKS
    # -------------------------------------------------------------
    for month, tx_list in tx_by_month.items():
        year = month.split("-")[0]
        month_num = month.split("-")[1]
        month_name = datetime.strptime(month_num, "%m").strftime("%B")

        lines = []
        total_income = 0
        total_expense = 0
        category_summary = defaultdict(float)

        # Build detailed lines
        for tx in tx_list:
            date = to_readable_date(tx.get("date"))
            amount = tx.get("amount", 0)
            tx_type = tx.get("type")
            category = tx.get("category")

            # Totals
            if tx_type == "income":
                total_income += amount
            else:
                total_expense += amount

            category_summary[category] += amount

            lines.append(
                f"- [{date}] {tx_type.upper()} | {amount} | Category: {category} | Status: {tx.get('status')} | Payment: {tx.get('paymentMethod')}"
            )

        # Category line
        category_lines = [
            f"- {cat}: {amt}" for cat, amt in category_summary.items()
        ]

        text = f"""
        MONTHLY TRANSACTION OVERVIEW
        Month: {month_name} {year}

        Total Income: {total_income}
        Total Expense: {total_expense}
        Net Savings: {total_income - total_expense}

        Category Summary:
        {chr(10).join(category_lines)}

        All Transactions:
        {chr(10).join(lines)}

        Meaning:
        This chunk summarizes ALL transactions of {month_name} {year}.
        """

        chunks.append({
            "text": normalize(text),
            "metadata": {
                "type": "monthly_transaction",
                "month": month,
                "year": year
            }
        })

    # -------------------------------------------------------------
    # 🔥 ADD MINI SUMMARY CHUNKS (PER MONTH)
    # -------------------------------------------------------------
    for month, tx_list in tx_by_month.items():
        year = month.split("-")[0]
        month_num = month.split("-")[1]
        month_name = datetime.strptime(month_num, "%m").strftime("%B")

        total_income = sum(tx["amount"] for tx in tx_list if tx["type"] == "income")
        total_expense = sum(tx["amount"] for tx in tx_list if tx["type"] == "expense")

        summary = f"""
        MONTH SUMMARY (FINANCIAL)
        Month: {month_name} {year}
        Total Income: {total_income}
        Total Expense: {total_expense}
        Net Flow: {total_income - total_expense}

        Meaning: Use this for fast monthly financial questions.
        """

        chunks.append({
            "text": normalize(summary),
            "metadata": {
                "type": "monthly_summary",
                "month": month,
                "year": year
            }
        })

    # -------------------------------------------------------------
    # 🔥 BUDGETS – month-wise chunk
    # -------------------------------------------------------------
    budgets_by_month = defaultdict(list)
    for b in budgets:
        budgets_by_month[b.get("month", "unknown")].append(b)

    for month, b_list in budgets_by_month.items():
        lines = [
            f"- {b['category']} → Budget: {b['budgetAmount']} | Notes: {b.get('notes', 'None')}"
            for b in b_list
        ]

        text = f"""
        MONTHLY BUDGET OVERVIEW
        Month: {month}

        Budgets:
        {chr(10).join(lines)}

        Meaning:
        This contains ALL budget allocations for {month}.
        """

        chunks.append({
            "text": normalize(text),
            "metadata": {
                "type": "monthly_budget",
                "month": month
            }
        })

    # -------------------------------------------------------------
    # 🔥 BALANCE SHEETS – one chunk per entry (usually few rows)
    # -------------------------------------------------------------
    for bs in balance_sheets:
        date = to_readable_date(bs.get("date"))

        text = f"""
        BALANCE SHEET SNAPSHOT
        Date: {date}
        Current Assets: {bs.get('currentAssets')}
        Current Liabilities: {bs.get('currentLiabilities')}
        Total Liabilities: {bs.get('totalLiabilities')}
        Total Equity: {bs.get('totalEquity')}
        Notes: {bs.get('notes', 'None')}

        Meaning:
        This represents the user's financial position on {date}.
        """

        chunks.append({
            "text": normalize(text),
            "metadata": {
                "type": "balance_sheet",
                "date": str(bs.get("date", "")),
            }
        })

    return chunks




















































# from typing import Dict, List, Any
# from datetime import datetime


# def to_readable_date(date_value):
#     """Safely convert a date/datetime/string into readable format."""
#     try:
#         if isinstance(date_value, datetime):
#             return date_value.strftime("%d %B %Y")
#         return datetime.strptime(str(date_value), "%Y-%m-%d").strftime("%d %B %Y")
#     except:
#         return str(date_value) or "Unknown date"


# def normalize(text: str):
#     return " ".join(text.split()).strip()


# def build_chunks(user_data: Dict[str, List[Any]]) -> List[Dict[str, Any]]:
#     """
#     Converts user financial datasets (transactions, budgets, balance sheets)
#     into high-quality semantic chunks for vector search + LLM reasoning.
#     """
#     chunks = []

#     # =====================================================================
#     #  🔹 TRANSACTIONS  (income, expense)
#     # =====================================================================
#     for tx in user_data.get("transactions", []):
#         tx_date = to_readable_date(tx.get("date"))
#         due_date = to_readable_date(tx.get("dueDate")) if tx.get("dueDate") else "None"

#         text = f"""
#         TRANSACTION RECORD
#         - Transaction ID: {tx.get('_id', '')}
#         - Type: {tx.get('type', 'unknown')}  # income / expense
#         - Amount: {tx.get('amount', 0)}
#         - Category: {tx.get('category', 'unknown')}
#         - Payment Method: {tx.get('paymentMethod', 'unknown')}
#         - Status: {tx.get('status', 'unknown')}
#         - Date: {tx_date}
#         - Due Date: {due_date}
#         - Notes: {tx.get('notes', 'None')}

#         Meaning:
#         This record represents a {tx.get('type')} of amount {tx.get('amount')}
#         under category '{tx.get('category')}' on {tx_date}. 
#         """

#         chunks.append({
#             "text": normalize(text),
#             "metadata": {
#                 "type": "transaction",
#                 "doc_id": str(tx.get("_id", "")),
#                 "category": tx.get("category", ""),
#                 "tx_type": tx.get("type", ""),
#             }
#         })

#     # =====================================================================
#     #  🔹 BUDGETS
#     # =====================================================================
#     for b in user_data.get("budgets", []):
#         text = f"""
#         MONTHLY BUDGET RECORD
#         - Budget ID: {b.get('_id', '')}
#         - Month: {b.get('month', 'unknown')}
#         - Category: {b.get('category', 'unknown')}
#         - Budget Amount: {b.get('budgetAmount', 0)}
#         - Notes: {b.get('notes', 'None')}

#         Meaning:
#         User allocated a budget of {b.get('budgetAmount')} for category 
#         '{b.get('category')}' in {b.get('month')}.
#         """

#         chunks.append({
#             "text": normalize(text),
#             "metadata": {
#                 "type": "budget",
#                 "doc_id": str(b.get("_id", "")),
#                 "category": b.get("category", ""),
#                 "month": b.get("month", "")
#             }
#         })

#     # =====================================================================
#     #  🔹 BALANCE SHEETS
#     # =====================================================================
#     for bs in user_data.get("balance_sheets", []):
#         bs_date = to_readable_date(bs.get("date"))

#         text = f"""
#         BALANCE SHEET SNAPSHOT
#         - Balance Sheet ID: {bs.get('_id', '')}
#         - Date: {bs_date}
#         - Current Assets: {bs.get('currentAssets', 0)}
#         - Current Liabilities: {bs.get('currentLiabilities', 0)}
#         - Total Liabilities: {bs.get('totalLiabilities', 0)}
#         - Total Equity: {bs.get('totalEquity', 0)}
#         - Notes: {bs.get('notes', 'None')}

#         Meaning:
#         On {bs_date}, the user's financial snapshot shows total liabilities 
#         of {bs.get('totalLiabilities')} and equity of {bs.get('totalEquity')}.
#         """

#         chunks.append({
#             "text": normalize(text),
#             "metadata": {
#                 "type": "balance_sheet",
#                 "doc_id": str(bs.get("_id", "")),
#                 "date": bs.get("date", "")
#             }
#         })

#     return chunks





































# # from typing import Dict, List, Any
# # from datetime import datetime

# # def to_date(d):
# #     try:
# #         return datetime.strptime(d, "%Y-%m-%d").strftime("%d %B %Y")
# #     except:
# #         return d or "unknown date"

# # def normalize(text):
# #     return text.replace("\n", " ").strip()


# # def build_chunks(user_data: Dict[str, List[Any]]) -> List[Dict[str, Any]]:
# #     """
# #     Converts user data (transactions, budgets, balance sheets) into text chunks.
# #     """
# #     chunks = []
# #     for t in user_data.get("transactions", []):
# #         date = to_date(t.get("date"))
# #         amount = t.get("amount", 0)
# #         category = t.get("category", "unknown")
# #         desc = t.get("description", "")

# #         text = f"""
# #         FINANCIAL TRANSACTION RECORD
# #         - Date: {date}
# #         - Amount Spent: {amount}
# #         - Category: {category}
# #         - Description: {desc if desc else "No description provided"}

# #         Summary Statement:
# #         The user spent {amount} on {category} on {date}.
# #         """.strip()

# #         chunks.append({
# #             "text": normalize(text),
# #             "metadata": {
# #                 "type": "transaction",
# #                 "doc_id": str(t.get("_id", "")),
# #             }
# #         })

# #     # -------------------------
# #     # 🔹 PROCESS BUDGETS
# #     # -------------------------
# #     for b in user_data.get("budgets", []):
# #         month = b.get("month", "unknown")
# #         category = b.get("category", "unknown")
# #         amount = b.get("amount", 0)

# #         text = f"""
# #         USER BUDGET SETTING
# #         - Month: {month}
# #         - Category: {category}
# #         - Budget Amount: {amount}

# #         Summary Statement:
# #         For {month}, the user set a budget of {amount} for the category {category}.
# #         """.strip()

# #         chunks.append({
# #             "text": normalize(text),
# #             "metadata": {
# #                 "type": "budget",
# #                 "doc_id": str(b.get("_id", "")),
# #             }
# #         })

# #     # -------------------------
# #     # 🔹 PROCESS BALANCE SHEETS
# #     # -------------------------
# #     for bs in user_data.get("balance_sheets", []):
# #         date = to_date(bs.get("date"))
# #         assets = bs.get("assets", 0)
# #         liabilities = bs.get("liabilities", 0)
# #         equity = assets - liabilities  # Extra helpful signal

# #         text = f"""
# #         BALANCE SHEET SNAPSHOT
# #         - Date: {date}
# #         - Assets: {assets}
# #         - Liabilities: {liabilities}
# #         - Equity (Auto Calculated): {equity}

# #         Summary Statement:
# #         On {date}, assets were {assets}, liabilities were {liabilities}, resulting in equity of {equity}.
# #         """.strip()

# #         chunks.append({
# #             "text": normalize(text),
# #             "metadata": {
# #                 "type": "balance_sheet",
# #                 "doc_id": str(bs.get("_id", "")),
# #             }
# #         })

# #     return chunks