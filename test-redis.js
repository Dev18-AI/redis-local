const Redis = require("ioredis");
const redis = new Redis()


redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("Redis connected!"));

// const redis = new Redis({
//   host: "redis-12374.c73.us-east-1-2.ec2.redns.redis-cloud.com",
//   port: 12374,
//   username: "default", // nếu Redis cloud có username
//   password: "sSbNB8v4CKFA5oiKr8C24UaYru8vr5At",
//   // tls: {}
// });
// const redis = new Redis({
//   host: "redis-19358.c262.us-east-1-3.ec2.redns.redis-cloud.com",
//   port: 19358,
//   username: "default",
//   password: "ckFqAdyOj0BPcmA4EIEx7MJgm4uv5jtO"
// });



(async () => {
  try {
    const pong = await redis.ping();
    console.log("PING response:", pong);
  } catch (err) {
    console.error(err);
  } finally {
    redis.disconnect();
  }
})();
