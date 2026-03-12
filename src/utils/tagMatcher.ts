import { IAppProvider } from "@src/packages/app-env/AppProvider";
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
 * High-performance metadata-only matching for synchronous execution
 */
export function syncTrafficMatch(
  traffic: { uri: string; method: string },
  rule: { method: ToolMethod | "ALL"; matchingRule: string; scope?: 'metadata' | 'body' }
): boolean {
  // Synchronous match strictly forbids body scope
  if (rule.scope === 'body') return false;

  // 1. Method Match
  if (rule.method !== "ALL" && rule.method.toUpperCase() !== traffic.method.toUpperCase()) {
    return false;
  }

  // 2. Pattern Match
  const patterns = rule.matchingRule.split(',').map(p => p.trim()).filter(Boolean);
  if (patterns.length === 0) return false;

  return patterns.some(pattern => matchPattern(traffic.uri, pattern));
}

/**
 * Deep-inspection matching for asynchronous execution
 * Processes both metadata and (optionally) payload details
 */
export async function asyncTrafficMatch(
  traffic: { id: string; uri: string; method: string },
  rule: { method: ToolMethod | "ALL"; matchingRule: string; scope?: 'metadata' | 'body' },
  provider: IAppProvider
): Promise<boolean> {
  // 1. Basic Metadata Check (Always required first)
  const isMetadataMatch = syncTrafficMatch(traffic, { ...rule, scope: 'metadata' });
  
  // If metadata doesn't match and it's a simple rule, we're done
  if (!isMetadataMatch && rule.scope === 'metadata') return false;
  
  // 2. Deep Matching (Scoped to Body)
  if (rule.scope === 'body') {
    // If it's a body rule, we still check method/URL pattern first (if provided)
    // and then we fetch payload details.
    try {
      // For now, if metadata doesn't match we don't even pull the body
      if (!isMetadataMatch) return false;

      const [req, res] = await Promise.all([
        provider.getRequestPairData(traffic.id).catch(() => null),
        provider.getResponsePairData(traffic.id).catch(() => null)
      ]);

      const bodyContent = `${req?.body || ""} ${res?.body || ""}`;
      
      // The matchingRule for scope='body' might be a plain string search or regex
      // If the user used glob pattern format, we try to match it against combined bodies
      const bodyPatterns = rule.matchingRule.split(',').map(p => p.trim()).filter(Boolean);
      return bodyPatterns.some(pattern => {
        // Simple case-insensitive inclusion for body tagging
        return bodyContent.toLowerCase().includes(pattern.toLowerCase());
      });
    } catch (e) {
      console.error("Async tagging payload fetch failed", e);
      return false;
    }
  }

  return isMetadataMatch;
}
