import type { ScopeArtifacts, ScopeSourceData } from "@/server/services/scope/scope.types";
import { buildScopeArtifacts } from "@/server/services/scope";

/**
 * drawio P1.5
 * 作用：
 * - 在正式公式层之前，先构建 4 张 scope/status 表对应的数据工件
 * - 这一步不属于原始输入，也不属于最终公式输出，因此单独放在 p1_5
 */
export function buildP1_5ScopeStatusArtifacts(source: ScopeSourceData): ScopeArtifacts {
  return buildScopeArtifacts(source);
}
