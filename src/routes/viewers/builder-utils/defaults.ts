import { ViewerBlock } from "@src/context/ViewerContext";

export const getDefaultCode = (type: ViewerBlock['type']) => {
    switch (type) {
        case 'text':
            return `async function code() {\n  const headers = await readRequestHeaders();\n  return "Content-Type: " + (headers['content-type'] || 'unknown');\n}`;
        case 'json':
            return `async function code() {\n  const body = await readRequestBody();\n  try {\n    return JSON.parse(body);\n  } catch (e) {\n    return { error: "Not a valid JSON" };\n  }\n}`;
        case 'headers':
            return `async function code() {\n  return await readResponseHeaders();\n}`;
        case 'table':
            return `async function code() {\n  // Return an array of objects for table view\n  return [\n    { key: "Method", value: "GET" },\n    { key: "Status", value: 200 }\n  ];\n}`;
        case 'html':
            return `async function code() {\n  // Fetch data to be used in HTML\n  const headers = await readRequestHeaders();\n  return {\n    host: headers['host'] || 'Unknown',\n    timestamp: new Date().toLocaleTimeString(),\n    chartColors: ['#3b82f6', '#10b981', '#f59e0b']\n  };\n}`;
        default:
            return `async function code() {\n  return "Hello World";\n}`;
    }
};

export const getDefaultHtml = () => {
    return `
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<div class="chart-container">
  <div class="header">
    <div class="title">Traffic Statistics</div>
    <div id="timestamp" class="timestamp"></div>
  </div>
  <div class="host-badge" id="host-name"></div>
  <canvas id="myChart"></canvas>
</div>

<script>
  // Access data from Logic (JS) tab via window.DATA
  const data = window.DATA;
  
  document.getElementById('host-name').textContent = data.host;
  document.getElementById('timestamp').textContent = 'Last Checked: ' + data.timestamp;

  const ctx = document.getElementById('myChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels || ['Req 1', 'Req 2', 'Req 3'],
      datasets: [{
        label: 'Response Time (ms)',
        data: data.values || [12, 19, 3],
        backgroundColor: data.chartColors,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
    }
  });
</script>
    `.trim();
};

export const getDefaultCss = () => {
    return `
body {
  margin: 0;
  padding: 20px;
  background: #0f172a;
  color: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.chart-container {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 25px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.timestamp {
  font-size: 10px;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
}

.host-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #3b82f6;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 20px;
}

#myChart {
  width: 100% !important;
  height: 250px !important;
}
    `.trim();
};
