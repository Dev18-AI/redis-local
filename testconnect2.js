const redis = require("redis");

const client = redis.createClient({
  socket: {
    host: "127.0.0.1",  // Redis server
    port: 6379
  },
  password: "your_redis_password_if_any"  // nếu Redis cài password
});

client.connect()
  .then(() => console.log("Connected to Redis"))
  .catch(err => console.error("Redis connection error:", err));
