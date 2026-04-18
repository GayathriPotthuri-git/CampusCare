const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, body) {
  try {
    await transporter.sendMail({
      from: `"CampusCare" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: body
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error(`Email failed: ${err.message}`);
  }
}


const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static('public'));

// ─── Simple file-based "database" for users ──────────────────────────────────
// We use JSON files so you don't need to install anything extra.
// Later we can swap this for a real database easily.

const usersFile = path.join(__dirname, 'users.json');
const complaintsFile = path.join(__dirname, 'complaints.json');

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${file}:`, err.message);
    return false;
  }
}

// ─── Password hashing (no extra packages needed) ─────────────────────────────

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'campuscare_salt').digest('hex');
}

// ─── Simple token system ─────────────────────────────────────────────────────
// Stores active tokens in memory. Tokens expire after 24 hours.

const activeTokens = {};

function generateToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens[token] = {
    userId,
    createdAt: Date.now()
  };
  return token;
}

function getUserFromToken(token) {
  if (!token) return null;
  const entry = activeTokens[token];
  if (!entry) return null;

  // Expire after 24 hours
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (Date.now() - entry.createdAt > twentyFourHours) {
    delete activeTokens[token];
    return null;
  }

  const users = readJSON(usersFile);
  return users.find(u => u.id === entry.userId) || null;
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access only.' });
  }
  next();
}

// ─── Role detection from email ────────────────────────────────────────────────
// Customize these rules to match your college email format.
// e.g. 21cs001@college.edu = student, dr.smith@college.edu = faculty

function detectRole(email) {
  const local = email.split('@')[0].toLowerCase();
  if (/^\d/.test(local)) return 'student';
  if (local.startsWith('dr.') || local.startsWith('prof.')) return 'faculty';
  return 'student';
}

// ─── Authority contacts ───────────────────────────────────────────────────────

const authorities = {
  'plumbing': {
    name: 'Plumbing Department',
    head: 'Mr. Robert Martinez',
    contact: '+1 (555) 234-5670',
    email: 'r.martinez@college.edu',
    image: 'https://i.pravatar.cc/150?img=12',
    department: 'Facilities Management',
    experience: '15 years',
    availability: '24/7 Emergency Service'
  },
  'electrical': {
    name: 'Electrical Department',
    head: 'Ms. Sarah Johnson',
    contact: '+1 (555) 234-5671',
    email: 's.johnson@college.edu',
    image: 'https://i.pravatar.cc/150?img=47',
    department: 'Electrical Services',
    experience: '12 years',
    availability: 'Mon-Sat, 8AM-8PM'
  },
  'water': {
    name: 'Water Supply Department',
    head: 'Mr. David Chen',
    contact: '+1 (555) 234-5672',
    email: 'd.chen@college.edu',
    image: 'https://i.pravatar.cc/150?img=33',
    department: 'Water & Sanitation',
    experience: '18 years',
    availability: '24/7 Emergency Service'
  },
  'network': {
    name: 'IT Department',
    head: 'Dr. Emily Rodriguez',
    contact: '+1 (555) 234-5673',
    email: 'e.rodriguez@college.edu',
    image: 'https://i.pravatar.cc/150?img=45',
    department: 'Information Technology',
    experience: '10 years',
    availability: 'Mon-Fri, 9AM-6PM'
  },
  'maintenance': {
    name: 'General Maintenance',
    head: 'Mr. James Wilson',
    contact: '+1 (555) 234-5674',
    email: 'j.wilson@college.edu',
    image: 'https://i.pravatar.cc/150?img=15',
    department: 'Campus Maintenance',
    experience: '20 years',
    availability: 'Mon-Sun, 7AM-7PM'
  },
  'other': {
    name: 'Administration',
    head: 'Ms. Patricia Anderson',
    contact: '+1 (555) 234-5675',
    email: 'p.anderson@college.edu',
    image: 'https://i.pravatar.cc/150?img=44',
    department: 'General Administration',
    experience: '14 years',
    availability: 'Mon-Fri, 9AM-5PM'
  }
};

// ─── Create default admin account on first run ───────────────────────────────

