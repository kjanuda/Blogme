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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Define BlogPost schema to match frontend structure
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
}, {
  timestamps: true
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

// Routes
// GET all blog posts with optional category filter and pagination
app.get("/blog-posts", async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    
    // Build filter object
    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get posts with pagination
    const posts = await BlogPost.find(filter)
      .sort({ writeDate: -1 }) // Sort by date, newest first
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
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

// GET featured blog posts
app.get("/blog-posts/featured", async (req, res) => {
  try {
    const featuredPosts = await BlogPost.find({ featured: true })
      .sort({ writeDate: -1 })
      .limit(3);
    res.json(featuredPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET blog posts by category
app.get("/blog-posts/category/:category", async (req, res) => {
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

// GET single blog post
app.get("/blog-posts/:id", async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Blog post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE new blog post
app.post("/blog-posts", async (req, res) => {
  const newPost = new BlogPost(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE blog post
app.put("/blog-posts/:id", async (req, res) => {
  try {
    const updatedPost = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPost) return res.status(404).json({ message: "Blog post not found" });
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE blog post
app.delete("/blog-posts/:id", async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: "Blog post not found" });
    res.json({ message: "Blog post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET available categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await BlogPost.distinct("category");
    
    // Return categories in the same format as frontend
    const categoryList = [
      { id: 'all', name: 'All Topics', color: 'gray' },
      { id: 'healthcare', name: 'Healthcare IT', color: 'red' },
      { id: 'ai', name: 'Artificial Intelligence', color: 'purple' },
      { id: 'cloud', name: 'Cloud Infrastructure', color: 'cyan' },
      { id: 'security', name: 'Cybersecurity', color: 'orange' },
      { id: 'data', name: 'Data Analytics', color: 'green' },
      { id: 'quantum', name: 'Quantum Computing', color: 'indigo' }
    ].filter(cat => cat.id === 'all' || categories.includes(cat.id));
    
    res.json(categoryList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BULK INSERT sample data (for testing purposes)
app.post("/blog-posts/bulk", async (req, res) => {
  try {
    const samplePosts = [
      {
        title: "Transforming Healthcare IT: Key Insights and Digital Innovation Strategies",
        writeDate: "2025-09-18",
        category: "healthcare",
        author: "Dr. Sarah Chen",
        authorTitle: "Healthcare IT Director",
        readTime: "5 min read",
        description: "Discover the latest healthcare IT innovations and digital transformation strategies that are reshaping patient care delivery and operational efficiency in modern healthcare systems. Learn how leading organizations are implementing breakthrough solutions to improve patient outcomes and streamline operations.",
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop",
        moreInfoLink: "https://www.ibm.com/blog/healthcare-digital-transformation",
        tags: ["healthcare", "digital-transformation", "IT", "patient-care"],
        featured: true
      },
      {
        title: "The Future of AI-Powered Customer Experience: Trends and Implementation",
        writeDate: "2025-09-15",
        category: "ai",
        author: "Michael Rodriguez",
        authorTitle: "AI Research Lead",
        readTime: "7 min read",
        description: "Explore how artificial intelligence is revolutionizing customer experience across industries. Discover practical insights from IBM Watson implementations and learn about AI-driven solutions that deliver measurable business results and enhance customer satisfaction.",
        imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
        moreInfoLink: "https://www.ibm.com/blog/ai-customer-experience",
        tags: ["artificial-intelligence", "customer-experience", "watson", "AI"],
        featured: false
      },
      {
        title: "Cloud Infrastructure Modernization: Best Practices and Strategic Approaches",
        writeDate: "2025-09-12",
        category: "cloud",
        author: "Jennifer Park",
        authorTitle: "Cloud Solutions Architect",
        readTime: "8 min read",
        description: "Learn best practices for modernizing legacy infrastructure using IBM Cloud solutions. Explore hybrid cloud strategies, containerization technologies, and step-by-step guidance for successful cloud transformation that drives business agility and cost optimization.",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop",
        moreInfoLink: "https://www.ibm.com/blog/cloud-modernization",
        tags: ["cloud", "infrastructure", "modernization", "containers", "hybrid-cloud"],
        featured: true
      },
      {
        title: "Cybersecurity in the Age of Remote Work: Protecting Your Digital Assets",
        writeDate: "2025-09-10",
        category: "security",
        author: "David Kim",
        authorTitle: "Cybersecurity Specialist",
        readTime: "6 min read",
        description: "Navigate the complex cybersecurity landscape of remote work environments. Learn about advanced threat detection, zero-trust security models, and how IBM Security solutions help organizations maintain robust protection across distributed workforces.",
        imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop",
        moreInfoLink: "https://www.ibm.com/blog/cybersecurity-remote-work",
        tags: ["cybersecurity", "remote-work", "zero-trust", "threat-detection"],
        featured: false
      },
      {
        title: "Data Analytics Revolution: Unlocking Business Intelligence with IBM Watson",
        writeDate: "2025-09-08",
        category: "data",
        author: "Lisa Thompson",
        authorTitle: "Data Science Manager",
        readTime: "9 min read",
        description: "Harness the power of advanced data analytics to drive informed business decisions. Explore machine learning algorithms, predictive analytics, and real-time data processing capabilities that transform raw data into actionable business intelligence.",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
        moreInfoLink: "https://www.ibm.com/blog/data-analytics-watson",
        tags: ["data-analytics", "machine-learning", "business-intelligence", "watson"],
        featured: true
      },
      {
        title: "Quantum Computing Breakthroughs: The Next Frontier in Technology",
        writeDate: "2025-09-05",
        category: "quantum",
        author: "Dr. Robert Chen",
        authorTitle: "Quantum Research Director",
        readTime: "10 min read",
        description: "Discover the latest breakthroughs in quantum computing and their potential impact on industries ranging from finance to pharmaceuticals. Learn about quantum algorithms, error correction, and IBM's quantum roadmap for the next decade.",
        imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop",
        moreInfoLink: "https://www.ibm.com/blog/quantum-computing",
        tags: ["quantum-computing", "research", "algorithms", "technology"],
        featured: false
      }
    ];
    
    // Clear existing posts and insert sample data
    await BlogPost.deleteMany({});
    const insertedPosts = await BlogPost.insertMany(samplePosts);
    
    res.status(201).json({
      message: `${insertedPosts.length} blog posts inserted successfully`,
      posts: insertedPosts
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Search blog posts
app.get("/blog-posts/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    const searchFilter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { author: { $regex: query, $options: 'i' } }
      ]
    };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await BlogPost.find(searchFilter)
      .sort({ writeDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await BlogPost.countDocuments(searchFilter);
    
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));