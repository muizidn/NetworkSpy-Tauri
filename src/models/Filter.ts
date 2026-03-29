export const FilterTypes = {
  URL: "URL",
  Method: "Method",
  Status: "Status",
  Client: "Client",
  Code: "Code",
  Time: "Time",
  Duration: "Duration",
  RequestSize: "Request Size",
  ResponseSize: "Response Size",
  Performance: "Performance",
  SSL: "SSL",
  Tags: "Tags",
  ID: "ID",
} as const;

export const FilterOperators = {
  Contains: "Contains",
  NotContains: "Not Contains",
  StartsWith: "Starts with",
  EndsWith: "Ends with",
  Equals: "Equals",
  NotEquals: "Not Equals",
  GreaterThan: "Greater Than",
  LessThan: "Less Than",
  After: "After",
  Before: "Before",
  MatchesRegex: "Matches Regex"
} as const;

export type FilterType = typeof FilterTypes[keyof typeof FilterTypes];
export type FilterOperator = typeof FilterOperators[keyof typeof FilterOperators];

export interface FilterRule {
  isGroup: false;
  id: string;
  enabled: boolean;
  type: FilterType;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  isGroup: true;
  id: string;
  enabled: boolean;
  logic: "AND" | "OR";
  children: FilterNode[];
}

export type FilterNode = FilterRule | FilterGroup;

export interface PredefinedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterNode[];
  isBuiltIn?: boolean;
}
