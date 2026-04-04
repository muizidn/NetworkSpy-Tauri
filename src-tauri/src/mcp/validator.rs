use serde_json::Value;

/// Allowed filter types in Network Spy (Standardized as CONSTANT_UPPERCASE)
pub const FILTER_TYPES: &[&str] = &[
    "URL", "METHOD", "STATUS", "CLIENT", "CODE", "TIME", "DURATION", 
    "REQUEST_SIZE", "RESPONSE_SIZE", "PERFORMANCE", "SSL", "TAGS", "ID"
];

/// Allowed filter operators in Network Spy (Standardized as CONSTANT_UPPERCASE)
pub const FILTER_OPERATORS: &[&str] = &[
    "CONTAINS", "NOT_CONTAINS", "STARTS_WITH", "ENDS_WITH", "EQUALS", 
    "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "AFTER", "BEFORE", "MATCHES_REGEX"
];

/// Recursively validates a single FilterNode (Rule or Group) from arbitrary JSON
pub fn validate_filter_node(node: &Value) -> Result<(), String> {
    if !node.is_object() {
        return Err("Filter node must be an object".to_string());
    }

    // Required fields: id, enabled, isGroup
    let id = node.get("id").and_then(|v| v.as_str()).unwrap_or("");
    if id.is_empty() { return Err("Filter node must have a non-empty ID".to_string()); }

    let _enabled = node.get("enabled").and_then(|v| v.as_bool()).ok_or("Field 'enabled' must be a boolean")?;
    let is_group = node.get("isGroup").and_then(|v| v.as_bool()).ok_or("Field 'isGroup' must be a boolean")?;

    if is_group {
        // Group Validation
        let logic = node.get("logic").and_then(|v| v.as_str()).ok_or("Group must have a 'logic' field (AND/OR)")?;
        if logic != "AND" && logic != "OR" {
            return Err(format!("Invalid group logic: {}", logic));
        }

        let children = node.get("children").and_then(|v| v.as_array()).ok_or("Group must have a 'children' array")?;
        for child in children {
            validate_filter_node(child)?;
        }
    } else {
        // Rule Validation
        let f_type = node.get("type").and_then(|v| v.as_str()).ok_or("Rule must have a 'type'")?;
        
        // Normalize type for validation (handle legacy strings if they slip through, though MCP tools schema should prevent it)
        let normalized_type = f_type.to_uppercase().replace(" ", "_");
        if !FILTER_TYPES.contains(&normalized_type.as_str()) {
            return Err(format!("Invalid filter type: {}", f_type));
        }

        let f_operator = node.get("operator").and_then(|v| v.as_str()).ok_or("Rule must have an 'operator'")?;
        let normalized_op = f_operator.to_uppercase().replace(" ", "_");
        if !FILTER_OPERATORS.contains(&normalized_op.as_str()) {
            return Err(format!("Invalid filter operator: {}", f_operator));
        }

        let _value = node.get("value").and_then(|v| v.as_str()).ok_or("Rule must have a 'value' string")?;
    }

    Ok(())
}

/// Validates an entire filter preset payload
pub fn validate_filter_preset(preset: &Value) -> Result<(), String> {
    if !preset.is_object() {
        return Err("Preset must be an object".to_string());
    }

    let name = preset.get("name").and_then(|v| v.as_str()).unwrap_or("");
    if name.is_empty() {
        return Err("Preset must have a non-empty name".to_string());
    }

    let filters = preset.get("filters").and_then(|v| v.as_array()).ok_or("Preset must have a 'filters' array")?;
    for node in filters {
        validate_filter_node(node)?;
    }

    Ok(())
}
