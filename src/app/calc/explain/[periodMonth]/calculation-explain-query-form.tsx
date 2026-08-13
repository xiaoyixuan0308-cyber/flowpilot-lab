"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Option = {
  label: string;
  value: string;
};

type OptionRow = {
  lp: string;
  pl5: string;
  upn: string;
};

interface CalculationExplainQueryFormProps {
  periodMonth: string;
  lpValue: string;
  pl5Value: string;
  upnValue: string;
  sourceValue: string;
  lpOptions: Option[];
  sourceOptions: Option[];
  optionRows: OptionRow[];
  pl5NameByCode: Record<string, string>;
}

function buildOptions(values: string[], labelByValue?: Record<string, string>) {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: labelByValue?.[value] ?? value, value }));
}

export function CalculationExplainQueryForm({
  periodMonth,
  lpValue,
  pl5Value,
  upnValue,
  sourceValue,
  lpOptions,
  sourceOptions,
  optionRows,
  pl5NameByCode,
}: CalculationExplainQueryFormProps) {
  const [lp, setLp] = useState(lpValue);
  const [pl5, setPl5] = useState(pl5Value);
  const [upn, setUpn] = useState(upnValue);

  const pl5Options = useMemo(() => {
    const rows = lp ? optionRows.filter((row) => row.lp === lp) : optionRows;
    return buildOptions(
      rows.map((row) => row.pl5),
      pl5NameByCode
    );
  }, [lp, optionRows, pl5NameByCode]);
  const effectivePl5 = pl5Options.some((option) => option.value === pl5) ? pl5 : "";

  const upnOptions = useMemo(() => {
    const rows = optionRows.filter(
      (row) => (!lp || row.lp === lp) && (!effectivePl5 || row.pl5 === effectivePl5)
    );
    return buildOptions(rows.map((row) => row.upn));
  }, [lp, effectivePl5, optionRows]);
  const effectiveUpn = upnOptions.some((option) => option.value === upn) ? upn : "";

  return (
    <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]" action={`/calc/explain/${periodMonth}`}>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">LP</span>
        <select
          name="lp"
          value={lp}
          onChange={(event) => {
            setLp(event.target.value);
            setPl5("");
            setUpn("");
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">全部LP</option>
          {lpOptions.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">产品分类</span>
        <select
          name="pl5"
          value={effectivePl5}
          onChange={(event) => {
            setPl5(event.target.value);
            setUpn("");
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">全部产品分类</option>
          {pl5Options.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">SKU</span>
        <select
          name="upn"
          value={effectiveUpn}
          onChange={(event) => setUpn(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">全部SKU</option>
          {upnOptions.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">基础来源</span>
        <select
          name="source"
          defaultValue={sourceValue}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {sourceOptions.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit">
          <Search />
          查询
        </Button>
      </div>
    </form>
  );
}
