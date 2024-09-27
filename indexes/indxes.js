const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

// MongoDB তে সংযোগ
mongoose
  .connect("mongodb://localhost:27017/ecommerce", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// পণ্য স্কিমা তৈরি
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ইনডেক্স তৈরি
productSchema.index({ name: 1 }); // নামের উপর ইনডেক্স (বৃদ্ধিমূলক)
productSchema.index({ category: 1, price: -1 }); // ক্যাটাগরি (বৃদ্ধিমূলক) এবং প্রাইজ (হ্রাসমূলক) এর উপর কম্পোজিট ইনডেক্স
productSchema.index({ title: 1 }); // টাইটেলের উপর ইনডেক্স (বৃদ্ধিমূলক)
productSchema.index({ createdAt: -1 }); // ক্রিয়েটেডএটের উপর ইনডেক্স (হ্রাসমূলক)

// মডেল তৈরি
const Product = mongoose.model("Product", productSchema);

// Middleware
app.use(express.json());

// POST: নতুন পণ্য যোগ করা
app.post("/products", async (req, res) => {
  const product = new Product(req.body);
  try {
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

// GET: সমস্ত পণ্য খুঁজে বের করা
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET: ক্যাটাগরি অনুযায়ী পণ্য খোঁজা
app.get("/products/category/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category }).sort({ price: -1 });
    res.send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

// PUT: পণ্য আপডেট করা
app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

// DELETE: পণ্য মুছা
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

// and advanced code is /////////////////

const express = require("express");
const mongoose = require("mongoose");
const Joi = require("joi");

// MongoDB তে সংযোগ
mongoose
  .connect("mongodb://localhost:27017/ecommerce", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// পণ্য স্কিমা তৈরি
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ইনডেক্স তৈরি
productSchema.index({ name: 1 }); // নামের উপর ইনডেক্স (বৃদ্ধিমূলক)
productSchema.index({ category: 1, price: -1 }); // ক্যাটাগরি এবং প্রাইজের উপর কম্পোজিট ইনডেক্স
productSchema.index({ title: 1 }); // টাইটেলের উপর ইনডেক্স
productSchema.index({ createdAt: -1 }); // ক্রিয়েটেডএটের উপর ইনডেক্স

// মডেল তৈরি
const Product = mongoose.model("Product", productSchema);

// Middleware
app.use(express.json());

// Joi স্কিমা তৈরি
const productSchemaValidation = Joi.object({
  name: Joi.string().required(),
  title: Joi.string().required(),
  category: Joi.string().required(),
  subcategory: Joi.string().required(),
  price: Joi.number().min(0).required(),
});

// POST: নতুন পণ্য যোগ করা
app.post("/products", async (req, res) => {
  const { error } = productSchemaValidation.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const product = new Product(req.body);
  try {
    await product.save();
    res.status(201).send(product);
  } catch (err) {
    res.status(500).send("Error saving product: " + err.message);
  }
});

// GET: সমস্ত পণ্য খুঁজে বের করা
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send("Error retrieving products: " + err.message);
  }
});

// GET: ক্যাটাগরি অনুযায়ী পণ্য খোঁজা
app.get("/products/category/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category }).sort({ price: -1 });
    res.send(products);
  } catch (err) {
    res.status(500).send("Error retrieving products: " + err.message);
  }
});

// PUT: পণ্য আপডেট করা
app.put("/products/:id", async (req, res) => {
  const { error } = productSchemaValidation.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).send("Product not found");
    res.send(product);
  } catch (err) {
    res.status(400).send("Error updating product: " + err.message);
  }
});

// DELETE: পণ্য মুছা
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).send("Product not found");
    res.send(product);
  } catch (err) {
    res.status(500).send("Error deleting product: " + err.message);
  }
});

// সার্ভার শুরু করা
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
