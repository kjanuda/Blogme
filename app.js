const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Schema
const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  writeDate: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: String, required: true },
  authorTitle: { type: String, required: true },
  readTime: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  moreInfoLink: { type: String, required: true },
  tags: [String],
  featured: { type: Boolean, default: false }
}, { timestamps: true });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

// Routes
// All endpoints will now be under /api/posts

// GET all posts
app.get("/api/posts", async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    let filter = {};
    if (category && category !== "all") filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await BlogPost.find(filter)
      .sort({ writeDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BlogPost.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasNext: skip + posts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET featured
app.get("/api/posts/featured", async (req, res) => {
  try {
    const featuredPosts = await BlogPost.find({ featured: true })
      .sort({ writeDate: -1 })
      .limit(3);
    res.json(featuredPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET by category
app.get("/api/posts/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await BlogPost.find({ category })
      .sort({ writeDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BlogPost.countDocuments({ category });

    res.json({
      posts,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasNext: skip + posts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single post
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE
app.post("/api/posts", async (req, res) => {
  try {
    const newPost = new BlogPost(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE
app.put("/api/posts/:id", async (req, res) => {
  try {
    const updatedPost = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPost) return res.status(404).json({ message: "Post not found" });
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BULK sample data
app.post("/api/posts/bulk", async (req, res) => {
  try {
    await BlogPost.deleteMany({});
    const insertedPosts = await BlogPost.insertMany(req.body);
    res.status(201).json({ message: `${insertedPosts.length} posts inserted`, posts: insertedPosts });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// SEARCH
app.get("/api/posts/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
        { author: { $regex: query, $options: "i" } }
      ]
    };

    const posts = await BlogPost.find(filter)
      .sort({ writeDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BlogPost.countDocuments(filter);

    res.json({
      posts,
      query,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasNext: skip + posts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
