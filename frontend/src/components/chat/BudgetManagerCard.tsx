"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Calendar } from "lucide-react";

interface BudgetManagerCardProps {
  userId: string;
  existingBudgets?: Array<{
    category: string;
    amount: number;
    period: string;
  }>;
  mode?: "create" | "edit";
  onSubmit?: (data: BudgetFormData) => void;
}

export interface BudgetFormData {
  category: string;
  amount: number;
  period: "month" | "week";
  subcategory?: string;
  label?: string;
}

const CATEGORIES = [
  { value: "food", label: "Food & Dining", icon: "🍽️" },
  { value: "transportation", label: "Transportation", icon: "🚗" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "living", label: "Living (Rent, Utils)", icon: "🏠" },
  { value: "healthcare", label: "Healthcare", icon: "🏥" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "travel", label: "Travel", icon: "✈️" },
  { value: "financial", label: "Financial", icon: "💳" },
];

const SUBCATEGORIES: Record<string, Array<{ value: string; label: string }>> = {
  food: [
    { value: "dining", label: "Dining Out" },
    { value: "groceries", label: "Groceries" },
    { value: "coffee_tea", label: "Coffee & Tea" },
  ],
  transportation: [
    { value: "gas", label: "Gas" },
    { value: "public_transit", label: "Public Transit" },
    { value: "car_maintenance", label: "Car Maintenance" },
  ],
  shopping: [
    { value: "clothing", label: "Clothing" },
    { value: "electronics", label: "Electronics" },
    { value: "household", label: "Household" },
  ],
  entertainment: [
    { value: "streaming", label: "Streaming" },
    { value: "movies", label: "Movies" },
    { value: "events", label: "Events" },
  ],
  living: [
    { value: "rent", label: "Rent" },
    { value: "mortgage", label: "Mortgage" },
    { value: "electricity", label: "Electricity" },
    { value: "internet", label: "Internet" },
  ],
};

export function BudgetManagerCard({
  userId,
  existingBudgets = [],
  mode = "create",
  onSubmit,
}: BudgetManagerCardProps) {
  const [category, setCategory] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [period, setPeriod] = useState<"month" | "week">("month");
  const [label, setLabel] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const availableSubcategories = category ? SUBCATEGORIES[category] || [] : [];

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!category) {
      setError("Please select a category");
      return;
    }

    const budgetAmount = parseFloat(amount);
    if (!amount || isNaN(budgetAmount) || budgetAmount <= 0) {
      setError("Please enter a valid budget amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: BudgetFormData = {
        category,
        amount: budgetAmount,
        period,
        subcategory: subcategory || undefined,
        label: label || undefined,
      };

      if (onSubmit) {
        await onSubmit(formData);
      }

      // Reset form on success
      setCategory("");
      setSubcategory("");
      setAmount("");
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {mode === "create" ? "Create Budget" : "Edit Budget"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Set a spending limit for a category to track your expenses"
            : "Update your budget limits"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory Selection */}
        {availableSubcategories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory (Optional)</Label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="All subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All subcategories</SelectItem>
                {availableSubcategories.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value}>
                    {sub.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Budget Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Budget Amount *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9"
              min="0"
              step="10"
            />
          </div>
        </div>

        {/* Period Selection */}
        <div className="space-y-2">
          <Label htmlFor="period">Budget Period</Label>
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as "month" | "week")}
          >
            <SelectTrigger id="period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Monthly</span>
                </span>
              </SelectItem>
              <SelectItem value="week">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Weekly</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Custom Label (Optional)</Label>
          <Input
            id="label"
            type="text"
            placeholder="e.g., 'Grocery budget'"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Existing Budgets Info */}
        {existingBudgets.length > 0 && mode === "create" && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-2">Your existing budgets:</p>
            <ul className="space-y-1">
              {existingBudgets.map((budget, idx) => (
                <li key={idx} className="text-muted-foreground">
                  • {budget.category}: ${budget.amount}/{budget.period}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !category || !amount}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Budget" : "Update Budget"}
        </Button>
      </CardFooter>
    </Card>
  );
}
