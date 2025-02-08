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
    // Select a random base URL (domain)
    const baseUrls = ["google.com", "amazon.com", "example.com", "randomsite.com", "othersite.com"];
    const randomDomain = baseUrls[Math.floor(Math.random() * baseUrls.length)];
  
    // Generate the full URL with path
    const path = randomPath(randomDomain);
    const port = Math.floor(Math.random() * (443 - 80 + 1)) + 80; // Random port between 80 and 443
  
    return {
      id: String(
        Math.floor(Math.random() * 9000000000000000000) + 1000000000000000000
      ),
      tags: randomTags(),
      url: `https://${randomDomain}:${port}/${path}`,
      client: [
        "Google Map",
        "Weather App",
        "Video Streaming",
        "Social Media App",
      ][Math.floor(Math.random() * 4)],
      method: ["GET", "POST", "CONNECT", "DELETE", "PUT"][
        Math.floor(Math.random() * 5)
      ],
      status: ["Completed", "Failed", "In Progress"][
        Math.floor(Math.random() * 3)
      ],
      code: ["200", "404", "500", "301"][Math.floor(Math.random() * 4)],
      time: `${Math.floor(Math.random() * 900) + 100} ms`,
      duration: `${Math.floor(Math.random() * 91) + 10} bytes`,
      request: "Request data",
      response: ["-", "Response data", "Error message"][
        Math.floor(Math.random() * 3)
      ],
    };
  }
  
  export function generateJson(n: number): object[] {
    const entries: object[] = [];
    for (let i = 0; i < n; i++) {
      entries.push(generateEntry());
    }
    return entries;
  }
  