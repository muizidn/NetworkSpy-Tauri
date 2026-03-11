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
  
  function generateEntry(): object {
    const baseUrls = ["google.com", "amazon.com", "example.com", "randomsite.com", "othersite.com", "api.openai.com", "api.example.com", "socket.example.com", "api.github.com"];
    const randomDomain = baseUrls[Math.floor(Math.random() * baseUrls.length)];
  
    const path = randomPath(randomDomain);
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
    } else if (randomDomain === "api.github.com") {
        method = "POST";
        tags = ["GRAPHQL", "API"];
        request = "query { viewer { login } }";
        response = JSON.stringify({ data: { viewer: { login: "user" } } });
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
    };
  }
  
  export function generateJson(n: number): object[] {
    const entries: object[] = [...traffic_list_json];
    for (let i = 0; i < n; i++) {
      entries.push(generateEntry());
    }
    return entries;
  }
  