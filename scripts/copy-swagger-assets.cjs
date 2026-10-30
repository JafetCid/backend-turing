const fs = require("node:fs");
const path = require("node:path");
const { getAbsoluteFSPath } = require("swagger-ui-dist");

const sourceDir = getAbsoluteFSPath();
const destinationDir = path.resolve(
    process.cwd(),
    "public",
    "swagger-ui",
);

fs.rmSync(destinationDir, { recursive: true, force: true });

fs.mkdirSync(destinationDir, { recursive: true });

fs.cpSync(sourceDir, destinationDir, { recursive: true });

console.log("Swagger UI assets copied to public/swagger-ui");