import React from "react";
import { useTenant } from "../../hooks/useTenant";

interface CurrencyFormatProps {
  amount: number;
  className?: string;
}

export function CurrencyFormat({ amount, className = "" }: CurrencyFormatProps) {
  const { tenant } = useTenant();
  const { code, locale } = tenant?.config.currency || {
    code: "USD",
    locale: "en-US",
  };

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return <span className={className}>{formatted}</span>;
}
