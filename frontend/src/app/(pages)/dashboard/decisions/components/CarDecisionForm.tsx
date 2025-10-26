"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type {
  DecisionAnalysisRequest,
  RiskTolerance,
} from "@/types/decision-types";

interface CarDecisionFormProps {
  onCancel: () => void;
}

export default function CarDecisionForm({ onCancel }: CarDecisionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [leaseMonthly, setLeaseMonthly] = useState("389");
  const [leaseDown, setLeaseDown] = useState("2000");
  const [leaseTerm, setLeaseTerm] = useState("36");
  const [leaseMileage, setLeaseMileage] = useState("12000");

  const [purchasePrice, setPurchasePrice] = useState("32000");
  const [financeDown, setFinanceDown] = useState("3000");
  const [financeAPR, setFinanceAPR] = useState("4.9");
  const [financeTerm, setFinanceTerm] = useState("60");

  const [tenureMonths, setTenureMonths] = useState("36");
  const [maxPayment, setMaxPayment] = useState("500");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("medium");
  const [emergencyFundMonths, setEmergencyFundMonths] = useState("3");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Get user ID from session/auth
      const userId =
        localStorage.getItem("userId") ||
        "bdd8ced0-6b8d-47e1-9c68-866c080994e8"; // Fallback for testing

      const requestData: DecisionAnalysisRequest = {
        user_id: userId,
        decision_type: "car_lease_vs_finance",
        decision_inputs: {
          lease_option: {
            monthly_payment: parseFloat(leaseMonthly),
            down_payment: parseFloat(leaseDown),
            lease_term_months: parseInt(leaseTerm),
            mileage_cap: parseInt(leaseMileage),
            insurance_monthly: 120,
            fuel_monthly: 80,
            maintenance_monthly: 25,
          },
          finance_option: {
            purchase_price: parseFloat(purchasePrice),
            down_payment: parseFloat(financeDown),
            apr: parseFloat(financeAPR) / 100,
            loan_term_months: parseInt(financeTerm),
            insurance_monthly: 140,
            fuel_monthly: 80,
            maintenance_monthly: 50,
          },
          tenure_months: parseInt(tenureMonths),
        },
        preferences: {
          max_acceptable_payment: parseFloat(maxPayment),
          risk_tolerance: riskTolerance,
        },
        constraints: {
          min_emergency_fund_months: parseInt(emergencyFundMonths),
        },
      };

      // Call backend API
      const response = await fetch(
        "http://localhost:8000/api/decisions/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start analysis");
      }

      const result = await response.json();

      // Redirect to live analysis page
      router.push(`/dashboard/decisions/analysis/${result.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lease Option */}
        <Card>
          <CardHeader>
            <CardTitle>Lease Option</CardTitle>
            <CardDescription>
              Enter the leasing details for comparison
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leaseMonthly">Monthly Payment ($)</Label>
              <Input
                id="leaseMonthly"
                type="number"
                value={leaseMonthly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLeaseMonthly(e.target.value)
                }
                placeholder="389"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseDown">Down Payment ($)</Label>
              <Input
                id="leaseDown"
                type="number"
                value={leaseDown}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLeaseDown(e.target.value)
                }
                placeholder="2000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseTerm">Lease Term (months)</Label>
              <Input
                id="leaseTerm"
                type="number"
                value={leaseTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLeaseTerm(e.target.value)
                }
                placeholder="36"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseMileage">Annual Mileage Cap</Label>
              <Input
                id="leaseMileage"
                type="number"
                value={leaseMileage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLeaseMileage(e.target.value)
                }
                placeholder="12000"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Finance Option */}
        <Card>
          <CardHeader>
            <CardTitle>Finance Option</CardTitle>
            <CardDescription>
              Enter the financing details for comparison
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={purchasePrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPurchasePrice(e.target.value)
                }
                placeholder="32000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financeDown">Down Payment ($)</Label>
              <Input
                id="financeDown"
                type="number"
                value={financeDown}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFinanceDown(e.target.value)
                }
                placeholder="3000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financeAPR">APR (%)</Label>
              <Input
                id="financeAPR"
                type="number"
                step="0.1"
                value={financeAPR}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFinanceAPR(e.target.value)
                }
                placeholder="4.9"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financeTerm">Loan Term (months)</Label>
              <Input
                id="financeTerm"
                type="number"
                value={financeTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFinanceTerm(e.target.value)
                }
                placeholder="60"
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferences & Constraints */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences & Constraints</CardTitle>
          <CardDescription>
            Help us personalize the analysis for you
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenureMonths">
              How long will you keep the car? (months)
            </Label>
            <Input
              id="tenureMonths"
              type="number"
              value={tenureMonths}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTenureMonths(e.target.value)
              }
              placeholder="36"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPayment">Maximum Acceptable Payment ($)</Label>
            <Input
              id="maxPayment"
              type="number"
              value={maxPayment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxPayment(e.target.value)
              }
              placeholder="500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="riskTolerance">Risk Tolerance</Label>
            <Select
              value={riskTolerance}
              onValueChange={(value: string) =>
                setRiskTolerance(value as RiskTolerance)
              }
            >
              <SelectTrigger id="riskTolerance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Conservative</SelectItem>
                <SelectItem value="medium">Medium - Balanced</SelectItem>
                <SelectItem value="high">High - Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyFund">
              Minimum Emergency Fund (months of expenses)
            </Label>
            <Input
              id="emergencyFund"
              type="number"
              value={emergencyFundMonths}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmergencyFundMonths(e.target.value)
              }
              placeholder="3"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Analysis...
            </>
          ) : (
            "Analyze Decision"
          )}
        </Button>
      </div>
    </form>
  );
}
