import express from "express";
import { openDB } from "../config/sqlite-driver.js";

const router = express.Router();

const isPenalized = async (member_code) => {
  const db = await openDB();
  const member = await db.get("SELECT penalty FROM members WHERE code = ?", [
    member_code,
  ]);

  return member && new Date() < new Date(member.penalty);
};

const getBorrowedCount = async (member_code) => {
  const db = await openDB();
  const result = await db.get(
    `
    SELECT COUNT(*) AS total
    FROM borrowings
    WHERE member_code = ? AND returned_at IS NULL
    `,
    [member_code]
  );

  return result.total;
};

const getAvailableStock = async (book_code) => {
  const db = await openDB();
  const result = await db.get(
    `
    SELECT stock - IFNULL(bb.borrowed, 0) AS available
    FROM books b
    LEFT JOIN (
      SELECT book_code, COUNT(*) AS borrowed
      FROM borrowings
      WHERE returned_at IS NULL
      GROUP BY book_code
    ) bb ON b.code = bb.book_code
    WHERE b.code = ?
    `,
    [book_code]
  );

  return result.available;
};

const updateBookStock = async (book_code, amount) => {
  const db = await openDB();
  await db.run(
    `
    UPDATE books
    SET stock = stock + ? 
    WHERE code = ?
    `,
    [amount, book_code]
  );
};

const updateMemberPenalty = async (member_code, days) => {
  const db = await openDB();
  const penalty = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toISOString();
  await db.run(
    `
    UPDATE members
    SET penalty = ?
    WHERE code = ?
    `,
    [penalty, member_code]
  );
};

/**
 * @openapi
 * /members:
 *   get:
 *     summary: Get all members
 *     description: Retrieve a list of all members and their borrowed book counts.
 *     responses:
 *       200:
 *         description: A list of members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *                   penalty_until:
 *                     type: string
 *                     format: date-time
 *                   borrowed_count:
 *                     type: integer
 *     tags:
 *       - Members
 */
router.get("/", async (req, res) => {
  const db = await openDB();
  const members = await db.all("SELECT * FROM members");
  const member_books = await db.all(
    `
    SELECT member_code, COUNT(*) as total_borrowed
    FROM borrowings
    WHERE returned_at IS NULL
    GROUP BY member_code
    `
  );

  const member_map = new Map(
    member_books.map(({ member_code, total_borrowed }) => [
      member_code,
      total_borrowed,
    ])
  );
  members.forEach((member) => {
    member.total_borrowed = member_map.get(member.code) || 0;
  });

  res.status(200).json(members);
});

/**
 * @openapi
 * /members/{memberCode}/borrow/{bookCode}:
 *   post:
 *     summary: Borrow a book
 *     description: Allows a member to borrow a book if they are not penalized and the book is available.
 *     parameters:
 *       - in: path
 *         name: memberCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bookCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book borrowed successfully
 *       400:
 *         description: Bad request, book not available or member cannot borrow
 *       403:
 *         description: Member is penalized
 *     tags:
 *       - Members
 */
router.post("/:member_code/borrow/:book_code", async (req, res) => {
  const { member_code, book_code } = req.params;

  if (await isPenalized(member_code)) {
    return res
      .status(403)
      .send("Member cannot borrow books because it got penalized");
  }

  if ((await getBorrowedCount(member_code)) >= 2) {
    return res.status(400).send("Member cannot borrow more than 2 books");
  }

  const availableStock = await getAvailableStock(book_code);
  if (availableStock <= 0) {
    return res.status(400).send("Book is not available");
  }

  const db = await openDB();
  const existingBorrowing = await db.get(
    "SELECT * FROM borrowings WHERE member_code = ? AND returned_at IS NULL",
    [member_code]
  );
  if (existingBorrowing) {
    return res.status(400).send("Book already borrowed by this member");
  }

  await db.run("INSERT INTO borrowings(member_code, book_code) VALUES (?,?)", [
    member_code,
    book_code,
  ]);
  await updateBookStock(book_code, -1);

  res.status(201).send("Book borrowed successfully");
});

/**
 * @openapi
 * /members/{memberCode}/return/{bookCode}:
 *   post:
 *     summary: Return a book
 *     description: Allows a member to return a book, applying a penalty if returned late.
 *     parameters:
 *       - in: path
 *         name: memberCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bookCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book returned successfully
 *       400:
 *         description: Bad request, book was not borrowed or already returned
 *     tags:
 *       - Members
 */
router.post("/:member_code/return/:book_code", async (req, res) => {
  const { member_code, book_code } = req.params;
  const now = new Date();

  const db = await openDB();
  const borrowing = await db.get(
    "SELECT * FROM borrowings WHERE member_code = ? AND book_code = ? AND returned_at IS NULL",
    [member_code, book_code]
  );
  if (!borrowing) {
    return res.status(400).send("Book was not borrowed");
  }

  const borrowedDate = new Date(borrowing.borrowed_at);
  const daysBorrowed = Math.floor((now - borrowedDate) / (1000 * 60 * 60 * 24));

  await db.run(
    "UPDATE borrowings SET returned_at = ? WHERE member_code = ? AND book_code = ?",
    [now.toISOString(), member_code, book_code]
  );
  await updateBookStock(book_code, 1);

  if (daysBorrowed > 7) {
    await updateMemberPenalty(member_code, 3);
  }

  res.status(201).send("Book returned successfully");
});

export default router;
