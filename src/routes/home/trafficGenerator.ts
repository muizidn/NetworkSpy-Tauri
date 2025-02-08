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
      "google.com": ["search/images", "search/news", "search/maps"],
      "amazon.com": ["product/electronics", "product/clothing", "product/books"],
      "example.com": ["cart/add", "user/profile"],
      "randomsite.com": ["user/profile", "settings"],
      "othersite.com": ["api/data", "api/status"],
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
  