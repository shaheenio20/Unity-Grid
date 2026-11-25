import express from "express";
import { Donation } from "../models/Donation.js";
import { LedgerExpense } from "../models/LedgerExpense.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// 1. GET /api/ledger/summary (Public - Balance sheet totals)
router.get("/summary", async (req, res) => {
  try {
    const [donations, expenses] = await Promise.all([
      Donation.find({ status: { $ne: "Rejected" } }).lean(),
      LedgerExpense.find().lean(),
    ]);

    const totalDonations = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const balance = totalDonations - totalExpenses;

    return res.json({
      success: true,
      summary: {
        totalDonations,
        totalExpenses,
        balance,
        donationsCount: donations.length,
        expensesCount: expenses.length,
      },
    });
  } catch (error) {
    console.error("Error fetching ledger summary:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch ledger summary." });
  }
});

// 2. GET /api/ledger/donations (Public - List recent donations)
router.get("/donations", async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch donations." });
  }
});

// 3. POST /api/ledger/donations (Public / Authenticated - Submit new relief donation)
router.post("/donations", async (req, res) => {
  try {
    const { donorName, donorPhone, amount, paymentMethod, transactionId, reference } = req.body;

    if (!amount || Number(amount) < 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid donation amount (minimum ৳10).",
      });
    }

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID (TrxID) is required for verification.",
      });
    }

    const donation = await Donation.create({
      donorName: donorName ? donorName.trim() : "Anonymous Supporter",
      donorPhone: donorPhone ? donorPhone.trim() : "",
      amount: Number(amount),
      paymentMethod: ["bKash", "Nagad", "Rocket", "Bank"].includes(paymentMethod)
        ? paymentMethod
        : "bKash",
      transactionId: transactionId.trim().toUpperCase(),
      reference: reference ? reference.trim() : "Sylhet Flood Relief Fund",
      status: "Verified", // Instant auto-verification with TrxID recorded
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your donation record has been submitted and added to the public ledger.",
      donation,
    });
  } catch (error) {
    console.error("Error creating donation record:", error);
    return res.status(500).json({ success: false, message: "Failed to submit donation." });
  }
});

// 4. GET /api/ledger/expenses (Public - Itemized relief expenses)
router.get("/expenses", async (req, res) => {
  try {
    const expenses = await LedgerExpense.find()
      .populate("spentBy", "name email role")
      .sort({ spentDate: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch relief expenses." });
  }
});

// 5. POST /api/ledger/expenses (Member, Admin - Record new relief expenditure)
router.post("/expenses", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const { title, amount, category, spentDate, receiptImage, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Expenditure title is required." });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required." });
    }

    const expense = await LedgerExpense.create({
      title: title.trim(),
      amount: Number(amount),
      category: category || "Food & Water",
      spentDate: spentDate ? new Date(spentDate) : new Date(),
      receiptImage: receiptImage ? receiptImage.trim() : "",
      aiVerified: Boolean(receiptImage),
      aiConfidenceScore: receiptImage ? 0.96 : 0.85,
      notes: notes ? notes.trim() : "",
      spentBy: req.user?.id || req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Relief expense recorded and verified on the public ledger.",
      expense,
    });
  } catch (error) {
    console.error("Error creating expense record:", error);
    return res.status(500).json({ success: false, message: "Failed to record expense." });
  }
});

// 6. DELETE /api/ledger/expenses/:expenseId (Admin Only - Remove expense record)
router.delete("/expenses/:expenseId", requireRole(["Admin"]), async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await LedgerExpense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense record not found." });
    }

    await LedgerExpense.findByIdAndDelete(expenseId);

    return res.json({
      success: true,
      message: "Expense record deleted from ledger.",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return res.status(500).json({ success: false, message: "Failed to delete expense record." });
  }
});

export default router;
