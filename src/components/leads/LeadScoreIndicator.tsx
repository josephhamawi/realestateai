import React from "react";

interface LeadScoreIndicatorProps {
  score: number;
  urgency: "hot" | "warm" | "cold";
}

export function LeadScoreIndicator({ score, urgency }: LeadScoreIndicatorProps) {
  const getColor = () => {
    if (urgency === "hot") return { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500" };
    if (urgency === "warm") return { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500" };
    return { bg: "bg-gray-100", text: "text-gray-600", bar: "bg-gray-400" };
  };

  const colors = getColor();

  return (
    <div className="flex items-center gap-2">
      <div className="w-16">
        <div className="h-1.5 w-full rounded-full bg-gray-200">
          <div
            className={`h-1.5 rounded-full ${colors.bar} transition-all`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
        {score}
      </span>
    </div>
  );
}
