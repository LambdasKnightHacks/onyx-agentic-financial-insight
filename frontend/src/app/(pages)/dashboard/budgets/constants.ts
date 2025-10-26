export const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Personal Care",
  "Education",
  "Gifts & Donations",
  "Business",
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

