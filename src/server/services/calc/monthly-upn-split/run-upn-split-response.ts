import type { ScopeArtifacts } from "@/server/services/scope/scope.types";
import type { UpnSplitResult } from "./upn-split.types";

export function buildRunUpnSplitResponse(
  periodMonth: string,
  scopeArtifacts: ScopeArtifacts,
  results: UpnSplitResult[]
) {
  return {
    success: true,
    periodMonth,
    totalUpns: results.length,
    errorUpns: results.filter((row) => row.isError).length,
    scopeCounts: {
      lpPl5Scope: scopeArtifacts.lpPl5ScopeRows.length,
      lpPl5Status: scopeArtifacts.lpPl5StatusRows.length,
      pl5UpnScope: scopeArtifacts.pl5UpnScopeRows.length,
      lpPl5UpnStatus: scopeArtifacts.lpPl5UpnStatusRows.length,
    },
    results,
  };
}
