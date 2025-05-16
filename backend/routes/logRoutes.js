import express from "express";
const router = express.Router();

// Store last 100 requests
const requestLogs = [];

// Middleware to log requests
export const logMiddleware = (req, res, next) => {
  // Skip logging for /logweb path
  if (req.path !== "/logweb") {
    const log = {
      timestamp: new Date().toLocaleString("id-ID"),
      method: req.method,
      path: req.path,
      status: res.statusCode || "pending",
    };

    requestLogs.unshift(log);
    if (requestLogs.length > 100) requestLogs.pop();
  }
  next();
};

// HTML template for log view
const getLogHtml = () => `
<!DOCTYPE html>
<html>
<head>
    <title>Ngrok Request Logs</title>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="5">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f0f0f0;
        }
        h1 {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #4a90e2;
            color: white;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        tr:hover {
            background: #f5f5f5;
        }
        .status-200 {
            color: green;
        }
        .status-500 {
            color: red;
        }
        .auto-refresh {
            color: #666;
            font-size: 0.9em;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Ngrok Request Logs</h1>
    <div class="auto-refresh">Auto-refresh setiap 5 detik</div>
    <table>
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${requestLogs
              .map(
                (log) => `
                <tr>
                    <td>${log.timestamp}</td>
                    <td>${log.method}</td>
                    <td>${log.path}</td>
                    <td class="status-${log.status}">${log.status}</td>
                </tr>
            `
              )
              .join("")}
        </tbody>
    </table>
</body>
</html>
`;

// Route handler for log web view
router.get("/", (req, res) => {
  res.send(getLogHtml());
});

export { router as logRoutes, requestLogs };
