const pkg = require("./package.json");
module.exports = {
    apps: [
        {
            name: pkg.name,
            script: "./dist/index.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            error_file: "./logs/error.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            merge_logs: true
        }
    ]
};
