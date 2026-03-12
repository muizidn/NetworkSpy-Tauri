import { ToolMethod } from "@src/models/ToolMethod";

/**
 * Matches a URL against a glob pattern (supports * as wildcard)
 */
export function matchPattern(url: string, pattern: string): boolean {
  // Convert glob-like pattern (e.g. */v1/*) to Regex
  // Escape special characters except *
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexPattern = escaped.replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  
  return regex.test(url);
}

/**
 * Checks if a set of traffic properties match a tag rule
 */
export function isTrafficMatch(
  traffic: { uri: string; method: string },
  rule: { method: ToolMethod | "ALL"; matchingRule: string }
): boolean {
  // 1. Method Match
  if (rule.method !== "ALL" && rule.method.toUpperCase() !== traffic.method.toUpperCase()) {
    return false;
  }

  // 2. Pattern Match (comma separated rules)
  const patterns = rule.matchingRule.split(',').map(p => p.trim()).filter(Boolean);
  
  if (patterns.length === 0) return false;

  return patterns.some(pattern => matchPattern(traffic.uri, pattern));
}