function initAdminAccount() {
  const users = readJSON(usersFile);
  const adminExists = users.find(u => u.role === 'admin');
  if (!adminExists) {
    users.push({
      id: Date.now(),
      name: 'Admin',
      email: 'admin@college.edu',
      password: hashPassword('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    writeJSON(usersFile, users);
    console.log('─────────────────────────────────────────');
    console.log('Default admin account created:');
    console.log('  Email:    admin@college.edu');
    console.log('  Password: admin123');
    console.log('  (Change this password after first login!)');
    console.log('─────────────────────────────────────────');
  }
}

// ─── Google OAuth setup ───────────────────────────────────────────────────────
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const session = require('express-session');

app.use(session({ secret: 'campuscare_secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  const users = readJSON(usersFile);
  let user = users.find(u => u.googleId === profile.id || u.email === profile.emails[0].value);
  if (!user) {
    user = {
      id: Date.now(),
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      password: null,
      role: detectRole(profile.emails[0].value),
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeJSON(usersFile, users);
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const users = readJSON(usersFile);
  done(null, users.find(u => u.id === id) || false);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    const token = generateToken(req.user.id);
    const user = { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role };
    res.redirect(`/auth-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const users = readJSON(usersFile);
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  const newUser = {
    id: Date.now(),
    name,
    email: email.toLowerCase(),
    password: hashPassword(password),
    role: detectRole(email),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  if (!writeJSON(usersFile, users)) {
    return res.status(500).json({ success: false, message: 'Failed to create account.' });
  }

  const token = generateToken(newUser.id);

  console.log(`\n New signup: ${name} (${email}) — role: ${newUser.role}`);

  res.status(201).json({
    success: true,
    message: 'Account created successfully!',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const users = readJSON(usersFile);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
  }

  const token = generateToken(user.id);

  console.log(`\n Login: ${user.name} (${user.email}) — role: ${user.role}`);

  res.json({
    success: true,
    message: 'Logged in successfully!',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  delete activeTokens[token];
  res.json({ success: true, message: 'Logged out.' });
});

// Get current logged-in user
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// ─── COMPLAINT ROUTES ─────────────────────────────────────────────────────────

// Submit complaint (must be logged in)
app.post('/api/complaints', requireAuth, (req, res) => {
  const { category, location, description, reporterContact } = req.body;

  if (!category || !location || !description) {
    return res.status(400).json({ success: false, message: 'Category, location and description are required.' });
  }

  if (!authorities[category]) {
    return res.status(400).json({
      success: false,
      message: `Unknown category "${category}". Valid: ${Object.keys(authorities).join(', ')}.`
    });
  }

  const complaint = {
    id: Date.now(),
    category,
    location,
    description,
    reporterName: req.user.name,
    reporterEmail: req.user.email,
    reporterContact: reporterContact || '',
    reporterRole: req.user.role,
    status: 'pending',
    timestamp: new Date().toISOString(),
    assignedTo: authorities[category]
  };

  const complaints = readJSON(complaintsFile);
  complaints.push(complaint);

  if (!writeJSON(complaintsFile, complaints)) {
    return res.status(500).json({ success: false, message: 'Failed to save complaint.' });
  }

  console.log(`\n NEW COMPLAINT`);
  console.log(`─────────────────────────────────────────`);
  console.log(`Category:    ${category.toUpperCase()}`);
  console.log(`Location:    ${location}`);
  console.log(`Description: ${description}`);
  console.log(`Reporter:    ${req.user.name} (${req.user.email})`);
  console.log(`Assigned to: ${authorities[category].head}`);
  console.log(`─────────────────────────────────────────\n`);

  // Send email to authority
  const authority = authorities[category];
  const emailSubject = `[CampusCare] New ${category.toUpperCase()} Complaint Assigned`;
  const emailBody = `
    <h2 style="color:#667eea">New Complaint Assigned to You</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;font-weight:bold">Category</td><td style="padding:8px">${category.toUpperCase()}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Location</td><td style="padding:8px">${location}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Description</td><td style="padding:8px">${description}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Reporter</td><td style="padding:8px">${req.user.name} (${req.user.email})</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Submitted</td><td style="padding:8px">${new Date().toLocaleString()}</td></tr>
    </table>
    <p>Please login to the <a href="http://localhost:3000/dashboard.html">dashboard</a> to respond.</p>
    <p style="color:#999;font-size:12px">CampusCare - Campus Issue Reporting System</p>
  `;
  sendEmail(authority.email, emailSubject, emailBody);

  res.status(201).json({ success: true, complaint, message: 'Complaint submitted successfully!' });
});

// Get complaints — students/faculty see only their own, admins see all
app.get('/api/complaints', requireAuth, (req, res) => {
  const complaints = readJSON(complaintsFile);

  if (req.user.role === 'admin') {
    return res.json(complaints);
  }

  const mine = complaints.filter(c => c.reporterEmail === req.user.email);
  res.json(mine);
});

// Update complaint status (admin only)
app.patch('/api/complaints/:id', requireAuth, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  const validStatuses = ['pending', 'in-progress', 'resolved'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}.` });
  }

  const complaints = readJSON(complaintsFile);
  const complaint = complaints.find(c => c.id === id);

  if (!complaint) {
    return res.status(404).json({ success: false, message: 'Complaint not found.' });
  }

  complaint.status = status;
  complaint.updatedAt = new Date().toISOString();
  complaint.resolvedBy = req.user.name;

  if (!writeJSON(complaintsFile, complaints)) {
    return res.status(500).json({ success: false, message: 'Failed to update complaint.' });
  }

  res.json({ success: true, complaint });
});

// ─── OTHER ROUTES ─────────────────────────────────────────────────────────────

app.get('/api/authorities', (req, res) => {
  res.json(authorities);
});

app.get('/api/stats', requireAuth, (req, res) => {
  const complaints = readJSON(complaintsFile);

  const data = req.user.role === 'admin'
    ? complaints
    : complaints.filter(c => c.reporterEmail === req.user.email);

  const stats = {
    total: data.length,
    pending: data.filter(c => c.status === 'pending').length,
    inProgress: data.filter(c => c.status === 'in-progress').length,
    resolved: data.filter(c => c.status === 'resolved').length,
    byCategory: {},
    recentActivity: data.slice(-5).reverse()
  };

  Object.keys(authorities).forEach(cat => {
    stats.byCategory[cat] = data.filter(c => c.category === cat).length;
  });

  res.json(stats);
});

// ─── ANNOUNCEMENTS ROUTES ─────────────────────────────────────────────────────

const announcementsFile = path.join(__dirname, 'announcements.json');

// Get all announcements — public, no auth needed
app.get('/api/announcements', (req, res) => {
  const announcements = readJSON(announcementsFile);
  // Return newest first
  res.json([...announcements].reverse());
});

// Post announcement — admin only
app.post('/api/announcements', requireAuth, requireAdmin, (req, res) => {
  const { title, body, tag } = req.body;

  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'Title and body are required.' });
  }

  const validTags = ['General', 'Hostel', 'Sports', 'Academic', 'Club', 'Event'];
  const announcementTag = validTags.includes(tag) ? tag : 'General';

  const announcement = {
    id: Date.now(),
    title,
    body,
    tag: announcementTag,
    postedBy: req.user.name,
    timestamp: new Date().toISOString()
  };

  const announcements = readJSON(announcementsFile);
  announcements.push(announcement);

  if (!writeJSON(announcementsFile, announcements)) {
    return res.status(500).json({ success: false, message: 'Failed to save announcement.' });
  }

  console.log(`\n ANNOUNCEMENT POSTED: "${title}" [${announcementTag}] by ${req.user.name}`);
  res.status(201).json({ success: true, announcement });
});

// Delete announcement — admin only
app.delete('/api/announcements/:id', requireAuth, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const announcements = readJSON(announcementsFile);
  const index = announcements.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Announcement not found.' });
  }

  announcements.splice(index, 1);
  if (!writeJSON(announcementsFile, announcements)) {
    return res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
  }

  res.json({ success: true, message: 'Announcement deleted.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

initAdminAccount();

app.listen(PORT, () => {
  console.log(`\n CampusCare server running on http://localhost:${PORT}`);
  console.log(` Landing page: http://localhost:${PORT}/landing.html`);
  console.log(` Dashboard:    http://localhost:${PORT}/dashboard.html\n`);
});
