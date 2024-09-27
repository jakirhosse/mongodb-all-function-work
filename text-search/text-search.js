const mongoose = require("mongoose"); // Mongoose লাইব্রেরি আমদানি করা

// Schema তৈরি
const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
});

// টেক্সট ইনডেক্স তৈরি
articleSchema.index({ content: "text" });

const Article = mongoose.model("Article", articleSchema); // Model তৈরি

module.exports = Article; // Model রপ্তানি করা
const mongoose = require("mongoose"); // Mongoose লাইব্রেরি আমদানি করা

// ডাটা যুক্ত করা
const createArticles = async () => {
  await Article.deleteMany(); // পুরনো ডাটা মুছে ফেলা
  const articles = [
    { title: "MongoDB Basics", content: "MongoDB is a NoSQL database." },
    {
      title: "Introduction to Mongoose",
      content: "Mongoose is an ODM library for MongoDB.",
    },
    { title: "Node.js and MongoDB", content: "Using MongoDB with Node.js." },
  ];

  await Article.insertMany(articles); // নতুন ডাটা যুক্ত করা
  console.log("Articles created."); // বার্তা দেখানো
};

// টেক্সট সার্চ করা
const searchArticles = async (searchTerm) => {
  const results = await Article.find({ $text: { $search: searchTerm } }); // সার্চ
  console.log("Search Results:", results); // সার্চ ফলাফল দেখানো
};

// প্রধান ফাংশন
const main = async () => {
  await createArticles(); // ডাটা তৈরি করুন
  await searchArticles("MongoDB"); // 'MongoDB' শব্দটি সার্চ করুন
  mongoose.connection.close(); // সংযোগ বন্ধ করুন
};

// ফাংশন চালানো
main();

// and advanced code please ////////////////

// models/article.js

const mongoose = require("mongoose");

// একটি Schema তৈরি করা
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
});

// টেক্সট ইনডেক্স তৈরি করা
articleSchema.index({ content: "text" });

const Article = mongoose.model("Article", articleSchema); // Model তৈরি

module.exports = Article; // Model রপ্তানি করা

// app.js

const express = require("express"); // Express লাইব্রেরি আমদানি করা
const mongoose = require("mongoose"); // Mongoose লাইব্রেরি আমদানি করা
const Article = require("./models/article"); // Article মডেল আমদানি করা

const app = express();
const PORT = 3000;

// JSON রিকোয়েস্ট হ্যান্ডলিংয়ের জন্য Middleware
app.use(express.json());

// MongoDB এর সাথে সংযোগ
mongoose
  .connect("mongodb://localhost:27017/mydatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// POST: নতুন Article তৈরি করা
app.post("/articles", async (req, res) => {
  try {
    const article = new Article(req.body); // নতুন Article তৈরি করা
    await article.save(); // সংরক্ষণ করা
    res.status(201).json(article); // সফলভাবে সৃষ্ট Article ফেরত দেওয়া
  } catch (error) {
    res.status(400).json({ error: error.message }); // ত্রুটি হলে বার্তা ফেরত দেওয়া
  }
});

// GET: সকল Article পাওয়া
app.get("/articles", async (req, res) => {
  try {
    const articles = await Article.find(); // সকল Article পাওয়া
    res.status(200).json(articles); // Article গুলি ফেরত দেওয়া
  } catch (error) {
    res.status(500).json({ error: error.message }); // ত্রুটি হলে বার্তা ফেরত দেওয়া
  }
});

// GET: নির্দিষ্ট Article পাওয়া
app.get("/articles/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id); // নির্দিষ্ট Article পাওয়া
    if (!article) {
      return res.status(404).json({ message: "Article not found" }); // Article না পাওয়া গেলে
    }
    res.status(200).json(article); // Article ফেরত দেওয়া
  } catch (error) {
    res.status(500).json({ error: error.message }); // ত্রুটি হলে বার্তা ফেরত দেওয়া
  }
});

// PUT: Article আপডেট করা
app.put("/articles/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }); // Article আপডেট করা
    if (!article) {
      return res.status(404).json({ message: "Article not found" }); // Article না পাওয়া গেলে
    }
    res.status(200).json(article); // আপডেট করা Article ফেরত দেওয়া
  } catch (error) {
    res.status(400).json({ error: error.message }); // ত্রুটি হলে বার্তা ফেরত দেওয়া
  }
});

// DELETE: Article মুছে ফেলা
app.delete("/articles/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id); // Article মুছে ফেলা
    if (!article) {
      return res.status(404).json({ message: "Article not found" }); // Article না পাওয়া গেলে
    }
    res.status(204).send(); // সফলভাবে মুছে ফেলা হলে কিছু ফেরত দেওয়া হবে না
  } catch (error) {
    res.status(500).json({ error: error.message }); // ত্রুটি হলে বার্তা ফেরত দেওয়া
  }
});

// GET: টেক্সট সার্চ
app.get("/articles/search", async (req, res) => {
  const { query } = req.query; // সার্চ করার শব্দ পেতে
  try {
    const results = await Article.find({ $text: { $search: query } }); // টেক্সট সার্চ
    res.status(200).json(results); // সার্চ ফলাফল ফেরত দেওয়া
  } catch (error) {
    res.status(500).json({ error: error.message }); // ত্রুটি হলে বার্তা ফেরত দেওয়া
  }
});

// সার্ভার শুরু করা
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
