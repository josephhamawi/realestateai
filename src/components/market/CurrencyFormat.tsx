import React from "react";
import { useTenant } from "../../hooks/useTenant";
import { formatCurrency } from "../../lib/formatters";

interface CurrencyFormatProps {
  amount: number;
  className?: string;
}

export function CurrencyFormat({ amount, className = "" }: CurrencyFormatProps) {
  const { tenant } = useTenant();
  const currency = tenant?.config?.currency;
  const formatted = formatCurrency(amount, currency?.code, currency?.locale);

  return <span className={className}>{formatted}</span>;
}
