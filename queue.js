const Redis = require("ioredis");
const redis = new Redis(); // default localhost:6379

const redisProducer = new Redis();
const redisConsumer = new Redis();
// host: "redis-12374.c73.us-east-1-2.ec2.redns.redis-cloud.com",
// port: 12374,
// password: "sSbNB8v4CKFA5oiKr8C24UaYru8vr5At",
// const redis = new Redis({
//   host: "redis-19358.c262.us-east-1-3.ec2.redns.redis-cloud.com",
//   port: 19358,
//   username: "default", // nếu Redis cloud có username
//   password: "ckFqAdyOj0BPcmA4EIEx7MJgm4uv5jtO"
//   // tls: {}
// });

// rpush  : là add vào bên phải tức xuông cuối
// lpush   : là add vào bên trên tức lên trên

// --- Connection Redis cho producer ---
// const redisProducer = new Redis({
//   host: "redis-19358.c262.us-east-1-3.ec2.redns.redis-cloud.com",
//   port: 19358,
//   username: "default",
//   password: "ckFqAdyOj0BPcmA4EIEx7MJgm4uv5jtO",
// });

// --- Connection Redis cho consumer ---
// const redisConsumer = new Redis({
//   host: "redis-19358.c262.us-east-1-3.ec2.redns.redis-cloud.com",
//   port: 19358,
//   username: "default",
//   password: "ckFqAdyOj0BPcmA4EIEx7MJgm4uv5jtO",
// });

// Tên queue cho từng loại task
const TASK1_QUEUE = "task1_queue";
const TASK1_PROCESSING = "task1_processing";
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

// --- Producer ---
async function addTask1ToredisProducer(message) {
  await redisProducer.lpush(TASK1_QUEUE, message);
  console.log("Added task1:", message);
}
async function addTask2ToredisProducer(obj) {
  await redisProducer.lpush(TASK2_QUEUE, JSON.stringify(obj));
  console.log("Added task2:", obj);
}

// --- Consumer ---

// --- Consumer ---
// async function recoverTasks(processingQueue, sourceQueue) {
//   let task;
//   redisConsumer.r
//   while ((task = await redisConsumer.rpoplpush(processingQueue, sourceQueue)) !== null) {
//     console.log("Recovered task:", task);
//   }
// }
async function recoverTasks(processingQueue, sourceQueue) {
  while (true) {
    const task = await redisConsumer.rpop(processingQueue); // RPOP processing
    if (!task) break;
    await redisProducer.rpush(sourceQueue, task);           // RPUSH source
    console.log("Recovered task to tail:", task);
  }
}
async function consumeQueueBrpoplpush(sourceQueue, processingQueue, processFunc) {
  while (true) {
    // block chờ task
    const task = await redisConsumer.brpoplpush(sourceQueue, processingQueue, 0);
    console.log("Consumer nhận task:", task);

    if (task) {
      try {
        await processFunc(task);
        // xử lý thành công → xóa khỏi processing
        await redisConsumer.lrem(processingQueue, 1, task);
      } catch (err) {
        console.error("Task lỗi:", err);
        // Nếu muốn retry thì đẩy lại queue
        // await redisProducer.rpush(sourceQueue, task);
      }
    }
  }
}

// async function consumeQueueBrpoplpush(sourceQueue, processingQueue, processFunc) {
//   while (true) {
//     // const task = await redis.lpop(sourceQueue); // Lấy task đầu tiên xong xóa luôn

//     // lấy task, nhưng không mất luôn, mà chuyển sang queue processing
//     const task = await redis.brpoplpush(sourceQueue, processingQueue, 0);   // 0 là số s chờ
//     console.log("tao day task", task)
//     if (task) {
//       try {
//         await processFunc(task);
//       } catch (err) {
//         console.error("Task lỗi:", err);
//         // Nếu muốn retry, push lại queue:
//         // await redis.rpush(sourceQueue, task);
//       }
//     } else {
//       // Nếu queue rỗng, delay 0.5s rồi check lại
//       await new Promise(r => setTimeout(r, 500));
//     }
//     // xử lý thành công → xóa khỏi processing
//     // await redis.lrem(processingQueue, 1, task);
//   }
// }
async function consumeQueueBpoplpush(queueName, processFunc) {
  while (true) {
    console.log("vao lap-")
    const task = await redis.lpop(queueName); // Lấy task đầu tiên xong xóa luôn
    if (task) {
      try {
        await processFunc(task);
      } catch (err) {
        console.error("Task lỗi:", err);
        // Nếu muốn retry, push lại queue:
        await redis.rpush(queueName, task);
      }
    } else {
      // Nếu queue rỗng, delay 0.5s rồi check lại
      await new Promise(r => setTimeout(r, 500));
    }
  }
}
async function consumeQueueBpoplpushV2(queueName, processFunc) {
  while (true) {
    const task = await redis.lindex(queueName, 0); // Lấy task đầu tiên xong xóa luôn
    if (task) {
      try {
        await processFunc(task);
      } catch (err) {
        console.error("Task lỗi:", err);
      }
    } else {
      await new Promise(r => setTimeout(r, 500));
    }
    await redis.lrem(queueName, 1, task);
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
// consumeQueueBrpoplpush(TASK1_QUEUE, TASK1_PROCESSING, processTask1);
// consumeQueueBpoplpush(TASK2_QUEUE, processTask2);
(async () => {
  await recoverTasks(TASK1_PROCESSING, TASK1_QUEUE)
  await consumeQueueBrpoplpush(TASK1_QUEUE, TASK1_PROCESSING, processTask1);
})()
// recoverTasks(TASK1_PROCESSING, TASK1_QUEUE)
// consumeQueueBrpoplpush(TASK1_QUEUE, TASK1_PROCESSING, processTask1);
// consumeQueueBpoplpush(TASK1_QUEUE, processTask1);
// consumeQueueBpoplpushV2(TASK1_QUEUE, processTask1);


redis.on("connect", () => console.log("Redis connected!"));
redis.on("error", (err) => console.error("Redis error:", err));

// --- Export producer để dùng ở nơi khác ---
// module.exports = { addTask1, addTask2 };
module.exports = { addTask1: addTask1ToredisProducer, addTask2 };
