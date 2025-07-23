const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = 3000;
const PRODUCTS_FILE = path.join(__dirname, 'data/products.json');
const USERS_FILE = path.join(__dirname, 'data/users.json');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(PRODUCTS_FILE))) {
  fs.mkdirSync(path.dirname(PRODUCTS_FILE), { recursive: true });
}
if (!fs.existsSync(path.dirname(USERS_FILE))) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
}

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (MUST come before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret-key-here', // Change for production
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Data management functions
function loadProducts() {
  try {
    return fs.existsSync(PRODUCTS_FILE) ? 
      JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8')) : [];
  } catch (err) {
    console.error('Error loading products:', err);
    return [];
  }
}

function saveProducts(products) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Error saving products:', err);
  }
}

function loadUsers() {
  try {
    return fs.existsSync(USERS_FILE) ? 
      JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) : [];
  } catch (err) {
    console.error('Error loading users:', err);
    return [];
  }
}

// Authentication middleware
function authMiddleware(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.isLoggedIn = true;
    req.session.user = { username };
    req.session.save(err => {
      if (err) {
        return res.status(500).json({ message: 'Login failed' });
      }
      res.json({ message: 'Logged in successfully' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isLoggedIn) });
});

// Product routes
app.get('/api/products', (req, res) => {
  res.json(loadProducts());
});

app.post('/api/products', authMiddleware, upload.single('image'), (req, res) => {
  const { title, description, price, category } = req.body;
  if (!title || !description || !price || !category || !req.file) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const products = loadProducts();
  const newProduct = { 
    id: Date.now().toString(),
    title, 
    image: '/uploads/' + req.file.filename,
    description, 
    price: parseFloat(price).toFixed(2),
    category
  };
  
  products.push(newProduct);
  saveProducts(products);
  res.json({ message: 'Product added', product: newProduct });
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const products = loadProducts();
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  const [removed] = products.splice(index, 1);
  saveProducts(products);
  res.json({ message: 'Product deleted', product: removed });
});

// Static file routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-login.html'));
});

app.get('/admin-dashboard.html', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});