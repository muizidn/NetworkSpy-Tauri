export type GqlMechanism = "Standard POST" | "Batched POST" | "GET Query Params" | "Persisted Query (queryId)" | "LinkedIn Specialized" | "Reddit Specialized";

export interface ParsedGraphQLItem {
  query: string;
  variables: string;
  extensions: string | null;
  operationName: string;
  queryId?: string;
  isPersisted: boolean;
  type?: string;
  fragmentsCount: number;
  directivesCount: number;
  depth: number;
  mechanism: GqlMechanism;
}

export interface GraphQLParser {
  match: (urlStr: string, bodyJson: any) => boolean;
  parse: (urlStr: string, bodyJson: any) => ParsedGraphQLItem[];
}
