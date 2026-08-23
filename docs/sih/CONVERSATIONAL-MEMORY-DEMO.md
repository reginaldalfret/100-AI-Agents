# Conversational Memory SIH Golden Demonstration Script

**Platform:** Sovereign AI Workbench  
**Test URL:** `http://127.0.0.1:8300/`

---

## Live Demonstration Sequence

### Turn 1: Topic Establishment
- **Agent:** `001 Writing AI Agent` (or `101 Super AI Agent`)
- **Input:**
  ```text
  Write a professional article about renewable energy.
  ```
- **Observed AI Output:**
  - Complete, structured overview of renewable energy sources (Solar, Wind, Hydro, Geothermal, Biomass) streamed in real-time.

---

### Turn 2: Coreference Follow-up ("it")
- **Input:**
  ```text
  write about the types in it
  ```
- **Expected Behavior:**
  - The AI immediately resolves `"it"` to **Renewable Energy**.
  - Outputs detailed classifications of renewable energy without asking for clarification.

---

### Turn 3: Comparative Ordinal Follow-up ("one")
- **Input:**
  ```text
  Which one is most suitable for homes?
  ```
- **Expected Behavior:**
  - Resolves `"one"` against the previously discussed renewable energy types.
  - Identifies **Rooftop Solar PV** as the primary residential solution.

---

### Turn 4: Comparative Target Transition
- **Input:**
  ```text
  Compare that with wind energy.
  ```
- **Expected Behavior:**
  - Maintains solar vs wind residential suitability context and compares rooftop feasibility, maintenance, and output.
