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

function randomPath(domain: string): string {
  const paths: Record<string, string[]> = {
    "google.com": [
      "search/images?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyZWFkIiwiY3JlYXRlIl0sImlhdCI6MTYyMzM2ODg4MSwiZXhwIjoxNjIzMzcwNjgxfQ.FhQ7k2FG9Gz2bwBxqumfS4ty9WPLZG-lXMgn2fi6Zv4",
      "search/images?page=2&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJ3cml0ZSJdLCJpYXQiOjE2MjMzMzAwNzIsImV4cCI6MTYyMzM0MjY3Mn0.YlMjfFQj1a9NO78mLHeXb_JYun-Lwz5qZ_jRix48k6g",
      "search/news?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyb2xlIl0sImlhdCI6MTYyMzM2ODg4MSwiZXhwIjoxNjIzMzcwNjgxfQ.vM3AhCEpQQgm88JX4_z0mVpfnj9ykgqED5DoG3iDJz4",
      "search/maps?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJtYXAgbGVnYWwiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.Hg3Edt8bdwFxQMP2yxByEDe7hs_9HO_S_9zXxQ_Ts6I",
    ],
    "amazon.com": [
      "product/electronics?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJlbGVjdHJvbmljcyJdLCJpYXQiOjE2MjMzMzAwNzIsImV4cCI6MTYyMzM0MjY3Mn0.LOdCoWiL88HgUXX-xH-9c1efrdVVQ_NCqGZoeFfw3ek",
      "product/electronics?page=2&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJlbGVjdHJvbmljcyJdLCJpYXQiOjE2MjMzMzAwNzIsImV4cCI6MTYyMzM0MjY3Mn0.LG8kNiVogwlfdb8US8F3HFGIleuTTeLD0uvPpfFT4XE",
      "product/clothing?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJjdXJhdGUiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.D5CtfhxFptbfRJjbZtADYr2BrZ5FJe2Q_TQbQXrtp2w",
      "product/clothing?page=2&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJjdXJhdGUiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.z39Z_k6kJdc7fIhRGr5ckqf1dxQX9X5lPCmr3_4lC1o8",
      "product/books?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJib29rcyJdLCJpYXQiOjE2MjMzMzAwNzIsImV4cCI6MTYyMzM0MjY3Mn0.WjtjqnszjFL3Gb-F3TSvTKHl5VxbFf4jJ2yyK_SXxxg",
    ],
    "api.openai.com": ["v1/chat/completions"],
    "api.example.com": ["v1/events"],
    "socket.example.com": ["v2"],
    "api.github.com": ["graphql"],
    "example.com": [
      "cart/add?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJjdXJhdGUiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.P6RAqUxxHFLbUwTh-aAvbLR73YVeae_-pUM1YFjoVe4",
      "user/profile?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJzdGF0dXNlYmlsZXMiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.D5CtfhxFptbfRJjbZtADYr2BrZ5FJe2Q_TQbQXrtp2w",
      "user/settings?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJzdGF0dXNlYmlsZXMiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.YlMjfFQj1a9NO78mLHeXb_JYun-Lwz5qZ_jRix48k6g",
    ],
    "randomsite.com": [
      "user/profile?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJjdXJhdGUiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.MT8zj-o2j9xzhvwXtG7lNnC4RVFhddpzFTvmhIueu38",
      "settings?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJjdXJhdGUiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.vKPvmppsvvJjxOyt7LOAlET3Bo5yqEwseP53PDrfl58",
      "settings?page=2&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJjdXJhdGUiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.q7t9kdq4G0hz0pn0-RNw2KTpDPfjb9JtMZB1vhRjdUM",
    ],
    "othersite.com": [
      "api/data?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJhcGkiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.LGBtiYUlNr6_U9QIKNmgnXYAOGhVZlQ0dxSYREh6Ucc",
      "api/status?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJhcGkiXSwiaWF0IjoxNjIzMzY4ODgxLCJleHB4IjoxNjIzMzcwNjgxfQ.qGvdH2k7XEXlbHpW4O_3VJe1sFhgZXNNSvbNi1IE5iQ",
    ]
  };

  const availablePaths = paths[domain] || [];
  const randomPath = availablePaths[Math.floor(Math.random() * availablePaths.length)];
  return randomPath;
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

function generateEntry(): object {
  const domains = [
    "google.com", "api.github.com", "api.openai.com", "api.authanalysis.com", 
    "slack.com", "microsoft.com", "socket.io", "netflix.com", "api.example.com", 
    "perf.myserver.com", "media.cdn.com", "docs.system.com", "data.raw.com"
  ];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];

  let path = randomPath(randomDomain);
  const port = randomDomain.includes('socket') ? 443 : Math.floor(Math.random() * (443 - 80 + 1)) + 80;

  let method = ["GET", "POST", "CONNECT", "DELETE", "PUT"][Math.floor(Math.random() * 5)];
  let status = ["Completed", "Failed", "In Progress"][Math.floor(Math.random() * 3)];
  let code = ["200", "404", "500", "301"][Math.floor(Math.random() * 4)];
  let request = "Request data";
  let response = ["-", "Response data", "Error message"][Math.floor(Math.random() * 3)];
  let tags = randomTags();
  let responseHeaders: Record<string, string> = {};

  if (randomDomain === "api.openai.com") {
    method = "POST";
    tags = ["AI", "OPENAI", Math.random() > 0.5 ? "STREAMING" : "PROMPT"];
    request = JSON.stringify({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello!" }],
      stream: tags.includes("STREAMING")
    }, null, 2);
    response = tags.includes("STREAMING")
      ? "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}"
      : JSON.stringify({ choices: [{ message: { role: "assistant", content: "Hello! How can I help you?" } }] }, null, 2);
    responseHeaders["Content-Type"] = "application/json";
  } else if (randomDomain === "api.example.com") {
    method = "GET";
    tags = ["SSE", "REALTIME"];
    request = "Accept: text/event-stream";
    response = "event: update\ndata: {\"status\": \"ok\"}";
    responseHeaders["Content-Type"] = "text/event-stream";
  } else if (randomDomain === "socket.example.com") {
    method = "GET";
    status = "Connected";
    code = "101";
    tags = ["WEBSOCKET"];
    request = "Upgrade: websocket";
    response = "Switching Protocols";
  } else if (randomDomain === "api.openai.com") {
        method = "POST";
        tags = ["LLM", "AI", "OPENAI", "STREAM"];
        path = "llm_streaming/v1/chat/completions";
        const streamChunks = [
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":"Sure! "},"finish_reason":null}]}',
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"I "},"finish_reason":null}]}',
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"can "},"finish_reason":null}]}',
            'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"help."},"finish_reason":null}]}',
            'data: [DONE]'
        ];
        request = JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: "Can you help me?" }],
            stream: true
        }, null, 2);
        response = streamChunks.join('\n');
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
    forkCount
    languages(first: 5) {
      nodes {
        name
        color
      }
    }
    owner {
      login
      avatarUrl
    }
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
      url
    }
  }
}`,
        variables: { input: { repositoryId: "R_1234", title: "Bug: App Crashing", body: "Steps to reproduce..." } },
        response: { data: { createIssue: { issue: { id: "I_9988", number: 42, title: "Bug: App Crashing" } } } }
      },
      {
        operationName: "SearchUsers",
        query: `query SearchUsers($query: String!) {
  search(query: $query, type: USER, first: 10) {
    userCount
    edges {
      node {
        ... on User {
          login
          name
          bio
          company
        }
      }
    }
  }
}`,
        variables: { query: "location:san-francisco" },
        response: { data: { search: { userCount: 1540, edges: [] } } }
      },
      {
        operationName: "UserFragmentDemo",
        query: `query UserFragmentDemo($login: String!) {
  user(login: $login) {
    ...UserFields
  }
}

