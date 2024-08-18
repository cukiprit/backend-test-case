import express from "express";
import { openDB } from "../config/sqlite-driver.js";

const router = express.Router();

/**
 * @openapi
 * /books:
 *   get:
 *     summary: Get all books
 *     description: Retrieve a list of all books with their available quantities, excluding borrowed books.
 *     responses:
 *       200:
 *         description: A list of books with available quantities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   title:
 *                     type: string
 *                   author:
 *                     type: string
 *                   available:
 *                     type: integer
 *     tags:
 *       - Books
 */

router.get("/", async (req, res) => {
  const db = await openDB();
  const books = await db.all(`
    SELECT b.code, title, author, stock - IFNULL(bb.borrowed, 0) AS available
    FROM books b
    LEFT JOIN (
      SELECT book_code, COUNT(*) AS borrowed
      FROM borrowings
      WHERE returned_at IS NULL
      GROUP BY book_code
    ) bb ON b.code = bb.book_code
  `);
  res.status(200).json(books);
});

export default router;
