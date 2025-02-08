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

function generateEntry(): object {
  return {
    id: String(
      Math.floor(Math.random() * 9000000000000000000) + 1000000000000000000
    ),
    tags: randomTags(),
    url: `gateway.${randomString(Math.floor(Math.random() * 100) + 20)}.com:${
      Math.floor(Math.random() * (443 - 80 + 1)) + 80
    }`,
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
