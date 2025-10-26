"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, DollarSign } from "lucide-react";

interface TCOOption {
  name: string;
  option_type: string;
  tco_expected: number;
  monthly_equivalent: number;
  tco_breakdown?: {
    down_payment?: number;
    monthly_payments?: number;
    fees?: number;
    insurance?: number;
    fuel?: number;
    maintenance?: number;
    registration?: number;
    depreciation?: number;
    residual_value?: number;
  };
  pros?: string[];
  cons?: string[];
}

interface TCOComparisonChartProps {
  options: TCOOption[];
}

export default function TCOComparisonChart({
  options,
}: TCOComparisonChartProps) {
  if (!options || options.length === 0) {
    return null;
  }

  // Find the cheapest option for comparison
  const sortedOptions = [...options].sort(
    (a, b) => a.tco_expected - b.tco_expected
  );
  const cheapestOption = sortedOptions[0];
  const maxTCO = Math.max(...options.map((o) => o.tco_expected));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBreakdownItems = (breakdown: TCOOption["tco_breakdown"]) => {
    if (!breakdown) return [];

    const items = [
      {
        label: "Down Payment",
        value: breakdown.down_payment,
        color: "bg-blue-500",
      },
      {
        label: "Monthly Payments",
        value: breakdown.monthly_payments,
        color: "bg-purple-500",
      },
      { label: "Fees", value: breakdown.fees, color: "bg-orange-500" },
      { label: "Insurance", value: breakdown.insurance, color: "bg-pink-500" },
      { label: "Fuel", value: breakdown.fuel, color: "bg-green-500" },
      {
        label: "Maintenance",
        value: breakdown.maintenance,
        color: "bg-yellow-500",
      },
      {
        label: "Registration",
        value: breakdown.registration,
        color: "bg-indigo-500",
      },
      {
        label: "Depreciation",
        value: breakdown.depreciation,
        color: "bg-red-500",
      },
      {
        label: "Residual Value",
        value: breakdown.residual_value ? -breakdown.residual_value : undefined,
        color: "bg-emerald-500",
      },
    ];

    return items.filter((item) => item.value !== undefined && item.value !== 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Total Cost Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {options.map((option) => {
          const percentageOfMax = (option.tco_expected / maxTCO) * 100;
          const savingsVsCheapest =
            option.tco_expected - cheapestOption.tco_expected;
          const isCheapest = option.name === cheapestOption.name;

          return (
            <div key={option.name} className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h4 className="font-semibold truncate">{option.name}</h4>
                  {isCheapest && (
                    <Badge variant="default" className="text-xs shrink-0">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Best Value
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatCurrency(option.tco_expected)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(option.monthly_equivalent)}/month
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full flex items-center px-3 text-sm font-medium transition-all ${
                      isCheapest
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    }`}
                    style={{ width: `${percentageOfMax}%` }}
                  >
                    {percentageOfMax > 20 && (
                      <span>{Math.round(percentageOfMax)}%</span>
                    )}
                  </div>
                </div>
                {!isCheapest && savingsVsCheapest > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    {formatCurrency(savingsVsCheapest)} more than{" "}
                    {cheapestOption.name}
                  </div>
                )}
              </div>

              {/* Cost Breakdown */}
              {option.tco_breakdown && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {getBreakdownItems(option.tco_breakdown).map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${item.color}`}
                      ></div>
                      <span className="text-muted-foreground">
                        {item.label}:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(Math.abs(item.value!))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pros & Cons */}
              {(option.pros || option.cons) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {option.pros && option.pros.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        Pros:
                      </p>
                      <ul className="space-y-1">
                        {option.pros.map((pro, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-muted-foreground flex items-start gap-1"
                          >
                            <span className="text-green-600 shrink-0 mt-0.5">
                              ✓
                            </span>
                            <span className="break-words whitespace-normal">
                              {pro}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {option.cons && option.cons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-1">
                        Cons:
                      </p>
                      <ul className="space-y-1">
                        {option.cons.map((con, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-muted-foreground flex items-start gap-1"
                          >
                            <span className="text-red-600 shrink-0 mt-0.5">
                              ✗
                            </span>
                            <span className="break-words whitespace-normal">
                              {con}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              {option !== options[options.length - 1] && (
                <div className="border-t border-muted pt-1"></div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
