const Redis = require("ioredis");
// const redis = new Redis(); // default localhost:6379
const redis = new Redis({
  host: "redis-12374.c73.us-east-1-2.ec2.redns.redis-cloud.com",
  port: 12374,
  username: "default", // nếu Redis cloud có username
  password: "sSbNB8v4CKFA5oiKr8C24UaYru8vr5At",
  // tls: {}
});

// Tên queue cho từng loại task
const TASK1_QUEUE = "task1_queue";
const TASK2_QUEUE = "task2_queue";

// --- Producer ---
async function addTask1(message) {
  await redis.rpush(TASK1_QUEUE, message);
  console.log("Added task1:", message);
}

async function addTask2(obj) {
  await redis.rpush(TASK2_QUEUE, JSON.stringify(obj));
  console.log("Added task2:", obj);
}

// --- Consumer ---
async function consumeQueue(queueName, processFunc) {
  while (true) {
    const task = await redis.lpop(queueName); // Lấy task đầu tiên
    if (task) {
      try {
        await processFunc(task);
      } catch (err) {
        console.error("Task lỗi:", err);
        // Nếu muốn retry, push lại queue:
        // await redis.rpush(queueName, task);
      }
    } else {
      // Nếu queue rỗng, delay 0.5s rồi check lại
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// --- Xử lý task ---
function processTask1(task) {
  return new Promise(async (resolve) => {
    const delay = await new Promise(r => setTimeout(r, 10000));
    console.log("Processing task1:", task);
    setTimeout(() => {
      console.log("Done task1:", task);
      resolve();
    }, 1000);
  });
}

function processTask2(task) {
  return new Promise(resolve => {
    const obj = JSON.parse(task);
    console.log("Processing task2:", obj);
    setTimeout(() => {
      console.log("Done task2:", obj);
      resolve();
    }, 1000);
  });
}

// --- Start consumers ---
consumeQueue(TASK1_QUEUE, processTask1);
consumeQueue(TASK2_QUEUE, processTask2);

// --- Export producer để dùng ở nơi khác ---
module.exports = { addTask1, addTask2 };
