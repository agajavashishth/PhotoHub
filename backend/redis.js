const redis = require("redis");
const retryStrategy = require("node-redis-retry-strategy");


//connect to Redis server, store reference in client
const client = redis.createClient({
  host: '<hostname>',
  port: <port>,
  password: '<password>',
  retry_strategy: retryStrategy({
        number_of_retry_attempts: 10
    })
});

module.exports = client;
