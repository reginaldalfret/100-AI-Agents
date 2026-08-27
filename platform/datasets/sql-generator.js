/**
 * Sovereign AI Workbench — Natural Language to SQL Query Planner
 * Translates analytical questions into precise ANSI SQL targeting the dataset schema.
 */

import { validateReadOnlySQL } from "./sql-engine.js";

/**
 * Deterministic rule-based SQL generator for common aggregation & analytical questions.
 */
export function generateDeterministicSQL(question, schema) {
  const q = question.toLowerCase().trim();
  const tableName = "dataset";
  const columns = schema.columns || [];
  const numericCols = columns.filter(c => c.type === "INTEGER" || c.type === "REAL");
  const textCols = columns.filter(c => c.type === "TEXT");
  const dateCols = columns.filter(c => c.type === "DATE");

  // Helper to find best matching column from keywords
  const findCol = (terms, candidates = columns) => {
    for (const term of terms) {
      const match = candidates.find(c =>
        c.sqlName.toLowerCase().includes(term) ||
        c.originalName.toLowerCase().includes(term)
      );
      if (match) return match;
    }
    return null;
  };

  // 1. Total / Count rows
  if (/^(how many|count|total number of|number of)\s+(rows|records|entries|items)/i.test(q) || q === "count rows" || q === "total rows") {
    return `SELECT COUNT(*) AS total_rows FROM "${tableName}"`;
  }

  // 2. Highest / Maximum / Top 1
  if (q.includes("highest") || q.includes("maximum") || q.includes("most") || q.includes("top ")) {
    const numCol = findCol(["production", "sales", "revenue", "amount", "price", "count", "value", "quantity", "cost", "score", "total"], numericCols) || numericCols[0];
    const groupCol = findCol(["plant", "unit", "product", "region", "country", "category", "name", "item", "department", "company"], textCols) || textCols[0];

    if (numCol && groupCol) {
      return `SELECT "${groupCol.sqlName}", SUM("${numCol.sqlName}") AS total_${numCol.sqlName} FROM "${tableName}" GROUP BY "${groupCol.sqlName}" ORDER BY total_${numCol.sqlName} DESC LIMIT 5`;
    } else if (numCol) {
      return `SELECT MAX("${numCol.sqlName}") AS max_${numCol.sqlName} FROM "${tableName}"`;
    }
  }

  // 3. Lowest / Minimum / Bottom 1
  if (q.includes("lowest") || q.includes("minimum") || q.includes("least") || q.includes("bottom ")) {
    const numCol = findCol(["production", "sales", "revenue", "amount", "price", "count", "value", "quantity", "cost", "score", "total"], numericCols) || numericCols[0];
    const groupCol = findCol(["plant", "unit", "product", "region", "country", "category", "name", "item", "department", "company"], textCols) || textCols[0];

    if (numCol && groupCol) {
      return `SELECT "${groupCol.sqlName}", SUM("${numCol.sqlName}") AS total_${numCol.sqlName} FROM "${tableName}" GROUP BY "${groupCol.sqlName}" ORDER BY total_${numCol.sqlName} ASC LIMIT 5`;
    } else if (numCol) {
      return `SELECT MIN("${numCol.sqlName}") AS min_${numCol.sqlName} FROM "${tableName}"`;
    }
  }

  // 4. Average / Mean
  if (q.includes("average") || q.includes("mean") || q.includes("avg")) {
    const numCol = findCol(["production", "sales", "revenue", "amount", "price", "cost", "rate", "value", "quantity", "score"], numericCols) || numericCols[0];
    if (numCol) {
      const groupCol = findCol(["plant", "unit", "product", "region", "country", "category", "department", "type"], textCols);
      if (groupCol) {
        return `SELECT "${groupCol.sqlName}", AVG("${numCol.sqlName}") AS avg_${numCol.sqlName} FROM "${tableName}" GROUP BY "${groupCol.sqlName}" ORDER BY avg_${numCol.sqlName} DESC`;
      }
      return `SELECT AVG("${numCol.sqlName}") AS avg_${numCol.sqlName} FROM "${tableName}"`;
    }
  }

  // 5. Total / Sum
  if (q.includes("total") || q.includes("sum") || q.includes("overall")) {
    const numCol = findCol(["production", "sales", "revenue", "amount", "price", "cost", "value", "quantity", "tons"], numericCols) || numericCols[0];
    if (numCol) {
      // Check for specific filter in prompt (e.g. "for diesel" or "in plant a")
      for (const tCol of textCols) {
        for (const sample of (tCol.sampleValues || [])) {
          if (sample && q.includes(String(sample).toLowerCase())) {
            return `SELECT SUM("${numCol.sqlName}") AS total_${numCol.sqlName} FROM "${tableName}" WHERE LOWER("${tCol.sqlName}") = '${String(sample).toLowerCase().replace(/'/g, "''")}'`;
          }
        }
      }
      return `SELECT SUM("${numCol.sqlName}") AS total_${numCol.sqlName} FROM "${tableName}"`;
    }
  }

  // 6. Distribution / Summary by Category
  const groupCol = findCol(["plant", "unit", "product", "region", "category", "status", "type"], textCols);
  if (groupCol) {
    return `SELECT "${groupCol.sqlName}", COUNT(*) AS count FROM "${tableName}" GROUP BY "${groupCol.sqlName}" ORDER BY count DESC LIMIT 10`;
  }

  // Default fallback: Sample preview
  return `SELECT * FROM "${tableName}" LIMIT 10`;
}

/**
 * Uses local open-weight model to generate SQL for complex natural language prompts when needed.
 */
export async function generateSQLWithLLM(question, schema) {
  const schemaSummary = (schema.columns || []).map(c => `- "${c.sqlName}" (${c.type}) [original: "${c.originalName}"]`).join("\n");
  const prompt = `You are a strict SQL Query Generator.
Target table is always named "dataset".
Columns available:
${schemaSummary}

Generate a single safe, valid SQLite/DuckDB SQL SELECT statement to answer the question:
"${question}"

Rules:
1. ONLY return the SQL statement. Zero explanation, zero markdown quotes.
2. Use ONLY SELECT or WITH statements.
3. Use exact column names provided above.
4. Always wrap column names in double quotes.`;

  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:1.5b",
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 120 }
      })
    });
    const d = await res.json();
    const rawSql = (d.response || "").replace(/```sql|```/gi, "").trim();
    const validation = validateReadOnlySQL(rawSql);
    if (validation.valid) {
      return validation.cleanSql;
    }
  } catch (err) {
    console.warn("[SQL_GENERATOR] LLM generation fallback:", err.message);
  }

  // Fallback to deterministic SQL
  return generateDeterministicSQL(question, schema);
}
