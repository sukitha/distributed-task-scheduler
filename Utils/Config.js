const convict = require("convict");
const path = require("path");

let config = convict({
    env: {
        doc: "The application environment.",
        format: ["production", "development", "test"],
        default: "development",
        env: "NODE_ENV",
    },
    ip: {
        doc: "The IP address to bind.",
        format: "*",
        default: "0.0.0.0",
        env: "IP_ADDRESS",
    },
    port: {
        doc: "The port to bind.",
        format: "port",
        default: 8080,
        env: "PORT",
        arg: "port",
    },

    redis: {
        port: {
            doc: "The redis port to connect.",
            format: "port",
            default: 3636,
            env: "REDIS_PORT",
            arg: "redis_port",
        },

        ip: {
            doc: "The redis ip to connect.",
            format: "*",
            default: "127.0.0.1",
            env: "REDIS_IP",
            arg: "redis_ip",
        },

        auth: {
            doc: "The redis password.",
            format: "*",
            default: "",
            env: "REDIS_AUTH",
            arg: "redis_auth",
        },

        db: {
            doc: "The redis db.",
            format: "*",
            default: "0",
            env: "REDIS_DB",
            arg: "redis_db",
        }
    }
});

const env = config.get("env");
const confPath = path.join(process.cwd(), `./config/${env}.json`);
config.loadFile(confPath);
config.validate({ allowed: "strict" });

module.exports.config = config;