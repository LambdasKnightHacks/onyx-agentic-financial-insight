export const CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Groceries",
  "Personal Care",
  "Subscriptions",
  "Income",
  "Transfer",
  "Other"
] as const

export const PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" }
] as const

export type Category = typeof CATEGORIES[number]
export type Period = typeof PERIODS[number]['value']

