import React from "react";
import { MARKET_DEFAULTS, type MarketId } from "../../lib/marketConfig";

interface MarketSelectorProps {
  value: MarketId | "";
  onChange: (market: MarketId) => void;
}

export function MarketSelector({ value, onChange }: MarketSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {(Object.keys(MARKET_DEFAULTS) as MarketId[]).map((marketId) => {
        const market = MARKET_DEFAULTS[marketId];
        const isSelected = value === marketId;

        return (
          <button
            key={marketId}
            type="button"
            onClick={() => onChange(marketId)}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
              isSelected
                ? "border-brand-500 bg-brand-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <span className="text-4xl">
              {marketId === "nigeria" ? "\uD83C\uDDF3\uD83C\uDDEC" : "\uD83C\uDDE6\uD83C\uDDEA"}
            </span>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{market.displayName}</p>
              <p className="mt-1 text-sm text-gray-500">
                {market.currency.symbol} {market.currency.code}
              </p>
              <p className="text-xs text-gray-400">{market.timezone}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
