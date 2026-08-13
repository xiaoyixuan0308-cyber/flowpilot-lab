"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExchangeRateForm({ initialRate }: { initialRate: number }) {
  const router = useRouter();
  const [rate, setRate] = useState(String(initialRate));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings/exchange-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: Number(rate) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "汇率更新失败");
      setRate(String(payload.rate));
      setMessage("当前汇率已更新，后续 CNY 导入和新计算批次将使用该值。");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "汇率更新失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex max-w-md items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium">
          1 USD 对应 CNY
          <Input
            className="mt-1 font-mono"
            type="number"
            min="0.0000000001"
            step="0.0001"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </label>
        <Button onClick={submit} disabled={saving}>
          <Save />
          {saving ? "保存中" : "保存汇率"}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
