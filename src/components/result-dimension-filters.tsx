"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ResultDimensionOption {
  value: string;
  label: string;
}

export interface ResultDimensionValues {
  bu: string;
  lp: string;
  pl5: string;
  upn: string;
}

interface DimensionComboboxProps {
  label: string;
  value: string;
  options: ResultDimensionOption[];
  onChange: (value: string) => void;
}

function DimensionCombobox({ label, value, options, onChange }: DimensionComboboxProps) {
  const selected = value
    ? options.find((option) => option.value === value) ?? { value, label: value }
    : null;

  return (
    <Combobox.Root<ResultDimensionOption>
      items={options}
      value={selected}
      onValueChange={(option) => onChange(option?.value ?? "")}
      isItemEqualToValue={(item, selectedItem) => item.value === selectedItem.value}
    >
      <div className="flex min-w-44 flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Combobox.InputGroup className="relative h-9 min-w-44 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50">
          <Combobox.Input
            aria-label={`${label}查询`}
            placeholder={`查找${label}`}
            className="h-full w-full bg-transparent px-3 pr-16 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            {value && (
              <Combobox.Clear
                aria-label={`清除${label}`}
                className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Combobox.Clear>
            )}
            <Combobox.Trigger
              aria-label={`展开${label}候选`}
              className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="size-4" />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50 max-w-[calc(100vw-1rem)] outline-none">
          <Combobox.Popup className="w-max min-w-[var(--anchor-width)] max-w-[calc(100vw-1rem)] rounded-md border bg-popover text-popover-foreground shadow-md transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Combobox.Empty className="px-3 py-4 text-sm text-muted-foreground">
              无匹配候选
            </Combobox.Empty>
            <Combobox.List className="max-h-72 overflow-y-auto p-1 outline-none">
              {(option: ResultDimensionOption) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  className={cn(
                    "flex min-w-full cursor-default items-start gap-2 rounded-sm px-2 py-2 text-sm outline-none",
                    "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                  )}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <Combobox.ItemIndicator>
                      <Check className="size-4" />
                    </Combobox.ItemIndicator>
                  </span>
                  <span className="min-w-0 whitespace-normal break-all leading-5">
                    {option.label}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

interface ResultDimensionFiltersProps {
  values: ResultDimensionValues;
  candidates: {
    bu: ResultDimensionOption[];
    lp: ResultDimensionOption[];
    pl5: ResultDimensionOption[];
    upn: ResultDimensionOption[];
  };
  onChange: (key: keyof ResultDimensionValues, value: string) => void;
  onClearAll: () => void;
}

export function ResultDimensionFilters({
  values,
  candidates,
  onChange,
  onClearAll,
}: ResultDimensionFiltersProps) {
  const hasSelection = Boolean(values.bu || values.lp || values.pl5 || values.upn);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <DimensionCombobox
        label="业务单元"
        value={values.bu}
        options={candidates.bu}
        onChange={(value) => onChange("bu", value)}
      />
      <DimensionCombobox
        label="渠道"
        value={values.lp}
        options={candidates.lp}
        onChange={(value) => onChange("lp", value)}
      />
      <DimensionCombobox
        label="产品分类"
        value={values.pl5}
        options={candidates.pl5}
        onChange={(value) => onChange("pl5", value)}
      />
      <DimensionCombobox
        label="SKU"
        value={values.upn}
        options={candidates.upn}
        onChange={(value) => onChange("upn", value)}
      />
      <Button type="button" variant="outline" size="sm" onClick={onClearAll} disabled={!hasSelection}>
        <X className="size-4" />
        清空全部
      </Button>
    </div>
  );
}


