use crate::BreakpointData;
use boa_engine::{Context, Source, JsValue, NativeFunction, JsString, property::Attribute, object::ObjectInitializer};

pub fn run_script(script: &str, mut data: BreakpointData) -> Result<BreakpointData, String> {
    let mut context = Context::default();

    // Register console.log, console.warn, console.error
    let console = ObjectInitializer::new(&mut context)
        .function(
            NativeFunction::from_fn_ptr(|_this, args, _context| {
                let msg = args.iter().map(|v| v.display().to_string()).collect::<Vec<_>>().join(" ");
                println!("[JS LOG] {}", msg);
                Ok(JsValue::undefined())
            }),
            JsString::from("log"),
            0,
        )
        .function(
            NativeFunction::from_fn_ptr(|_this, args, _context| {
                let msg = args.iter().map(|v| v.display().to_string()).collect::<Vec<_>>().join(" ");
                println!("[JS WARN] {}", msg);
                Ok(JsValue::undefined())
            }),
            JsString::from("warn"),
            0,
        )
        .function(
            NativeFunction::from_fn_ptr(|_this, args, _context| {
                let msg = args.iter().map(|v| v.display().to_string()).collect::<Vec<_>>().join(" ");
                eprintln!("[JS ERROR] {}", msg);
                Ok(JsValue::undefined())
            }),
            JsString::from("error"),
            0,
        )
        .build();

    context.register_global_property(JsString::from("console"), console, Attribute::all());

    // Prepare Request/Response objects
    let headers_map = &data.headers;
    let body_str = String::from_utf8_lossy(&data.body);
    
    // Create 'request' object
    let request_json = serde_json::json!({
        "headers": headers_map,
        "body": body_str,
        "method": data.method,
        "uri": data.uri
    });

    // Create 'response' object (only if status_code is set, indicating a response)
    let response_json = if let Some(sc) = data.status_code {
         serde_json::json!({
            "headers": headers_map,
            "body": body_str,
            "statusCode": sc
        })
    } else {
        serde_json::json!(null)
    };

    let script_wrapper = format!(
        "var request = {}; var response = {}; \n{}\n \
         if (typeof script === 'function') {{ \
             var result = script(request, response); \
             JSON.stringify(result); \
         }} else {{ \
             JSON.stringify({{request: request, response: response}}); \
         }}",
        request_json,
        response_json,
        script
    );

    let result = context.eval(Source::from_bytes(script_wrapper.as_bytes())).map_err(|e| e.to_string())?;
    
    if let Some(json_str) = result.as_string() {
        let modified: serde_json::Value = serde_json::from_str(&json_str.to_std_string_escaped()).map_err(|e| e.to_string())?;
        
        // Extract modifications from the returned object
        // The user can return { request, response } or just one of them
        let target = if data.status_code.is_some() {
            modified.get("response").or_else(|| modified.get("request"))
        } else {
            modified.get("request")
        };

        if let Some(t) = target {
            if let Some(h) = t.get("headers") {
                if let Ok(new_headers) = serde_json::from_value(h.clone()) {
                    data.headers = new_headers;
                }
            }
            if let Some(b) = t.get("body") {
                if let Some(b_str) = b.as_str() {
                    data.body = b_str.as_bytes().to_vec();
                }
            }
            if let Some(m) = t.get("method") {
                if let Some(m_str) = m.as_str() {
                    data.method = Some(m_str.to_string());
                }
            }
            if let Some(u) = t.get("uri") {
                if let Some(u_str) = u.as_str() {
                    data.uri = Some(u_str.to_string());
                }
            }
            if let Some(s) = t.get("statusCode") {
                if let Some(s_num) = s.as_u64() {
                    data.status_code = Some(s_num as u16);
                }
            }
        }
    }

    Ok(data)
}

pub fn matches_breakpoint(uri: &str, method: &str, rule_pattern: &str, rule_method: &str) -> bool {
    // Check method
    if rule_method != "ALL" && !rule_method.is_empty() && rule_method.to_uppercase() != method.to_uppercase() {
        return false;
    }

    // Check URI pattern (simple glob-like matching)
    if rule_pattern == "*" || rule_pattern.is_empty() {
        return true;
    }

    use globset::{Glob, GlobSetBuilder};
    if let Ok(glob) = Glob::new(rule_pattern) {
        let mut builder = GlobSetBuilder::new();
        builder.add(glob);
        if let Ok(set) = builder.build() {
            if set.is_match(uri) {
                return true;
            }
        }
    }

    uri.contains(rule_pattern)
}
