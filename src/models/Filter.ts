export const FilterTypes = {
  URL: "URL",
  METHOD: "METHOD",
  STATUS: "STATUS",
  CLIENT: "CLIENT",
  CODE: "CODE",
  TIME: "TIME",
  DURATION: "DURATION",
  REQUEST_SIZE: "REQUEST_SIZE",
  RESPONSE_SIZE: "RESPONSE_SIZE",
  PERFORMANCE: "PERFORMANCE",
  SSL: "SSL",
  TAGS: "TAGS",
  ID: "ID",
} as const;

export const FilterOperators = {
  CONTAINS: "CONTAINS",
  NOT_CONTAINS: "NOT_CONTAINS",
  STARTS_WITH: "STARTS_WITH",
  ENDS_WITH: "ENDS_WITH",
  EQUALS: "EQUALS",
  NOT_EQUALS: "NOT_EQUALS",
  GREATER_THAN: "GREATER_THAN",
  LESS_THAN: "LESS_THAN",
  AFTER: "AFTER",
  BEFORE: "BEFORE",
  MATCHES_REGEX: "MATCHES_REGEX"
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
