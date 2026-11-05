import http from "node:http";
import path from "node:path";
import fs from "node:fs";

const TARGET_URL = "http://localhost:3000/api/buy";
const TOTAL_REQUESTS = 5000;
const CONCURRENCY = 200;

const FLASH_SALE_ID = "cf3a8e86-a459-48e3-a6b5-d09eeeef7afa";
const TICKET_ID = "0192d1a3-2f10-7000-8000-000000000002";

const datasetPath = path.resolve("./virtual-users.json");

let virtualUsers: string[] = [];

try {
  const fileContent = fs.readFileSync(datasetPath, "utf8");
  virtualUsers = JSON.parse(fileContent);

  if (!Array.isArray(virtualUsers)) {
    throw new Error("Dataset must contain an array.");
  }

  if (virtualUsers.length < TOTAL_REQUESTS) {
    throw new Error(
      `Expected at least ${TOTAL_REQUESTS} users, found ${virtualUsers.length}.`,
    );
  }

  const selectedUsers = virtualUsers.slice(0, TOTAL_REQUESTS);
  const uniqueUsers = new Set(selectedUsers);

  if (uniqueUsers.size !== TOTAL_REQUESTS) {
    throw new Error(
      `Expected ${TOTAL_REQUESTS} unique users, found ${uniqueUsers.size}.`,
    );
  }

  virtualUsers = selectedUsers;

  console.log(`Loaded ${virtualUsers.length} unique users.`);
} catch (error: any) {
  console.error("Dataset error:", error.message);
  process.exit(1);
}

function createDynamicPayload(trackingIndex: number) {
  return JSON.stringify({
    userId: virtualUsers[trackingIndex],
    flashSaleId: FLASH_SALE_ID,
    ticketId: TICKET_ID,
  });
}

let started = 0;
let completed = 0;
let successes = 0;
let failures = 0;
let networkErrors = 0;

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: CONCURRENCY,
});

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
      agent,
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

  req.on("error", (error) => {
    completed++;
    failures++;
    networkErrors++;

    if (networkErrors <= 10) {
      console.error("Network error:", error.message);
    }

    next();
  });

  req.write(currentPayload);
  req.end();
}

function next() {
  if (completed < TOTAL_REQUESTS) {
    sendRequest();
  } else if (completed === TOTAL_REQUESTS) {
    console.log("\n=== EXPERIMENT B STRESS TEST ===");
    console.log(`Total Requests:       ${completed}`);
    console.log(`HTTP 201 Successes:   ${successes}`);
    console.log(`HTTP Rejections:      ${failures - networkErrors}`);
    console.log(`Network Errors:       ${networkErrors}`);
    console.log(`Total Failures:       ${failures}`);
    console.log("===============================\n");

    agent.destroy();
  }
}

console.log(
  `Launching Experiment B: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrency...`,
);

for (let i = 0; i < CONCURRENCY; i++) {
  sendRequest();
}
