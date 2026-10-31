import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import fs from 'node:fs';

const TARGET_URL = "http://localhost:3000/api/buy";
const TOTAL_REQUESTS = 5000; 
const CONCURRENCY = 200;

const datasetPath = path.resolve("./virtual-users.json");
let virtualUsers:any = [];

try {
  const fileContent = fs.readFileSync(datasetPath, "utf8");
  virtualUsers = JSON.parse(fileContent);
  console.log(`Successfully loaded ${virtualUsers.length} users from dataset.`);
} catch (error:any) {
  console.error(`Error reading ${datasetPath}:`, error.message);
  process.exit(1);
}




function createDynamicPayload(trackingIndex: number) {
  const userId = virtualUsers[trackingIndex % virtualUsers.length];

  return JSON.stringify({
    userId,
    flashSaleId: "0192d1a3-2f10-7000-8000-000000000001",
    ticketId: "0192d1a3-2f10-7000-8000-000000000002",
  });
}
let started = 0;
let completed = 0;
let successes = 0;
let failures = 0;

const agent = new http.Agent({ keepAlive: true, maxSockets: CONCURRENCY });

function sendRequest() {
  if (started >= TOTAL_REQUESTS) return;

  const currentIndex = started;
  started++;

  const currentPayload = createDynamicPayload(currentIndex);

  const req = http.request(
    TARGET_URL,

    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(currentPayload),
      },
      agent: agent,
    },
    (res) => {
      let responseBody = "";

      res.setEncoding("utf8");

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        completed++;

        if (res.statusCode === 201) {
          successes++;
        } else {
          failures++;

          // Print only the first 10 failures.
          if (failures <= 10) {
            console.log(
              `Failure ${failures}: HTTP ${res.statusCode}`,
              responseBody,
            );
          }
        }

        next();
      });
    },
  );

  req.on("error", () => {
    completed++;
    failures++;
    next();
  });

  req.write(currentPayload);
  req.end();
}

function next() {
  if (completed < TOTAL_REQUESTS) {
    sendRequest();
  } else if (completed === TOTAL_REQUESTS) {
    console.log(`\n=== STRESS TEST COMPLETE ===`);
    console.log(`Total Requests Sent: ${completed}`);
    console.log(`HTTP 201 Successes:  ${successes}`);
    console.log(`HTTP Rejections:     ${failures}`);
    console.log(`============================\n`);
  }
}

console.log(
  `Launching onslaught: ${TOTAL_REQUESTS} requests at ${CONCURRENCY} concurrency...`,
);
for (let i = 0; i < CONCURRENCY; i++) {
  sendRequest();
}
