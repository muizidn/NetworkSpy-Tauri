export const CUSTOM_SCRIPT_TEMPLATES: Record<string, { script: string; description: string }> = {
  code_snippet: {
    script: `/* Example: Generate a custom CURL command */
const curl = \`curl -X POST "https://api.example.com" \\
-H "Content-Type: application/json" \\
-d '\${body}'\`;

return [{ 
    type: 'Custom CURL', 
    value: curl 
}];`,
    description: "Script should return an array of finding objects: { type: 'title', value: 'generatedScript' }. Available variables: body, headers."
  },
  static_analysis: {
    script: `/* Example: Scanning for patterns */
const findings = [];

if (body.includes('sk_test_')) {
    findings.push({ 
        type: 'Test Key Exposure', 
        value: 'Stripe test key found in payload', 
        risk: 'Medium', 
        solution: 'Rotate the key immediately' 
    });
}

return findings;`,
    description: "Script should return an array of finding objects: { type, value, risk, solution }. Available variables: body, headers."
  },
  header_explainer: {
    script: `/* Example: Check for specific headers */
const findings = [];
const auth = headers.find(h => h.key.toLowerCase() === 'authorization');

if (auth && !auth.value.startsWith('Bearer ')) {
    findings.push({ 
        type: 'Non-Standard Auth', 
        value: 'Authorization header does not use Bearer token', 
        risk: 'Low', 
        solution: 'Standardize on Bearer authentication if possible.' 
    });
}

return findings;`,
    description: "Script should return an array of finding objects: { type, value, risk, solution }. Available variables: body, headers."
  },
  sensitive_data: {
    script: `/* Example: Advanced PII Scanning */
const findings = [];
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
const matches = body.match(emailRegex);

if (matches) {
    matches.forEach(email => {
        findings.push({ 
            type: 'Email Exposure', 
            value: \`Found email: \${email}\`, 
            risk: 'High', 
            solution: 'Mask this data in logs or production responses.' 
        });
    });
}

return findings;`,
    description: "Script should return an array of finding objects: { type, value, risk, solution }. Available variables: body, headers."
  },
  auth_analysis: {
    script: `/* Example: Token Expiration Check */
const findings = [];
const auth = headers.find(h => h.key.toLowerCase() === 'authorization');

if (auth && auth.value.includes('exp')) {
    findings.push({ 
        type: 'Exposed Expiry', 
        value: 'Token expiration details found in header', 
        risk: 'Medium', 
        solution: 'Ensure expiry is handled server-side only.' 
    });
}

return findings;`,
    description: "Script should return an array of finding objects: { type, value, risk, solution }. Available variables: body, headers."
  }
};