fragment UserFields on User {
  id
  login
  name
  bio
  avatarUrl
  company
  email
}`,
        variables: { login: "octocat" },
        response: { data: { user: { id: "MDQ6VXNlcjU4MzIzMw==", login: "octocat", name: "The Octocat" } } }
      }
    ];

    const scene = gqlScenarios[Math.floor(Math.random() * gqlScenarios.length)];
    request = JSON.stringify({
      query: scene.query,
      variables: scene.variables,
      operationName: scene.operationName
    }, null, 2);
    response = JSON.stringify(scene.response, null, 2);
    path = "graphql_viewer/query";
    tags.push(scene.operationName.toUpperCase());
    // Ensure request headers include json
    // Note: in generateEntry, these will be merged into headers
  } else if (randomDomain === "api.authanalysis.com") {
      const scenario = Math.floor(Math.random() * 3);
      tags = ["AUTH", "IDENTITY", "SECURITY"];
      if (scenario === 0) {
          method = "GET";
          path = "auth_analysis_viewer/api/v1/secure-data";
          const jwt = generateJWT({ scope: "read:all", user: "analyst" });
          request = `Authorization: Bearer ${jwt}`;
          response = JSON.stringify({ data: "Sensitive information", access: "GRANTED" });
      } else if (scenario === 1) {
          method = "POST";
          path = "auth_analysis_viewer/api/v1/legacy-login";
          const basic = btoa("admin:password123");
          request = `Authorization: Basic ${basic}`;
          response = JSON.stringify({ status: "success", profile: { name: "Admin" } });
      } else {
          method = "GET";
          path = "auth_analysis_viewer/api/v1/sessioninfo";
          request = "Cookie: session_id=spy_778899; analytics_opt_out=true";
          response = JSON.stringify({ active_session: true, user_id: 101 });
      }
  } else if (randomDomain === "perf.myserver.com") {
      method = "GET";
      path = "performance_viewer/api/v1/metrics";
      tags = ["PERFORMANCE", "METRICS"];
      request = "{}";
      response = JSON.stringify({ status: "healthy", latency: "high" });
  } else if (randomDomain === "media.cdn.com") {
      const type = Math.floor(Math.random() * 12);
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
          response = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:10.0,\nchunk0.ts\n#EXTINF:10.0,\nchunk1.ts";
          responseHeaders["Content-Type"] = "application/x-mpegURL";
      } else if (type === 3) {
          path = "html_viewer/web/landing.html";
          tags = ["HTML", "BROWSER"];
          response = "<!DOCTYPE html><html><body style='background:#111;color:#eee'><h1>Mock Page</h1><p>This is a rendered HTML preview.</p></body></html>";
          responseHeaders["Content-Type"] = "text/html";
      } else if (type === 4) {
          path = "js_viewer/scripts/main.min.js";
          tags = ["JS", "ASSET"];
          response = "window.onload = function() { console.log('NetworkSpy Ready'); alert('Script Loaded'); };";
          responseHeaders["Content-Type"] = "application/javascript";
      } else if (type === 5) {
          path = "css_viewer/styles/theme.css";
          tags = ["CSS", "ASSET"];
          response = "body{background:#111;color:#fff;font-family:'Inter',sans-serif}.card{border:1px solid #333;border-radius:12px}.btn{padding:8px 16px;background:blue;color:white}";
          responseHeaders["Content-Type"] = "text/css";
      } else if (type === 6) {
          path = "ts_viewer/src/utils.ts";
          tags = ["TS", "ASSET"];
          response = "export const formatBytes = (bytes: number): string => {\n  if (bytes === 0) return '0 Bytes';\n  const k = 1024;\n  return (bytes / Math.pow(k, 2)).toFixed(2) + ' MB';\n};";
          responseHeaders["Content-Type"] = "text/typescript";
      } else if (type === 7) {
          path = "grpc_viewer/v1/UserSyncService/GetUserInfo";
          tags = ["GRPC", "PROTOBUF"];
          response = "BINARY_PROTOBUF_DATA_BASE64";
          responseHeaders["Content-Type"] = "application/grpc";
      } else if (type === 8) {
          path = "rabbitmq_viewer/exchange/orders/publish";
          tags = ["RABBITMQ", "AMQP"];
          response = JSON.stringify({ order_id: "ORD-556", status: "PENDING", items: ["iMac", "Magic Mouse"] });
          responseHeaders["Content-Type"] = "application/json";
      } else if (type === 9) {
          path = "kafka_viewer/topic/user-events/produce";
          tags = ["KAFKA", "MESSAGE"];
          response = JSON.stringify({ event: "USER_LOGIN", user_id: 887, ip: "127.0.0.1" });
          responseHeaders["Content-Type"] = "application/json";
      } else if (type === 10) {
          path = "soap_viewer/Service.asmx";
          tags = ["SOAP", "XML"];
          response = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soap:Body><GetPriceResponse><Price>29.99</Price></GetPriceResponse></soap:Body></soap:Envelope>';
          responseHeaders["Content-Type"] = "text/xml";
      } else if (type === 11) {
          path = "protobuf_viewer/binary/payload.pb";
          tags = ["PROTOBUF", "BINARY"];
          response = "MOCK_BINARY_PROTOBUF_STREAM";
          responseHeaders["Content-Type"] = "application/x-protobuf";
      }
  } else if (randomDomain === "docs.system.com") {
      path = "schemas/config.xml";
      tags = ["XML", "CONFIG"];
      response = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<root>\n  <config enabled=\"true\">\n    <timeout>3000</timeout>\n    <endpoint>https://api.internal</endpoint>\n  </config>\n</root>";
      responseHeaders["Content-Type"] = "application/xml";
  } else if (randomDomain === "data.raw.com") {
      path = "v1/binary-stream";
      tags = ["HEX", "BINARY"];
      response = Array.from({length: 32}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join('');
      responseHeaders["Content-Type"] = "application/octet-stream";
  }

  return {
    id: String(Math.floor(Math.random() * 9000000000000000000) + 1000000000000000000),
    tags,
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
  const entries: object[] = [...traffic_list_json];
  for (let i = 0; i < n; i++) {
    entries.push(generateEntry());
  }
  return entries;
}
