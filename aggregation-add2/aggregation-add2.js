const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  userId: { type: Number, required: true },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

// Create a new order (POST)
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all orders (GET)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.send(orders);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get orders with aggregation (GET)
router.get("/aggregated", async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalSales: { $sum: { $multiply: ["$quantity", "$price"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update an order (PUT)
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!order) {
      return res.status(404).send();
    }
    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete an order (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).send();
    }
    res.send(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;

// //////////////////////////////////////////////////////////

// Aggregated GET request for fetching grouped orders by category and sales
router.get("/aggregated", async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalSales: { $sum: { $multiply: ["$quantity", "$price"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ////////////////////////////////////////////

router.get("/category-sales", async (req, res) => {
  try {
    const result = await Order.aggregate([
      // Step 1: $lookup - Join with 'products' collection
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Step 2: $unwind - Deconstruct array of productDetails
      { $unwind: "$productDetails" },

      // Step 3: $match - Filter orders where quantity is greater than 1
      { $match: { quantity: { $gt: 1 } } },

      // Step 4: $group - Group by category and calculate total sales and quantity
      {
        $group: {
          _id: "$productDetails.category",
          totalSales: { $sum: { $multiply: ["$quantity", "$price"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },

      // Step 5: $sort - Sort by total sales in descending order
      { $sort: { totalSales: -1 } },

      // Step 6: $limit - Limit the results to the top 5 categories
      { $limit: 5 },

      // Step 7: $project - Select specific fields to show
      {
        $project: {
          category: "$_id",
          totalSales: 1,
          totalQuantity: 1,
          _id: 0,
        },
      },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

////////////////

router.get("/paginated-orders", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const result = await Order.aggregate([
      // Step 1: $match - Filter orders placed in 2023
      { $match: { orderDate: { $gte: new Date("2023-01-01") } } },

      // Step 2: $sort - Sort by order date
      { $sort: { orderDate: -1 } },

      // Step 3: $skip - Skip the records for pagination
      { $skip: skip },

      // Step 4: $limit - Limit the number of records per page
      { $limit: limit },

      // Step 5: $project - Select specific fields to return
      {
        $project: {
          orderId: 1,
          customerName: 1,
          orderDate: 1,
          totalAmount: { $multiply: ["$quantity", "$price"] },
          _id: 0,
        },
      },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});
// /////////////////////

router.get("/order-count", async (req, res) => {
  try {
    const result = await Order.aggregate([
      // Step 1: $match - Filter orders placed in 2023
      { $match: { orderDate: { $gte: new Date("2023-01-01") } } },

      // Step 2: $count - Count the total number of orders
      { $count: "totalOrders" },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});
/////////////////////////////////

router.get("/orders-with-discount", async (req, res) => {
  try {
    const result = await Order.aggregate([
      // Step 1: $addFields - Add a new field for discount price
      {
        $addFields: {
          discountPrice: {
            $cond: {
              if: { $gte: ["$quantity", 5] },
              then: { $multiply: ["$price", 0.9] },
              else: "$price",
            },
          },
        },
      },

      // Step 2: $project - Return the necessary fields including the discount price
      {
        $project: {
          orderId: 1,
          customerName: 1,
          quantity: 1,
          price: 1,
          discountPrice: 1,
          _id: 0,
        },
      },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

//       ////////////////////////

router.get("/product-category-count", async (req, res) => {
  try {
    const result = await Product.aggregate([
      // Step 1: $group - Group products by category and count
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
        },
      },

      // Step 2: $sort - Sort by product count
      { $sort: { productCount: -1 } },

      // Step 3: $project - Project necessary fields
      {
        $project: {
          category: "$_id",
          productCount: 1,
          _id: 0,
        },
      },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

//       //////////////////////////////////////////

router.get("/product-category-count", async (req, res) => {
  try {
    const result = await Product.aggregate([
      // ধাপ ১: $group - প্রোডাক্টগুলো ক্যাটেগরি অনুযায়ী গ্রুপ করা এবং প্রোডাক্টের সংখ্যা গণনা করা
      {
        $group: {
          _id: "$category", // এখানে ক্যাটেগরি অনুযায়ী প্রোডাক্টগুলো গ্রুপ করা হচ্ছে
          productCount: { $sum: 1 }, // প্রতিটি ক্যাটেগরিতে প্রোডাক্টের সংখ্যা যোগ করা হচ্ছে
        },
      },

      // ধাপ ২: $sort - প্রোডাক্টের সংখ্যা অনুযায়ী সাজানো
      { $sort: { productCount: -1 } }, // প্রোডাক্টের সংখ্যা কম থেকে বেশি বা বেশি থেকে কম করে সাজানো হচ্ছে

      // ধাপ ৩: $project - প্রয়োজনীয় ফিল্ডগুলো রিটার্ন করা
      {
        $project: {
          category: "$_id", // ক্যাটেগরি দেখানো হচ্ছে
          productCount: 1, // মোট প্রোডাক্টের সংখ্যা দেখানো হচ্ছে
          _id: 0, // `_id` ফিল্ড দেখানো হচ্ছে না
        },
      },
    ]);
    res.send(result); // রেজাল্ট ক্লায়েন্টকে পাঠানো হচ্ছে
  } catch (error) {
    res.status(500).send(error); // কোনো ত্রুটি ঘটলে তা 500 স্ট্যাটাস কোড সহ রিটার্ন করা হচ্ছে
  }
});
////////////////////////

router.get("/products-above-100", async (req, res) => {
  try {
    const result = await Product.aggregate([
      // ধাপ ১: $match - ফিল্টার করা হচ্ছে যেখানে প্রোডাক্টের দাম ১০০ টাকার বেশি
      { $match: { price: { $gt: 100 } } },
    ]);
    res.send(result); // রেজাল্ট ক্লায়েন্টকে পাঠানো হচ্ছে
  } catch (error) {
    res.status(500).send(error);
  }
});

////////////////////////////////

router.get("/product-category-count", async (req, res) => {
  try {
    const result = await Product.aggregate([
      // ধাপ ১: $group - প্রোডাক্টগুলো ক্যাটেগরি অনুযায়ী গ্রুপ করা এবং প্রোডাক্টের সংখ্যা গণনা করা
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
        },
      },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

////////////////////////////

router.get("/sorted-products", async (req, res) => {
  try {
    const result = await Product.aggregate([
      // ধাপ ১: $sort - প্রোডাক্টগুলোকে দামের ভিত্তিতে সাজানো
      { $sort: { price: -1 } }, // দাম অনুযায়ী ডেসেন্ডিং অর্ডারে সাজানো হচ্ছে
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

////////////////////////

router.get("/project-products", async (req, res) => {
  try {
    const result = await Product.aggregate([
      // ধাপ ১: $project - শুধু নাম এবং দাম ফিল্ড রিটার্ন করা
      {
        $project: {
          name: 1,
          price: 1,
          _id: 0, // _id ফিল্ড বাদ দেয়া হয়েছে
        },
      },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

////////////////////////

router.get("/limited-products", async (req, res) => {
  try {
    const result = await Product.aggregate([
      // ধাপ ১: $limit - সর্বোচ্চ ৫টি প্রোডাক্ট রিটার্ন করা
      { $limit: 5 },
    ]);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});
