use serde_json::Value;
use crate::traffic::db::TrafficMetadata;

pub struct FilterEngine;

impl FilterEngine {
    pub fn matches_preset(metadata: &TrafficMetadata, filters: &Value) -> bool {
        if let Some(nodes) = filters.as_array() {
            if nodes.is_empty() { return true; }
            // Top-level rules are joined with AND
            for node in nodes {
                if !Self::matches_node(metadata, node) {
                    return false;
                }
            }
            true
        } else {
            true
        }
    }

    pub fn matches_node(metadata: &TrafficMetadata, node: &Value) -> bool {
        let is_group = node.get("isGroup").and_then(|v| v.as_bool()).unwrap_or(false);
        let enabled = node.get("enabled").and_then(|v| v.as_bool()).unwrap_or(true);
        if !enabled { return true; }

        if is_group {
            let logic = node.get("logic").and_then(|v| v.as_str()).unwrap_or("AND");
            let children = node.get("children").and_then(|v| v.as_array());
            
            if let Some(children) = children {
                if children.is_empty() { return true; }
                if logic == "OR" {
                    children.iter().any(|c| Self::matches_node(metadata, c))
                } else {
                    children.iter().all(|c| Self::matches_node(metadata, c))
                }
            } else {
                true
            }
        } else {
            Self::matches_rule(metadata, node)
        }
    }

    fn matches_rule(metadata: &TrafficMetadata, rule: &Value) -> bool {
        let f_type = rule.get("type").and_then(|v| v.as_str()).unwrap_or("");
        let operator = rule.get("operator").and_then(|v| v.as_str()).unwrap_or("");
        let value = rule.get("value").and_then(|v| v.as_str()).unwrap_or("");

        let target_value = match f_type {
            "URL" => metadata.uri.clone().unwrap_or_default(),
            "METHOD" => metadata.method.clone().unwrap_or_default(),
            "STATUS" => metadata.status_code.map(|s| s.to_string()).unwrap_or_default(),
            "CLIENT" => metadata.client.clone().unwrap_or_default(),
            "ID" => metadata.id.clone(),
            "TAGS" => {
                let lower_val = value.to_lowercase();
                match operator {
                    "CONTAINS" => return metadata.tags.iter().any(|t| t.to_lowercase().contains(&lower_val)),
                    "EQUALS" => return metadata.tags.iter().any(|t| t.to_lowercase() == lower_val),
                    "NOT_EQUALS" => return !metadata.tags.iter().any(|t| t.to_lowercase() == lower_val),
                    "STARTS_WITH" => return metadata.tags.iter().any(|t| t.to_lowercase().starts_with(&lower_val)),
                    "ENDS_WITH" => return metadata.tags.iter().any(|t| t.to_lowercase().ends_with(&lower_val)),
                    _ => return true,
                }
            },
            _ => return true, // Fallback for types not yet fully implemented in Rust engine
        };

        let target_lower = target_value.to_lowercase();
        let value_lower = value.to_lowercase();

        match operator {
            "CONTAINS" => target_lower.contains(&value_lower),
            "NOT_CONTAINS" => !target_lower.contains(&value_lower),
            "EQUALS" => target_lower == value_lower,
            "NOT_EQUALS" => target_lower != value_lower,
            "STARTS_WITH" => target_lower.starts_with(&value_lower),
            "ENDS_WITH" => target_lower.ends_with(&value_lower),
            "GREATER_THAN" => {
                let t_num = target_value.parse::<f64>().unwrap_or(0.0);
                let f_num = value.parse::<f64>().unwrap_or(0.0);
                t_num > f_num
            },
            "LESS_THAN" => {
                let t_num = target_value.parse::<f64>().unwrap_or(0.0);
                let f_num = value.parse::<f64>().unwrap_or(0.0);
                t_num < f_num
            },
            "MATCHES_REGEX" => {
                if let Ok(re) = regex::RegexBuilder::new(value).case_insensitive(true).build() {
                    re.is_match(target_value.as_str())
                } else {
                    true
                }
            },
            _ => true,
        }
    }
}
