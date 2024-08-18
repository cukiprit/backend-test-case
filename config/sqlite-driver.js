import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const openDB = async () => {
  return open({
    filename: "./config/database.db",
    driver: sqlite3.Database,
  });
};

export const initDB = async () => {
  const db = await openDB();

  await db.exec(
    `
    CREATE TABLE IF NOT EXISTS members (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      penalty DATETIME
    );

    CREATE TABLE IF NOT EXISTS books (
      code TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS borrowings (
      member_code TEXT,
      book_code TEXT,
      borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      returned_at DATETIME,
      FOREIGN KEY (member_code) REFERENCES members (code),
      FOREIGN KEY (book_code) REFERENCES books (code)
    );
    `
  );
};
