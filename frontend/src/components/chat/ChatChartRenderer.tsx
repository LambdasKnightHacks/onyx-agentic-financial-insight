"use client";

import { ChartData } from "@/src/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  Area,
  Bar,
  Line,
  Pie,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ResponsiveSankey } from "@nivo/sankey";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Slider } from "@/src/components/ui/slider";
import { BudgetManagerCard, BudgetFormData } from "./BudgetManagerCard";
import { sendChatMessage } from "@/src/lib/chat-api";
import { useAuth } from "@/src/components/auth-context";

interface ChatChartRendererProps {
  chartData: ChartData;
  sessionId?: string;
}

export function ChatChartRenderer({
  chartData,
  sessionId,
}: ChatChartRendererProps) {
  const { user } = useAuth();
  // State for interactive budget chart
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState<number[]>([1000]);

  // Initialize budget amount from metadata if available
  useEffect(() => {
    if (
      chartData.metadata?.default_budget &&
      chartData.chart_type === "budget_interactive"
    ) {
      setBudgetAmount([chartData.metadata.default_budget]);
    }
  }, [chartData]);

  const renderChart = () => {
    const { chart_type, data, config } = chartData;

    // Debug log for Sankey data
    if (chart_type === "sankey") {
      console.log(
        "[Sankey Debug] Chart data:",
        JSON.stringify(chartData, null, 2)
      );
    }

    function getChartComponent() {
      switch (chart_type) {
        case "budget_manager":
          // Interactive budget creation/edit component
          const existingBudgets = (data as any)?.existing_budgets || [];
          const mode = (data as any)?.mode || "create";

          const handleBudgetSubmit = async (formData: BudgetFormData) => {
            if (!user) return;

            // Send the budget data back to the chat agent
            const action =
              mode === "create" ? "create_budget" : "update_budget";
            const message =
              mode === "create"
                ? `Create a ${formData.period}ly budget for ${formData.category} with a cap of $${formData.amount}`
                : `Update the ${formData.category} budget to $${formData.amount}`;

            try {
              await sendChatMessage(user.id, message, sessionId);
            } catch (error) {
              console.error("Failed to submit budget:", error);
              throw error;
            }
          };

          return (
            <BudgetManagerCard
              userId={user?.id || ""}
              existingBudgets={existingBudgets}
              mode={mode}
              onSubmit={handleBudgetSubmit}
            />
          );

        case "budget_interactive":
          // Interactive budget chart with category selector and slider
          const categories = (data as any)?.categories || [];
          const budgetData = (data as any)?.budget_data || [];

          // Filter data based on selected category
          const filteredData = selectedCategory
            ? budgetData.filter(
                (item: any) => item.category === selectedCategory
              )
            : budgetData;

          return (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg border">
                {/* Category Selector */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Category
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((cat: string) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Budget Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Budget Amount</label>
                    <span className="text-sm text-muted-foreground">
                      ${budgetAmount[0]}
                    </span>
                  </div>
                  <Slider
                    value={budgetAmount}
                    onValueChange={setBudgetAmount}
                    min={100}
                    max={5000}
                    step={50}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Chart */}
              {filteredData.length > 0 && (
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={config.xAxis?.dataKey || "day"} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#8884d8"
                    name="Actual Spending"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="budget_line"
                    stroke="#82ca9d"
                    name="Budget Line"
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey={`projected_${budgetAmount[0]}`}
                    stroke="#ffc658"
                    name={`Projected ($${budgetAmount[0]})`}
                    strokeDasharray="3 3"
                  />
                </LineChart>
              )}
            </div>
          );

        case "area":
          return (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis?.dataKey || "name"} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.series?.map((series: any, idx: number) => (
                <Area
                  key={idx}
                  type="monotone"
                  dataKey={series.dataKey}
                  stroke={series.color}
                  fill={series.color}
                  name={series.name}
                />
              ))}
            </AreaChart>
          );

        case "bar":
        case "waterfall":
          return (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis?.dataKey || "name"} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.series?.map((series: any, idx: number) => (
                <Bar
                  key={idx}
                  dataKey={series.dataKey}
                  fill={series.color}
                  name={series.name}
                />
              ))}
            </BarChart>
          );

        case "line":
          return (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis?.dataKey || "name"} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.series?.map((series: any, idx: number) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={series.dataKey}
                  stroke={series.color}
                  name={series.name}
                />
              ))}
            </LineChart>
          );

        case "pie":
        case "donut":
          return (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || `hsl(${index * 45}, 70%, 50%)`}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          );

        case "scatter":
          return (
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey={config.xAxis?.dataKey || "x"}
                name={config.xAxis?.name || "Average Transaction"}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis
                type="number"
                dataKey={config.yAxis?.dataKey || "y"}
                name={config.yAxis?.name || "Std Deviation"}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter
                name={config.metadata?.title || "Scatter"}
                fill="#8884d8"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#8884d8"} />
                ))}
              </Scatter>
            </ScatterChart>
          );

        case "composed":
          return (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis?.dataKey || "name"} />
              {config.yAxis &&
                Array.isArray(config.yAxis) &&
                config.yAxis.map((yAxis: any, idx: number) => (
                  <YAxis
                    key={idx}
                    yAxisId={yAxis.yAxisId || (idx === 0 ? "left" : "right")}
                    orientation={
                      yAxis.orientation || (idx === 0 ? "left" : "right")
                    }
                    domain={yAxis.domain}
                  />
                ))}
              <Tooltip />
              <Legend />
              {config.bars?.map((bar: any, idx: number) => (
                <Bar
                  key={idx}
                  dataKey={bar.dataKey}
                  fill={bar.fill || bar.color}
                  name={bar.name}
                  yAxisId={bar.yAxisId || "left"}
                />
              ))}
              {config.lines?.map((line: any, idx: number) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke || line.color}
                  name={line.name}
                  yAxisId={line.yAxisId || "right"}
                  strokeWidth={line.strokeWidth || 2}
                />
              ))}
            </BarChart>
          );

        case "heatmap":
          return (
            <div className="text-sm">
              {chartData.metadata?.description && (
                <p className="text-muted-foreground mb-4">
                  {chartData.metadata.description}
                </p>
              )}
              <BarChart data={data.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={chartData.config?.xAxis || "x"}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey={chartData.config?.value || "amount"}
                  fill="#8884d8"
                />
              </BarChart>
            </div>
          );

        case "multi":
          const tableData = (data as any)?.table_data || [];
          const trendData = (data as any)?.trend_data || [];

          // Don't render if no data
          if (!tableData.length && !trendData.length) {
            return (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                No data available for this chart.
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {tableData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Merchant</th>
                        <th className="text-right p-2">Amount</th>
                        <th className="text-right p-2">Frequency</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.slice(0, 5).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{row.merchant || row.name}</td>
                          <td className="text-right p-2">
                            ${row.amount?.toFixed(2)}
                          </td>
                          <td className="text-right p-2">{row.frequency}/mo</td>
                          <td className="text-right p-2">
                            ${row.total_paid?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {trendData.length > 0 && (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={config.xAxis?.dataKey || "month"} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {config.bars?.map((bar: any, idx: number) => (
                    <Bar
                      key={idx}
                      dataKey={bar.dataKey || "total"}
                      fill={bar.fill || "#8884d8"}
                    />
                  ))}
                </BarChart>
              )}
            </div>
          );

        case "sankey":
          // Validate and extract Sankey data
          const nodes = (data as any)?.nodes || [];
          const links = (data as any)?.links || [];

          // Sankey requires at least some nodes and links
          if (nodes.length === 0 || links.length === 0) {
            return (
              <div className="text-muted-foreground p-4">
                No data available for Sankey diagram
              </div>
            );
          }

          // Transform data for Nivo Sankey format
          const sankeyData = {
            nodes: nodes.map((node: any) => ({
              id: node.id || node.name,
              nodeColor: node.color || "hsl(var(--primary))",
            })),
            links: links.map((link: any) => ({
              source: link.source,
              target: link.target,
              value: link.value,
            })),
          };

          // Beautiful interactive Sankey diagram using Nivo with constrained height
          return (
            <div className="w-full overflow-hidden" style={{ height: 400 }}>
              <ResponsiveSankey
                data={sankeyData}
                margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                align="justify"
                colors={{ scheme: "category10" }}
                nodeOpacity={1}
                nodeHoverOpacity={1}
                nodeThickness={16}
                nodeSpacing={18}
                nodeBorderWidth={0}
                nodeBorderColor={{
                  from: "color",
                  modifiers: [["darker", 0.8]],
                }}
                nodeBorderRadius={2}
                linkOpacity={0.5}
                linkHoverOpacity={0.8}
                linkHoverOthersOpacity={0.1}
                linkContract={3}
                enableLinkGradient={true}
                labelPosition="outside"
                labelOrientation="horizontal"
                labelPadding={8}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1]],
                }}
                animate={true}
                motionConfig="gentle"
              />
            </div>
          );

        default:
          return (
            <div className="text-muted-foreground">
              Unsupported chart type: {chart_type}
            </div>
          );
      }
    }

    // Budget manager and some special charts don't need ResponsiveContainer
    if (chart_type === "budget_manager") {
      return getChartComponent();
    }

    // Common chart container for regular charts
    return (
      <ResponsiveContainer width="100%" height={300}>
        {getChartComponent()}
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="max-w-2xl">
      {chartData.metadata?.title && (
        <CardHeader>
          <CardTitle className="text-base">
            {chartData.metadata.title}
          </CardTitle>
          {chartData.metadata.description && (
            <CardDescription>{chartData.metadata.description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        {renderChart()}
        {chartData.metadata?.insights &&
          chartData.metadata.insights.length > 0 && (
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              {chartData.metadata.insights.map(
                (insight: string, idx: number) => (
                  <div key={idx}>• {insight}</div>
                )
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
