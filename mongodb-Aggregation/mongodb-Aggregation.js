[
  { _id: 1, productId: 1, quantity: 2, price: 500, orderDate: "2024-09-25" },
  { _id: 2, productId: 2, quantity: 1, price: 1000, orderDate: "2024-09-26" },
  { _id: 3, productId: 1, quantity: 3, price: 500, orderDate: "2024-09-27" },
  { _id: 4, productId: 3, quantity: 1, price: 150, orderDate: "2024-09-28" },
][
  ({ _id: 1, name: "Laptop", category: "Electronics", price: 1000 },
  { _id: 2, name: "Phone", category: "Electronics", price: 500 },
  { _id: 3, name: "Chair", category: "Furniture", price: 150 })
];

db.orders.aggregate([
  // Step 1: $match - অর্ডারগুলোকে ফিল্টার করা, যেখানে quantity ১ এর চেয়ে বেশি।
  {
    $match: {
      quantity: { $gt: 1 },
    },
  },

  // Step 2: $lookup - Orders এবং Products collection এর মধ্যে যোগ করে প্রতিটি অর্ডারের পণ্যের বিস্তারিত তথ্য আনছে।
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "productDetails",
    },
  },

  // Step 3: $unwind - productDetails ফিল্ডটিকে আলাদা করে প্রতিটি প্রোডাক্ট ডেটা আলাদা ডকুমেন্টে ভেঙে ফেলা।
  {
    $unwind: "$productDetails",
  },

  // Step 4: $group - productId এর উপর ভিত্তি করে গ্রুপ করা হচ্ছে এবং total quantity এবং total sales বের করা হচ্ছে।
  {
    $group: {
      _id: "$productId",
      totalQuantity: { $sum: "$quantity" },
      totalSales: {
        $sum: { $multiply: ["$quantity", "$productDetails.price"] },
      },
    },
  },

  // Step 5: $project - শুধুমাত্র নির্দিষ্ট ফিল্ডগুলো দেখানো হচ্ছে (productId, totalQuantity, totalSales)।
  {
    $project: {
      productId: "$_id",
      totalQuantity: 1,
      totalSales: 1,
      _id: 0,
    },
  },

  // Step 6: $sort - totalSales এর উপর ভিত্তি করে সাজানো হচ্ছে।
  {
    $sort: {
      totalSales: -1,
    },
  },

  // Step 7: $limit - সর্বোচ্চ ২টি প্রোডাক্টের তথ্য দেখানো হচ্ছে।
  {
    $limit: 2,
  },

  // Step 8: $skip - প্রথম রেজাল্টটি বাদ দিয়ে পরের রেজাল্টগুলো দেখানো হচ্ছে।
  {
    $skip: 1,
  },

  // Step 9: $addFields - প্রতিটি পণ্যের গড় দাম দেখানো হচ্ছে (totalSales / totalQuantity)।
  {
    $addFields: {
      avgPricePerProduct: { $divide: ["$totalSales", "$totalQuantity"] },
    },
  },

  // Step 10: $count - মোট কতগুলো প্রোডাক্ট ফলাফল এসেছে তা গণনা করা হচ্ছে।
  {
    $count: "totalProducts",
  },
]);
