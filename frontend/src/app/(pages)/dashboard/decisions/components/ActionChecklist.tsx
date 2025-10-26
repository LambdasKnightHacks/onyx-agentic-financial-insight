"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ActionItem {
  id: string;
  action: string;
  priority: "high" | "medium" | "low";
  category: string;
  estimated_time?: string;
  why_important?: string;
}

interface ActionChecklistProps {
  actions: ActionItem[];
}

export default function ActionChecklist({ actions }: ActionChecklistProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    new Set()
  );

  const toggleAction = (actionId: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(actionId)) {
      newCompleted.delete(actionId);
    } else {
      newCompleted.add(actionId);
    }
    setCompletedActions(newCompleted);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-900/30 text-red-400 border-red-700";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
      case "low":
        return "bg-blue-900/30 text-blue-400 border-blue-700";
      default:
        return "bg-gray-800 text-gray-400 border-gray-700";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />;
      case "medium":
        return <Clock className="h-3 w-3" />;
      case "low":
        return <Circle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  // Group actions by priority
  const highPriority = actions.filter((a) => a.priority === "high");
  const mediumPriority = actions.filter((a) => a.priority === "medium");
  const lowPriority = actions.filter((a) => a.priority === "low");

  const completionPercentage =
    actions.length > 0 ? (completedActions.size / actions.length) * 100 : 0;

  const renderActionItem = (action: ActionItem) => {
    const isCompleted = completedActions.has(action.id);

    return (
      <div
        key={action.id}
        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
          isCompleted
            ? "bg-muted/50 opacity-60"
            : "bg-gray-800/50 hover:bg-gray-700/50"
        }`}
      >
        <Checkbox
          id={action.id}
          checked={isCompleted}
          onCheckedChange={() => toggleAction(action.id)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <label
              htmlFor={action.id}
              className={`text-sm font-medium cursor-pointer break-words whitespace-normal flex-1 ${
                isCompleted ? "line-through text-gray-600" : "text-gray-100"
              }`}
            >
              {action.action}
            </label>
            <Badge
              className={`${getPriorityColor(
                action.priority
              )} text-xs shrink-0`}
              variant="outline"
            >
              {getPriorityIcon(action.priority)}
              <span className="ml-1">{action.priority.toUpperCase()}</span>
            </Badge>
          </div>

          {(action.category || action.estimated_time) && (
            <div className="flex items-center gap-3 mt-1">
              {action.category && (
                <span className="text-xs text-gray-500">{action.category}</span>
              )}
              {action.estimated_time && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {action.estimated_time}
                </span>
              )}
            </div>
          )}

          {action.why_important && !isCompleted && (
            <p className="text-xs text-gray-500 mt-2 italic break-words whitespace-normal">
              💡 {action.why_important}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Action Checklist
            </CardTitle>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-100">
                {completedActions.size} / {actions.length}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(completionPercentage)}% complete
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* High Priority */}
        {highPriority.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              Do These First ({highPriority.length})
            </h4>
            <div className="space-y-2">
              {highPriority.map(renderActionItem)}
            </div>
          </div>
        )}

        {/* Medium Priority */}
        {mediumPriority.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-400">
              <Clock className="h-4 w-4" />
              Important ({mediumPriority.length})
            </h4>
            <div className="space-y-2">
              {mediumPriority.map(renderActionItem)}
            </div>
          </div>
        )}

        {/* Low Priority */}
        {lowPriority.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-400">
              <Circle className="h-4 w-4" />
              Nice to Have ({lowPriority.length})
            </h4>
            <div className="space-y-2">{lowPriority.map(renderActionItem)}</div>
          </div>
        )}

        {/* Completion Message */}
        {completedActions.size === actions.length && actions.length > 0 && (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-400">
              All actions completed!
            </p>
            <p className="text-sm text-green-500 mt-1">
              You're ready to move forward with your decision.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
