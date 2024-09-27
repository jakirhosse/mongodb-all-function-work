const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB সংযোগ স্থাপন
mongoose
  .connect("mongodb://localhost:27017/advancedBookstore", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware
app.use(bodyParser.json());

// মডেল ডেফিনিশন
const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    publishedYear: { type: Number, required: true },
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", BookSchema);

// GET: সমস্ত বই এবং ডকুমেন্ট সংখ্যা নিয়ে আসা
app.get("/api/books", async (req, res) => {
  try {
    // পেজিনেশন (যদি প্রয়োজন হয়)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // সমস্ত বই নিয়ে আসা
    const books = await Book.find().skip(skip).limit(limit);

    // মোট ডকুমেন্ট সংখ্যা গণনা করা
    const totalBooks = await Book.countDocuments();

    res.status(200).json({
      totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
      books,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving books", error });
  }
});

// GET: নির্দিষ্ট ক্যাটেগরির বই এবং ডকুমেন্ট সংখ্যা নিয়ে আসা
app.get("/api/books/category/:category", async (req, res) => {
  const { category } = req.params;
  try {
    // পেজিনেশন (যদি প্রয়োজন হয়)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // নির্দিষ্ট ক্যাটেগরি ভিত্তিতে বই নিয়ে আসা
    const books = await Book.find({ category }).skip(skip).limit(limit);

    // নির্দিষ্ট ক্যাটেগরি ভিত্তিতে মোট ডকুমেন্ট সংখ্যা গণনা করা
    const totalBooks = await Book.countDocuments({ category });

    res.status(200).json({
      totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
      books,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving books by category", error });
  }
});

// POST: নতুন বই যোগ করা
app.post("/api/books", async (req, res) => {
  const { title, author, category, publishedYear } = req.body;

  try {
    const newBook = new Book({ title, author, category, publishedYear });
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ message: "Error adding book", error });
  }
});

// PUT: বিদ্যমান বই আপডেট করা
app.put("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, category, publishedYear } = req.body;

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { title, author, category, publishedYear },
      { new: true, runValidators: true }
    );
    if (updatedBook) {
      res.status(200).json(updatedBook);
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating book", error });
  }
});

// DELETE: একটি বই ডিলিট করা
app.delete("/api/books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBook = await Book.findByIdAndDelete(id);
    if (deletedBook) {
      res.status(200).json({ message: "Book deleted successfully" });
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting book", error });
  }
});

// and unnessary emample code ////

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    const count = await Book.countDocuments(); // ডকুমেন্ট সংখ্যা গণনা করা হচ্ছে
    res.status(200).json({ totalBooks: count, books: books });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving books", error });
  }
});

app.post("/api/books", async (req, res) => {
  const { title, author, category, publishedYear } = req.body;
  try {
    const newBook = new Book({ title, author, category, publishedYear });
    const savedBook = await newBook.save();

    // নতুন ডকুমেন্ট যোগ হওয়ার পরে ডকুমেন্ট সংখ্যা গণনা
    const count = await Book.countDocuments();

    res
      .status(201)
      .json({
        message: "Book added successfully",
        totalBooks: count,
        savedBook,
      });
  } catch (error) {
    res.status(500).json({ message: "Error adding book", error });
  }
});

// simple code example //////////

// মডেল ডেফিনিশন
const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  category: String,
  publishedYear: Number,
});

const Book = mongoose.model("Book", BookSchema);

// GET: সমস্ত বই নিয়ে আসা এবং মোট ডকুমেন্ট সংখ্যা গণনা করা
app.get("/api/books", async (req, res) => {
  try {
    // সমস্ত বই নিয়ে আসা
    const books = await Book.find();

    // মোট ডকুমেন্ট সংখ্যা গণনা করা
    const count = await Book.countDocuments();

    res.status(200).json({
      totalBooks: count,
      books: books,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving books", error });
  }
});

// POST: নতুন বই যোগ করা
app.post("/api/books", async (req, res) => {
  const { title, author, category, publishedYear } = req.body;

  try {
    const newBook = new Book({ title, author, category, publishedYear });
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ message: "Error adding book", error });
  }
});

// DELETE: একটি বই ডিলিট করা
app.delete("/api/books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBook = await Book.findByIdAndDelete(id);
    if (deletedBook) {
      res.status(200).json({ message: "Book deleted successfully" });
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting book", error });
  }
});

// সার্ভার শুরু করা
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
