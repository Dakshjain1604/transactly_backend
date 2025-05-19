const express=require("express");
const { authMiddleware } = require("../middleswares/auth");
const { getBalance, sendMoney,getHistory } = require("../controllers/AcccountController");
const router=express.Router();

/**
 * @swagger
 * /account/balance:
 *   get:
 *     summary: Get user's account balance
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/balance",authMiddleware,getBalance);

/**
 * @swagger
 * /account/sendMoney:
 *   post:
 *     summary: Send money to another user
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - amount
 *             properties:
 *               to:
 *                 type: string
 *                 description: Username of the recipient
 *               amount:
 *                 type: number
 *                 description: Amount to send
 *     responses:
 *       200:
 *         description: Money sent successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input or insufficient balance
 */
router.post("/sendMoney",authMiddleware,sendMoney);

/**
 * @swagger
 * /account/getHistory:
 *   get:
 *     summary: Get transaction history
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   from:
 *                     type: string
 *                   to:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/getHistory",authMiddleware,getHistory);

module.exports= router;
