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
  const domains = ["google.com", "api.github.com", "api.openai.com", "auth.myserver.com", "slack.com", "microsoft.com", "socket.io", "netflix.com", "api.example.com"];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];

  let path = randomPath(randomDomain);
  const port = randomDomain.includes('socket') ? 443 : Math.floor(Math.random() * (443 - 80 + 1)) + 80;

  let method = ["GET", "POST", "CONNECT", "DELETE", "PUT"][Math.floor(Math.random() * 5)];
  let status = ["Completed", "Failed", "In Progress"][Math.floor(Math.random() * 3)];
  let code = ["200", "404", "500", "301"][Math.floor(Math.random() * 4)];
  let request = "Request data";
  let response = ["-", "Response data", "Error message"][Math.floor(Math.random() * 3)];
  let tags = randomTags();

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
  } else if (randomDomain === "api.example.com") {
    method = "GET";
    tags = ["SSE", "REALTIME"];
    request = "Accept: text/event-stream";
    response = "event: update\ndata: {\"status\": \"ok\"}";
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
    tags.push(scene.operationName.toUpperCase());
  } else if (randomDomain === "auth.myserver.com") {
      const isLogin = Math.random() > 0.5;
      if (isLogin) {
          method = "POST";
          path = "v1/login";
          tags = ["AUTH", "IDENTITY", "LOGIN"];
          request = JSON.stringify({ username: "admin", password: "password123" });
          response = JSON.stringify({ 
              access_token: generateJWT({ role: "admin", scope: "read:write" }),
              expires_in: 3600,
              token_type: "Bearer"
          }, null, 2);
      } else {
          method = "GET";
          path = "v1/user/info";
          tags = ["AUTH", "PROFILE"];
          const jwt = generateJWT({ role: "user", permissions: ["read"] });
          request = `Authorization: Bearer ${jwt}`; // Mock visualization
          response = JSON.stringify({ id: "user_123", name: "Mock User", email: "user@example.com" }, null, 2);
      }
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
        "Authorization": randomDomain === "auth.myserver.com" && method === "GET" 
            ? `Bearer ${generateJWT({ scope: "api:access" })}` 
            : undefined,
        "X-JWT-Header": generateJWT({ type: "debug" })
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
