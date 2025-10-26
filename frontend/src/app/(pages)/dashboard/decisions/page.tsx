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
import { Badge } from "@/components/ui/badge";
import { Car, Home, Plane, TrendingUp, Shield, Calculator } from "lucide-react";
import CarDecisionForm from "./components/CarDecisionForm";

type DecisionType =
  | "car_lease_vs_finance"
  | "home_buy_vs_rent"
  | "travel_booking"
  | null;

export default function DecisionsPage() {
  const router = useRouter();
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>(null);

  const decisionTypes = [
    {
      id: "car_lease_vs_finance" as const,
      title: "Car: Lease vs Finance",
      description:
        "Compare leasing and financing options for your next vehicle",
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      available: true,
    },
    {
      id: "home_buy_vs_rent" as const,
      title: "Home: Buy vs Rent",
      description: "Analyze the financial impact of buying versus renting",
      icon: Home,
      color: "text-green-600",
      bgColor: "bg-green-100",
      available: false,
    },
    {
      id: "travel_booking" as const,
      title: "Travel Booking",
      description: "Determine the optimal time to book your trip",
      icon: Plane,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      available: false,
    },
  ];

  if (selectedDecision === "car_lease_vs_finance") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Car Decision Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Compare leasing vs financing options with AI-powered insights
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedDecision(null)}>
            ← Back to Decisions
          </Button>
        </div>

        <CarDecisionForm onCancel={() => setSelectedDecision(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Financial Decision Analysis
        </h1>
        <p className="text-muted-foreground mt-2">
          Make confident financial decisions with AI-powered analysis
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Total Cost Analysis</p>
                <p className="text-sm text-muted-foreground">
                  Complete TCO breakdown
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Risk Assessment</p>
                <p className="text-sm text-muted-foreground">
                  Stress tests & scenarios
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Budget Impact</p>
                <p className="text-sm text-muted-foreground">
                  Personalized recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Type Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Select Decision Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decisionTypes.map((decision) => {
            const Icon = decision.icon;
            return (
              <Card
                key={decision.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  !decision.available ? "opacity-60" : ""
                }`}
                onClick={() =>
                  decision.available && setSelectedDecision(decision.id)
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${decision.bgColor}`}>
                      <Icon className={`w-6 h-6 ${decision.color}`} />
                    </div>
                    {!decision.available && (
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4">{decision.title}</CardTitle>
                  <CardDescription>{decision.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {decision.available ? (
                    <Button className="w-full" variant="outline">
                      Get Started →
                    </Button>
                  ) : (
                    <Button className="w-full" variant="ghost" disabled>
                      Not Available Yet
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                1
              </span>
              <div>
                <p className="font-medium">Select Your Decision</p>
                <p className="text-sm text-muted-foreground">
                  Choose the type of financial decision you need help with
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                2
              </span>
              <div>
                <p className="font-medium">Provide Details</p>
                <p className="text-sm text-muted-foreground">
                  Enter your options and preferences - we'll analyze your
                  financial data automatically
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                3
              </span>
              <div>
                <p className="font-medium">Get AI-Powered Insights</p>
                <p className="text-sm text-muted-foreground">
                  Our 7-agent system analyzes TCO, risk, credit impact, and
                  provides personalized recommendations
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
