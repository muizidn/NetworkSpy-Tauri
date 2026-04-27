import { GqlMechanism, ParsedGraphQLItem, GraphQLParser } from "./types";

const enrichItem = (item: any, mechanism: GqlMechanism): ParsedGraphQLItem | null => {
  try {
    const queryStr = item.query.trim();
    let type = "QUERY";
    if (queryStr.toLowerCase().startsWith("mutation")) type = "MUTATION";
    if (queryStr.toLowerCase().startsWith("subscription")) type = "SUBSCRIPTION";

    const fragmentsCount = (queryStr.match(/fragment\s+/g) || []).length;
    const directivesCount = (queryStr.match(/@\w+/g) || []).length;
    const depth = Math.max(0, ...queryStr.split('\n').map((line: string) => (line.match(/\{/g) || []).length)) + 1;

    return {
      ...item,
      type,
      fragmentsCount,
      directivesCount,
      depth,
      mechanism
    };
  } catch (e) {
    return null;
  }
};

export const graphqlParsers: Record<string, GraphQLParser> = {
  getQueryParams: {
    match: (urlStr, bodyJson) => {
      if (!urlStr.includes("graphql")) return false;
      try {
        const url = new URL(urlStr, "https://local.capture");
        return !!(url.searchParams.get("queryId") || url.searchParams.get("id") || url.searchParams.get("query") || url.searchParams.get("extensions"));
      } catch {
        return false;
      }
    },
    parse: (urlStr, bodyJson) => {
      try {
        const url = new URL(urlStr, "https://local.capture");
        const qId = url.searchParams.get("queryId") || url.searchParams.get("id");
        const query = url.searchParams.get("query");
        const variables = url.searchParams.get("variables");

        let mechanism: GqlMechanism = qId ? "Persisted Query (queryId)" : "GET Query Params";
        if (urlStr.includes("linkedin.com")) mechanism = "LinkedIn Specialized";

        const baseItem = {
          query: query || (qId ? `Persisted Query: ${qId}` : "// No Query Body"),
          variables: variables || "{}",
          extensions: url.searchParams.get("extensions") || null,
          operationName: url.searchParams.get("operationName") || qId || "GET Operation",
          isPersisted: !!qId
        };
        const enriched = enrichItem(baseItem, mechanism);
        return enriched ? [enriched] : [];
      } catch {
        return [];
      }
    }
  },
  batchedPost: {
    match: (urlStr, bodyJson) => Array.isArray(bodyJson) && bodyJson.length > 0 && bodyJson.some(p => p && typeof p === 'object' && (p.query || p.queryId || p.operationName || p.extensions)),
    parse: (urlStr, bodyJson) => {
      const items: ParsedGraphQLItem[] = [];
      if (!Array.isArray(bodyJson)) return items;
      
      bodyJson.forEach((parsed, idx) => {
        if (parsed && typeof parsed === 'object' && (parsed.query || parsed.queryId || parsed.operationName || parsed.extensions)) {
          const baseItem = {
            query: parsed.query || (parsed.queryId ? `Persisted Query: ${parsed.queryId}` : "// No Query Body"),
            variables: parsed.variables ? JSON.stringify(parsed.variables, null, 2) : "{}",
            extensions: parsed.extensions ? JSON.stringify(parsed.extensions, null, 2) : null,
            operationName: parsed.operationName || `Operation ${idx + 1}`,
            queryId: parsed.queryId,
            isPersisted: !!parsed.queryId
          };
          const enriched = enrichItem(baseItem, "Batched POST");
          if (enriched) items.push(enriched);
        }
      });
      return items;
    }
  },
  standardPost: {
    match: (urlStr, bodyJson) => !Array.isArray(bodyJson) && typeof bodyJson === 'object' && bodyJson !== null && (bodyJson.query || bodyJson.queryId || bodyJson.operationName || bodyJson.extensions),
    parse: (urlStr, bodyJson) => {
      if (typeof bodyJson !== 'object' || bodyJson === null) return [];
      const parsed = bodyJson as any;
      const baseItem = {
        query: parsed.query || (parsed.queryId ? `Persisted Query: ${parsed.queryId}` : "// No Query Body"),
        variables: parsed.variables ? JSON.stringify(parsed.variables, null, 2) : "{}",
        extensions: parsed.extensions ? JSON.stringify(parsed.extensions, null, 2) : null,
        operationName: parsed.operationName || `Operation 1`,
        queryId: parsed.queryId,
        isPersisted: !!parsed.queryId
      };
      const enriched = enrichItem(baseItem, "Standard POST");
      return enriched ? [enriched] : [];
    }
  }
};
