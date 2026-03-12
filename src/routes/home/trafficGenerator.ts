import traffic_list_json from "../../stories/app/components/mock/traffic_list.json";

function randomString(length: number): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomTags(): string[] {
  const tags = [
    "LOGIN DOCKER",
    "AKAMAI Testing Robot",
    "NETWORK MONITORING",
    "API TESTING",
    "USER LOGIN",
  ];
  const randomCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 random tags
  return tags.sort(() => 0.5 - Math.random()).slice(0, randomCount);
}

function randomPath(domain: string, index?: number): string {
  const paths: Record<string, string[]> = {
    "google.com": [
      "search/images?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyZWFkIiwiY3JlYXRlIl0sImlhdCI6MTYyMzM2ODg4MSwiZXhwIjoxNjIzMzcwNjgxfQ.FhQ7k2FG9Gz2bwBxqumfS4ty9WPLZG-lXMgn2fi6Zv4",
      "search/images?page=2&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJ3cml0ZSJdLCJpYXQiOjE2MjMzMzAwNzIsImV4cCI6MTYyMzM0MjY3Mn0.YlMjfFQj1a9NO78mLHeXb_JYun-Lwz5qZ_jRix48k6g",
      "search/news?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyb2xlIl0sImlhdCI6MTYyMzM2ODg4MSwiZXhwIjoxNjIzMzcwNjgxfQ.vM3AhCEpQQgm88JX4_z0mVpfnj9ykgqED5DoG3iDJz4",
      "search/maps?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJtYXAgbGVnYWwiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.Hg3Edt8bdwFxQMP2yxByEDe7hs_9HO_S_9zXxQ_Ts6I",
    ],
    "amazon.com": [
      "product/electronics?page=1",
      "product/electronics?page=2",
      "product/clothing?page=1",
      "product/clothing?page=2",
      "product/books?page=1",
    ],
    "api.openai.com": ["v1/chat/completions"],
    "api.authanalysis.com": ["api/auth/login", "api/auth/refresh", "api/user/profile"],
    "api.example.com": ["v1/events"],
    "socket.example.com": ["v2"],
    "api.github.com": ["graphql"],
    "example.com": [
      "cart/add",
      "user/profile",
      "user/settings",
    ],
    "randomsite.com": [
      "user/profile?page=1",
      "settings?page=1",
      "settings?page=2",
    ],
    "othersite.com": [
      "api/data",
      "api/status",
    ]
  };

  const availablePaths = paths[domain] || ["v1/api/endpoint"];
  const scenarioIdx = index !== undefined ? index % availablePaths.length : Math.floor(Math.random() * availablePaths.length);
  return availablePaths[scenarioIdx];
}

function generateJWT(payload = {}): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
  const basePayload = {
    sub: "1234567890",
    name: "Mock User",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload
  };
  const encodedPayload = btoa(JSON.stringify(basePayload)).replace(/=/g, "");
  const signature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"; // Static mock signature
  return `${header}.${encodedPayload}.${signature}`;
}

function getDemoConfig() {
  if (typeof window === 'undefined') return { demo: false, host: null, mode: 'random' };
  
  // Robust parsing for both standard and hash-based routing (e.g. index.html#/home?demo=true)
  let search = window.location.search;
  if (!search && window.location.hash.includes('?')) {
    search = '?' + window.location.hash.split('?')[1];
  }
  
  const params = new URLSearchParams(search);
  return {
    demo: params.get('demo') === 'true',
    host: params.get('host'),
    mode: params.get('mode') === 'sequential' ? 'sequential' : 'random'
  };
}

