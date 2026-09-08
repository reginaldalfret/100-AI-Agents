import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Gemma Chat UI — WhatsApp-Style Personal Style Lab Elements", () => {
  const htmlPath = path.resolve("platform/web/index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  // 1. View & Navigation
  assert.ok(html.includes('id="navPersonalStyleBtn"'), "Nav button must exist in sidebar");
  assert.ok(html.includes('id="personalStyleView"'), "Personal Style View panel must exist");
  assert.ok(html.includes('class="view-panel ps-chat-view-container"'), "Must have ps-chat-view-container class");

  // 2. WhatsApp-Style Header
  assert.ok(html.includes('id="psChatHeader"'), "Compact chat header must exist");
  assert.ok(html.includes('id="btnPsBack"'), "Back button must exist");
  assert.ok(html.includes("Gemma Kaviya Style"), "Header must display Gemma Kaviya Style");
  assert.ok(html.includes("Local AI"), "Header must display Local AI status");
  assert.ok(html.includes("AI communication-style model"), "Header must display subtle disclosure");
  assert.ok(html.includes('id="btnPsMenuToggle"'), "Three-dot menu button must exist");
  assert.ok(html.includes('id="psOverflowMenu"'), "Overflow dropdown menu must exist");

  // 3. Overflow Menu Options
  assert.ok(html.includes('id="btnPsMenuNewChat"'), "New Chat menu option must exist");
  assert.ok(html.includes('id="btnPsMenuReset"'), "Reset Chat menu option must exist");
  assert.ok(html.includes('id="btnPsMenuToggleMode"'), "Model toggle menu option must exist");
  assert.ok(html.includes('id="btnPsMenuCompare"'), "Compare menu option must exist");
  assert.ok(html.includes('id="btnPsMenuModelInfo"'), "Model Info menu option must exist");

  // 4. Chat Messages Area & Welcome State
  assert.ok(html.includes('id="psChatMessages"'), "Chat messages container must exist");
  assert.ok(html.includes('id="psWelcomeState"'), "Welcome state must exist for empty chat");
  assert.ok(html.includes("Start a conversation"), "Welcome state must encourage starting a conversation");
  assert.ok(html.includes("how are you?"), "Must have quick-start chip 'how are you?'");
  assert.ok(html.includes("what are you doing?"), "Must have quick-start chip 'what are you doing?'");
  assert.ok(html.includes("tell me something"), "Must have quick-start chip 'tell me something'");

  // 5. Input Bar & Controls
  assert.ok(html.includes('id="psInputBar"'), "Input bar must exist");
  assert.ok(html.includes('id="btnPsAttach"'), "Attach/Actions '+' button must exist");
  assert.ok(html.includes('id="psChatInput"'), "Chat input must exist");
  assert.ok(html.includes('id="psSendBtn"'), "Send button must exist");
  assert.ok(html.includes('id="psSendIcon"'), "Send icon container must exist");

  // 6. Compatibility Elements (preserving existing test and automation bindings)
  assert.ok(html.includes('id="btnPsNewChat"'), "New Chat button must exist");
  assert.ok(html.includes('id="btnPsReset"'), "Reset button must exist");
  assert.ok(html.includes('id="btnPsStop"'), "Stop button must exist");
  assert.ok(html.includes('id="btnBaseGemma"'), "Base Gemma toggle button must exist");
  assert.ok(html.includes('id="btnFineTunedGemma"'), "Fine-Tuned Gemma toggle button must exist");
  assert.ok(html.includes('id="btnPsRunCompare"'), "Run Compare button must exist");
  assert.ok(html.includes('id="baseGemmaResponseBox"'), "Base response box must exist");
  assert.ok(html.includes('id="styleGemmaResponseBox"'), "Style response box must exist");

  // 7. Badges & Mandatory Disclosure in Model Info Modal
  assert.ok(html.includes("[ GEMMA ]"), "Gemma badge must exist");
  assert.ok(html.includes("[ PERSONAL STYLE ]"), "Personal Style badge must exist");
  assert.ok(html.includes("[ LOCAL ]"), "Local badge must exist");
  assert.ok(html.includes("[ QLORA ]"), "QLoRA badge must exist");
  assert.ok(html.includes("Mandatory Disclosure"), "Mandatory AI disclosure banner must exist");
  assert.ok(html.includes('id="psModelInfoModal"'), "Model Info modal must exist");
  assert.ok(html.includes('id="psComparisonModal"'), "Comparison modal must exist");
});

test("Gemma Chat UI — WhatsApp Styling and Responsive CSS Rules", () => {
  const cssPath = path.resolve("platform/web/styles.css");
  const css = fs.readFileSync(cssPath, "utf8");

  // Bubble styling
  assert.ok(css.includes(".ps-msg-user"), "Must define .ps-msg-user for right-aligned user bubble");
  assert.ok(css.includes(".ps-msg-ai"), "Must define .ps-msg-ai for left-aligned AI bubble");
  assert.ok(css.includes(".ps-msg-time"), "Must define .ps-msg-time for message timestamps");
  assert.ok(css.includes(".ps-typing-dots"), "Must define .ps-typing-dots for generation indicator");

  // Input & Header styling
  assert.ok(css.includes(".ps-chat-header"), "Must define .ps-chat-header");
  assert.ok(css.includes(".ps-send-btn"), "Must define .ps-send-btn");
  assert.ok(css.includes(".ps-dropdown-menu"), "Must define .ps-dropdown-menu");

  // Mobile responsiveness
  assert.ok(css.includes("@media (max-width: 768px)"), "Must define mobile responsive styles");
});

test("Gemma Chat UI — App Controller Verification", () => {
  const appJsPath = path.resolve("platform/web/app.js");
  const js = fs.readFileSync(appJsPath, "utf8");

  assert.ok(js.includes("window.psLabApp"), "Must export window.psLabApp");
  assert.ok(js.includes("formatTime"), "Must include formatTime method");
  assert.ok(js.includes("sendMessage"), "Must include sendMessage method");
  assert.ok(js.includes("stopGeneration"), "Must include stopGeneration method");
  assert.ok(js.includes("resetChat"), "Must include resetChat method");
  assert.ok(js.includes("newChat"), "Must include newChat method");
  assert.ok(js.includes("toggleModel"), "Must include toggleModel method");
  assert.ok(js.includes("fillAndSend"), "Must include fillAndSend method");
});
