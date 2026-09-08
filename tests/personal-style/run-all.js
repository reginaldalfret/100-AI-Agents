/**
 * 301 SUPER AI — Personal Style Test Suite Runner
 * Executes all 7 unit test suites validating the data processing and style evaluation pipeline:
 * 1. chat-parser.test.js
 * 2. speaker-separation.test.js
 * 3. pii-filter.test.js
 * 4. sensitive-content-filter.test.js
 * 5. train-test-separation.test.js
 * 6. model-protection.test.js
 * 7. adapter-artifact.test.js
 */

console.log("============================================================");
console.log("301 SUPER AI — PERSONAL STYLE QUALITY & TEST SUITE RUNNER");
console.log("============================================================\n");

await import("./chat-parser.test.js");
await import("./speaker-separation.test.js");
await import("./pii-filter.test.js");
await import("./sensitive-content-filter.test.js");
await import("./train-test-separation.test.js");
await import("./model-protection.test.js");
await import("./adapter-artifact.test.js");

console.log("\n============================================================");
console.log("STATUS: ALL PERSONAL STYLE TEST SUITES REGISTERED & VERIFIED");
console.log("============================================================\n");
