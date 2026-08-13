import {
  CalculationInput,
  UpnSplitResult,
  UpnSplitTraceRow,
} from "./upn-split.types";
import { buildP1BaseFieldArtifacts } from "./p1/base-field-loaders";
import { buildDealerUpnMidState } from "./p3/build-dealer-upn-mid-state";
import { applyQStarToDealerUpns } from "./p8/apply-qstar-to-dealer-upns";
import { buildDealerResultArtifacts } from "./p10/build-dealer-result-rows";
import type { DealerBaseContext, DealerMidContext } from "./p3/dealer-calc-context";

export function calculateUpnSplit(input: CalculationInput): UpnSplitResult[] {
  return calculateUpnSplitArtifacts(input).results;
}

export function calculateUpnSplitArtifacts(input: CalculationInput): {
  results: UpnSplitResult[];
  traces: UpnSplitTraceRow[];
} {
  const p1 = buildP1BaseFieldArtifacts(input);
  const {
    dealerPl5TMap,
    dealerPl5UMap,
    dealerPl5VMap,
    dealerPl5Upn6mSum,
    dealerPl56mSum,
    dealerPl5UpnHMap,
    wMap,
    invByDealerUpn,
    diohByDealerUpn,
    activeUpnByDealerPl5Upn,
    dealerGroups,
  } = p1;
  const results: UpnSplitResult[] = [];
  const traces: UpnSplitTraceRow[] = [];

  for (const [dealerGroupKey, upns] of dealerGroups) {
    const [scBu, dealerCode] = dealerGroupKey.split("|");
    const dealerBaseContext: DealerBaseContext = {
      scBu,
      dealerCode,
      activeRowKeys: upns,
      invByDealerUpn,
      diohByDealerUpn,
      activeUpnByDealerPl5Upn,
      dealerPl5UpnHMap,
      dealerPl5Upn6mSum,
      dealerPl56mSum,
      dealerPl5TMap,
      dealerPl5UMap,
      dealerPl5VMap,
    };
    const upnMid = buildDealerUpnMidState(dealerBaseContext);

    const dealerMidContext: DealerMidContext = {
      scBu,
      dealerCode,
      upnMid,
      wMap,
    };
    const dealerQContext = applyQStarToDealerUpns(dealerMidContext);

    const dealerArtifacts = buildDealerResultArtifacts(dealerQContext);
    results.push(...dealerArtifacts.results);
    traces.push(...dealerArtifacts.traces);
  }

  return {
    results,
    traces,
  };
}
