const express = require("express");
const mongoose = require("mongoose");

// MongoDB সার্ভারের URL
const uri = "mongodb://localhost:27017/bankDB"; // আপনার MongoDB সার্ভারের URL দিন

// Mongoose মডেল সেটআপ
const accountSchema = new mongoose.Schema({
  userId: Number,
  balance: Number,
});

const transactionSchema = new mongoose.Schema({
  fromUserId: Number,
  toUserId: Number,
  amount: Number,
  date: { type: Date, default: Date.now },
});

const Account = mongoose.model("Account", accountSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.json());

// ফান্ড ট্রান্সফার করার জন্য একটি ফাংশন
async function transferFunds(fromUserId, toUserId, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ব্যালেন্স আপডেট ফাংশন
    await updateBalance(fromUserId, -amount, session);
    await updateBalance(toUserId, amount, session);

    // লেনদেনের ইতিহাসে যুক্ত করা
    await logTransaction(fromUserId, toUserId, amount, session);

    // ট্রানজ্যাকশন সম্পন্ন করা
    await session.commitTransaction();
    console.log("ট্রানজ্যাকশন সফলভাবে সম্পন্ন হয়েছে!");
  } catch (error) {
    await session.abortTransaction();
    console.error("ট্রানজ্যাকশন বাতিল করা হয়েছে:", error);
    throw error;
  } finally {
    session.endSession();
  }
}

// ব্যালেন্স আপডেট করার ফাংশন
async function updateBalance(userId, amount, session) {
  const result = await Account.updateOne(
    { userId: userId },
    { $inc: { balance: amount } },
    { session }
  );

  if (result.matchedCount === 0) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  if (result.modifiedCount === 0) {
    throw new Error(`Failed to update balance for user with ID ${userId}.`);
  }
}

// লেনদেনের ইতিহাস লগ করার ফাংশন
async function logTransaction(fromUserId, toUserId, amount, session) {
  const transaction = new Transaction({
    fromUserId: fromUserId,
    toUserId: toUserId,
    amount: amount,
  });

  const result = await transaction.save({ session });

  if (!result) {
    throw new Error("Failed to log transaction.");
  }
}

// POST: ফান্ড ট্রান্সফার করার জন্য API
app.post("/transfer", async (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;

  try {
    await transferFunds(fromUserId, toUserId, amount);
    res.status(200).send("ট্রানজ্যাকশন সফল হয়েছে");
  } catch (error) {
    res.status(500).send("ট্রানজ্যাকশন ব্যর্থ হয়েছে");
  }
});

// GET: ইউজারের ব্যালেন্স দেখার জন্য API
app.get("/balance/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const account = await Account.findOne({ userId: userId });
    if (account) {
      res.status(200).json(account);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Error fetching balance");
  }
});

// DELETE: ইউজারের অ্যাকাউন্ট মুছে ফেলার জন্য API
app.delete("/account/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const result = await Account.deleteOne({ userId: userId });
    if (result.deletedCount > 0) {
      res.status(200).send("Account deleted");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Error deleting account");
  }
});

// PUT: ইউজারের ব্যালেন্স আপডেট করার জন্য API
app.put("/account/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { balance } = req.body;

  try {
    const result = await Account.updateOne(
      { userId: userId },
      { $set: { balance: balance } }
    );

    if (result.matchedCount > 0) {
      res.status(200).send("Balance updated");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Error updating balance");
  }
});

// সার্ভার চালু করা
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
