import express, { Request, Response } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
const app = express();
const port = 5000;

dotenv.config({ path: path.join(process.cwd(), ".env") });

// parser
app.use(express.json());

// DB connection
const pool = new Pool({
  connectionString: `${process.env.CONNECTION_STR}`,
});

// create table
const initDB = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        age INT,
        phone VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
  await pool.query(`
        CREATE TABLE IF NOT EXISTS todos(
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        completed BOOLEAN DEFAULT false,
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
};

initDB();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello");
});

// post a user data into users table
app.post("/users", async (req: Request, res: Response) => {
  //   console.log(req.body);
  const { name, email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users(name, email) VALUES($1, $2) RETURNING *`,
      [name, email]
    );
    console.log(result.rows);

    res.status(201).json({
      success: true,
      message: "Data inserted",
      Data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.detail,
    });
  }
});

// get all users data
app.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM users
      `);

    res.status(200).json({
      success: true,
      message: "Get all users data",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.detail,
    });
  }
});

// get users data using id params
app.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      res.status(500).json({
        success: false,
        message: "No data is retrived",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Get data successfully",
        data: result.rows,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.detail,
    });
  }
});

// update a user data
app.put("/users/:id", async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *`,
      [name, email, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(500).json({
        success: false,
        message: "user not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "user data updated",
        data: result.rows[0],
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "user not found",
    });
  }
});

// delete a user
app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [
      req.params.id,
    ]);

    console.log(result);

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "user is deleted successfully",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "user not found",
      details: error.detail,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