function generateEntry(index: number, config: ReturnType<typeof getDemoConfig>): object {
  const domains = [
    "google.com", "api.github.com", "api.openai.com", "api.authanalysis.com",
    "slack.com", "microsoft.com", "socket.io", "netflix.com", "api.example.com",
    "perf.myserver.com", "media.cdn.com", "docs.system.com", "data.raw.com",
    "security-test.cloudflare.net"
  ];

  let randomDomain = config.host || domains[config.mode === 'sequential' ? index % domains.length : Math.floor(Math.random() * domains.length)];

  let path = randomPath(randomDomain, config.mode === 'sequential' ? index : undefined);
  const port = randomDomain.includes('socket') ? 443 : Math.floor(Math.random() * (443 - 80 + 1)) + 80;

  let method = ["GET", "POST", "CONNECT", "DELETE", "PUT"][config.mode === 'sequential' ? index % 5 : Math.floor(Math.random() * 5)];
  let status = ["Completed", "Failed", "In Progress"][config.mode === 'sequential' ? index % 3 : Math.floor(Math.random() * 3)];
  let code = ["200", "404", "500", "301"][config.mode === 'sequential' ? index % 4 : Math.floor(Math.random() * 4)];
  let request = "Request data";
  let response = ["-", "Response data", "Error message"][config.mode === 'sequential' ? index % 3 : Math.floor(Math.random() * 3)];
  let tags = randomTags();
  let responseHeaders: Record<string, string> = {};

  if (randomDomain === "api.example.com") {
    method = "GET";
    tags = ["SSE", "REALTIME"];
    request = "Accept: text/event-stream";
    response = "event: update\ndata: {\"status\": \"ok\"}";
    responseHeaders["Content-Type"] = "text/event-stream";
  } else if (randomDomain === "api.authanalysis.com") {
    code = "200";
    tags = ["AUTH", "IDENTITY", "SECURITY"];
    const scenario = config.mode === 'sequential' ? index % 3 : Math.floor(Math.random() * 3);
    if (scenario === 0) {
      method = "POST";
      path = "api/auth/login";
      request = JSON.stringify({ username: "admin", password: "password123" });
      response = JSON.stringify({ 
        access_token: generateJWT({ user: "admin", scope: "read write" }),
        expires_in: 3600 
      });
    } else if (scenario === 1) {
      method = "POST";
      path = "api/auth/refresh";
      const oldRefreshToken = generateJWT({ user: "admin", type: "refresh" });
      request = JSON.stringify({ refresh_token: oldRefreshToken });
      response = JSON.stringify({ 
        access_token: generateJWT({ user: "admin", scope: "read write" }),
        refresh_token: generateJWT({ user: "admin", type: "refresh" }),
        expires_in: 3600
      });
    } else {
      method = "GET";
      path = "api/user/profile";
      response = JSON.stringify({ id: "user_123", name: "Admin User", role: "superuser" });
      responseHeaders["Authorization"] = `Bearer ${generateJWT({ user: "admin" })}`;
    }
  } else if (randomDomain === "socket.example.com") {
    method = "GET";
    status = "Connected";
    code = "101";
    tags = ["WEBSOCKET"];
    request = "Upgrade: websocket";
    response = "Switching Protocols";
  } else if (randomDomain === "api.openai.com") {
    method = "POST";
    tags = ["LLM", "AI", "OPENAI", "STREAM", "TOOL-CALL"];
    path = "v1/chat/completions";
    
    const scenario = config.mode === 'sequential' ? index % 3 : Math.floor(Math.random() * 3);
    
    if (scenario === 0) {
      // Scenario 0: Tool Call / Multi-turn
      path = "v1/chat/completions?llm=tool-call&choices=1";
      const messages = [
        { role: "system", content: "You are an expert coding assistant." },
        { role: "user", content: "Check the server status." },
        { 
          role: "assistant", 
          content: "I'll probe the health endpoint.",
          tool_calls: [{ 
            id: "call_t123", 
            type: "function", 
            function: { name: "get_health", arguments: '{"service": "auth"}' } 
          }]
        }
      ];
      request = JSON.stringify({ model: "gpt-4-turbo", messages, stream: false }, null, 2);
      response = JSON.stringify({
        id: "chatcmpl-tool-123",
        model: "gpt-4-turbo",
        choices: [{
          index: 0,
          message: { role: "assistant", content: "The service is healthy.", tool_calls: [] },
          finish_reason: "stop"
        }],
        usage: { prompt_tokens: 120, completion_tokens: 45, total_tokens: 165 }
      }, null, 2);
    } else if (scenario === 1) {
      // Scenario 1: Multimodal (Image)
      path = "v1/chat/completions?dataType=images&llm=vision";
      tags.push("MULTIMODAL", "VISION");
      const messages = [
        { role: "system", content: "You are a vision assistant." },
        { 
          role: "user", 
          content: [
            { type: "text", text: "What's in this architectural diagram?" },
            { type: "image_url", image_url: { url: "https://images.unsplash.com/photo-1503387762-592dea58f210?auto=format&fit=crop&w=400" } }
          ]
        }
      ];
      request = JSON.stringify({ model: "gpt-4-vision", messages, stream: false }, null, 2);
      response = JSON.stringify({
        id: "chatcmpl-vision-123",
        model: "gpt-4-vision",
        choices: [{
          index: 0,
          message: { 
            role: "assistant", 
            content: [
              { type: "text", text: "This diagram shows a microservices architecture with a central API gateway." }
            ] 
          },
          finish_reason: "stop"
        }],
        usage: { prompt_tokens: 850, completion_tokens: 50, total_tokens: 900 }
      }, null, 2);
    } else {
      // Scenario 2: Multi-Choice (N=2) + Stream
      path = "v1/chat/completions?choices=2&llm=stochastic";
      tags.push("N-CHOICE", "STOCHASTIC");
      const messages = [{ role: "user", content: "Give me two distinct creative names for a network proxy." }];
      request = JSON.stringify({ model: "gpt-4", messages, stream: true, n: 2 }, null, 2);
      
      const chunks = [];
      const choice1 = "CyberSentry";
      const choice2 = "NetVigilance";
      
      for (let i = 0; i < choice1.length; i++) {
          chunks.push(`data: {"id":"cmpl-n-123","choices":[{"index":0,"delta":{"content":"${choice1[i]}"},"finish_reason":null}]}`);
      }
      for (let i = 0; i < choice2.length; i++) {
          chunks.push(`data: {"id":"cmpl-n-123","choices":[{"index":1,"delta":{"content":"${choice2[i]}"},"finish_reason":null}]}`);
      }
      chunks.push('data: [DONE]');
      response = chunks.join('\n');
    }
  } else if (randomDomain === "api.github.com") {
    method = "POST";
    tags = ["GRAPHQL", "API", "REAL-WORLD"];

    const gqlScenarios = [
      {
        operationName: "GetRepoDetails",
        query: `query GetRepoDetails($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    description
    stargazerCount
  }
}`,
        variables: { owner: "facebook", name: "react" },
        response: { data: { repository: { id: "MDEwOlJlcG9zaXRvcnkxMDI3MDI1MA==", name: "react", stargazerCount: 215000 } } }
      },
      {
        operationName: "CreateIssue",
        query: `mutation CreateIssue($input: CreateIssueInput!) {
  createIssue(input: $input) {
    issue {
      id
      number
      title
    }
  }
}`,
        variables: { input: { repositoryId: "R_1234", title: "Bug: App Crashing", body: "Steps to reproduce..." } },
        response: { data: { createIssue: { issue: { id: "I_9988", number: 42, title: "Bug: App Crashing" } } } }
      }
    ];

    const scenarioIdx = config.mode === 'sequential' ? index % gqlScenarios.length : Math.floor(Math.random() * gqlScenarios.length);
    const scene = gqlScenarios[scenarioIdx];
    request = JSON.stringify({
      query: scene.query,
      variables: scene.variables,
      operationName: scene.operationName
    }, null, 2);
    response = JSON.stringify(scene.response, null, 2);
    path = "graphql_viewer/query";
    tags.push(scene.operationName.toUpperCase());
  } else if (randomDomain === "perf.myserver.com") {
    method = "GET";
    path = "performance_viewer/api/v1/metrics";
    tags = ["PERFORMANCE", "METRICS"];
    request = "{}";
    response = JSON.stringify({ status: "healthy", latency: "high", cpu: "12%", memory: "1.4GB" });
  } else if (randomDomain === "docs.system.com") {
    path = "schemas/config.xml";
    tags = ["XML", "CONFIG"];
    response = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<root>\n  <config enabled=\"true\">\n    <timeout>3000</timeout>\n  </config>\n</root>";
    responseHeaders["Content-Type"] = "application/xml";
  } else if (randomDomain === "security-test.cloudflare.net") {
    path = "v1/audit/headers";
    tags = ["SECURITY", "INFRA"];
    response = JSON.stringify({ status: "Audit complete", nodes: ["SJC", "LAX"] });
    responseHeaders["Content-Type"] = "application/json";
    responseHeaders["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains";
  } else if (randomDomain === "media.cdn.com") {
    const type = config.mode === 'sequential' ? index % 12 : Math.floor(Math.random() * 12);
    if (type === 0) {
      path = "image_viewer/assets/hero-bg.png";
      tags = ["IMAGE", "STATIC"];
      response = "MOCK_IMAGE_DATA_BASE64_PLACEHOLDER";
      responseHeaders["Content-Type"] = "image/png";
    } else if (type === 1) {
      path = "audio_viewer/stream/podcast-ep1.mp3";
      tags = ["AUDIO", "MEDIA"];
      response = "MOCK_AUDIO_DATA_BLOB";
      responseHeaders["Content-Type"] = "audio/mpeg";
    } else if (type === 2) {
      path = "video_viewer/video/live/index.m3u8";
      tags = ["VIDEO", "HLS", "STREAM"];
      response = "#EXTM3U\n#EXTINF:10.0,\nchunk0.ts";
      responseHeaders["Content-Type"] = "application/x-mpegURL";
    } else if (type === 3) {
      path = "html_viewer/web/landing.html";
      tags = ["HTML", "BROWSER"];
      response = "<!DOCTYPE html><html><body><h1>Mock</h1></body></html>";
      responseHeaders["Content-Type"] = "text/html";
    } else if (type === 4) {
      path = "js_viewer/scripts/main.min.js";
      tags = ["JS", "ASSET"];
      response = "console.log('App Ready');";
      responseHeaders["Content-Type"] = "application/javascript";
    } else if (type === 5) {
      path = "css_viewer/styles/theme.css";
      tags = ["CSS", "ASSET"];
      response = "body{background:#000}";
      responseHeaders["Content-Type"] = "text/css";
    } else if (type === 6) {
      path = "ts_viewer/src/utils.ts";
      tags = ["TS", "ASSET"];
      response = "export const PI = 3.14;";
      responseHeaders["Content-Type"] = "text/typescript";
    } else if (type === 7) {
      path = "grpc_viewer/v1/UserSyncService/GetUserInfo";
      tags = ["GRPC", "PROTOBUF"];
      response = "BINARY_DATA";
      responseHeaders["Content-Type"] = "application/grpc";
    } else if (type === 8) {
      path = "rabbitmq_viewer/exchange/orders/publish";
      tags = ["RABBITMQ"];
      response = JSON.stringify({ id: index });
    } else if (type === 9) {
      path = "kafka_viewer/topic/events";
      tags = ["KAFKA"];
      response = JSON.stringify({ event: "pulse" });
    } else if (type === 10) {
      path = "soap_viewer/Service.asmx";
      tags = ["SOAP", "XML"];
      response = '<envelope><body>Price: 29.99</body></envelope>';
      responseHeaders["Content-Type"] = "text/xml";
    } else {
      path = "protobuf_viewer/binary/payload.pb";
      tags = ["PROTOBUF", "BINARY"];
      response = "MOCK_BINARY_PROTO";
      responseHeaders["Content-Type"] = "application/x-protobuf";
    }
  }

  // Enrich with Headers for Explainer Demo
  if (Math.random() > 0.4) {
    responseHeaders["CF-Ray"] = `${randomString(16)}-SJC`;
    responseHeaders["CF-Cache-Status"] = ["HIT", "MISS", "DYNAMIC", "REVALIDATED"][Math.floor(Math.random() * 4)];
    responseHeaders["CF-IPCountry"] = "US";
    responseHeaders["CF-Connecting-IP"] = "172.68.22.104";
    responseHeaders["Set-Cookie"] = "session_spy=xyz123; Path=/; HttpOnly; Secure; SameSite=Strict";
  }

  if (Math.random() > 0.6) {
    responseHeaders["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
    responseHeaders["Content-Security-Policy"] = "default-src 'self'; script-src 'self' https://trusted.cdn.com; object-src 'none';";
    responseHeaders["X-Frame-Options"] = "DENY";
    responseHeaders["X-Content-Type-Options"] = "nosniff";
    responseHeaders["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
  }

  return {
    id: String(Math.floor(Math.random() * 9000000000000000000) + 1000000000000000000),
    tags: [],
    url: `${randomDomain.includes('socket') ? 'wss' : 'https'}://${randomDomain}:${port}/${path}`,
    client: ["Google Map", "Weather App", "Video Streaming", "Social Media App"][Math.floor(Math.random() * 4)],
    method,
    status,
    code,
    time: `${Math.floor(Math.random() * 900) + 100} ms`,
    duration: `${Math.floor(Math.random() * 91) + 10} bytes`,
    request,
    response,
    headers: {
      "Authorization": randomDomain === "api.authanalysis.com" && request.includes('Authorization')
        ? request.split(': ')[1]
        : undefined,
      "Cookie": randomDomain === "api.authanalysis.com" && request.startsWith('Cookie')
        ? request.split(': ')[1]
        : undefined,
      "X-Debug-JWT": generateJWT({ mode: "debug_stream" }),
      "X-Custom-Power-Layer": `NS-${randomString(8)}`,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Content-Type": (randomDomain === "api.github.com" || randomDomain === "api.openai.com") ? "application/json" : undefined
    },
    responseHeaders,
    performance: {
      dns: Math.floor(Math.random() * 50) + 5,
      tcp: Math.floor(Math.random() * 100) + 10,
      tls: Math.floor(Math.random() * 150) + 20,
      ttfb: Math.floor(Math.random() * 500) + 50,
      download: Math.floor(Math.random() * 200) + 10
    }
  };
}

export function generateJson(n: number): object[] {
  const config = getDemoConfig();
  
  // If demo mode is active, start with a fresh list. Otherwise include the static mock data.
  const entries: object[] = config.demo ? [] : [...traffic_list_json];
  
  for (let i = 0; i < n; i++) {
    entries.push(generateEntry(i, config));
  }
  return entries;
}
