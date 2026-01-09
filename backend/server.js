require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ------------------------------------------------------
// INIT DATABASE (run once, then delete this route)
// ------------------------------------------------------
app.get("/init-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        full_name TEXT,
        year_of_graduation TEXT,
        email TEXT,
        phone TEXT,
        occupation TEXT,
        position TEXT,
        position_other TEXT,
        motivation TEXT,
        experience TEXT,
        commitment TEXT,
        meetings TEXT,
        declaration BOOLEAN,
        signature TEXT,
        date TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);
    res.send("Submissions table created successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating table.");
  }
});

// ------------------------------------------------------
// SUBMIT FORM
// ------------------------------------------------------
app.post("/submit", async (req, res) => {
  const {
    fullName,
    yearOfGraduation,
    email,
    phone,
    occupation,
    position,
    positionOther,
    motivation,
    experience,
    commitment,
    meetings,
    declaration,
    signature,
    date
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO submissions (
        full_name, year_of_graduation, email, phone, occupation, position,
        position_other, motivation, experience, commitment, meetings,
        declaration, signature, date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        fullName,
        yearOfGraduation,
        email,
        phone,
        occupation,
        position,
        positionOther,
        motivation,
        experience,
        commitment,
        meetings,
        declaration,
        signature,
        date
      ]
    );

    res.redirect("https://wesley-election-frontend.onrender.com/success.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving submission");
  }
});

// ------------------------------------------------------
// VIEW SUBMISSIONS
// ------------------------------------------------------
app.get("/submissions", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM submissions ORDER BY timestamp DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving submissions");
  }
});

// ------------------------------------------------------
// EXPORT CSV
// ------------------------------------------------------
app.get("/export-csv", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM submissions ORDER BY timestamp DESC"
    );

    if (result.rows.length === 0) {
      return res.status(200).send("No submissions available");
    }

    const header = Object.keys(result.rows[0]).join(",") + "\n";

    const csv =
      header +
      result.rows
        .map(row =>
          Object.values(row)
            .map(value => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=submissions.csv"
    );

    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exporting CSV");
  }
});

// ------------------------------------------------------
// START SERVER
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
