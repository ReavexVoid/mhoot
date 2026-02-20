// ==================== MAHOOT BACKEND SERVER ====================
// Express server for user management and quiz system
// Persists all user data to data/users.json

import express from 'express';
import cors from 'cors';
import userManager from './usermanager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==================== AUTHENTICATION ENDPOINTS ====================

// POST /api/auth/register - Register a new user
app.post('/api/auth/register', (req, res) => {
    const { username, email, password, passwordConfirm } = req.body;

    // Validation
    if (password !== passwordConfirm) {
        return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    const result = userManager.register(username, email, password);
    
    if (result.success) {
        res.status(201).json(result);
    } else {
        res.status(400).json(result);
    }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const result = userManager.login(email, password);

    if (result.success) {
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

// ==================== USER ENDPOINTS ====================

// GET /api/users/:userId - Get user by ID
app.get('/api/users/:userId', (req, res) => {
    const result = userManager.getUser(parseInt(req.params.userId));

    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// GET /api/users/email/:email - Get user by email
app.get('/api/users/email/:email', (req, res) => {
    const result = userManager.getUserByEmail(req.params.email);

    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// PUT /api/users/:userId/stats - Update user stats
app.put('/api/users/:userId/stats', (req, res) => {
    const result = userManager.updateStats(parseInt(req.params.userId), req.body);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// POST /api/users/:userId/quiz - Add quiz to user
app.post('/api/users/:userId/quiz', (req, res) => {
    const { quizId } = req.body;
    const result = userManager.addQuiz(parseInt(req.params.userId), quizId);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// POST /api/users/:userId/gamehistory - Add game to user history
app.post('/api/users/:userId/gamehistory', (req, res) => {
    const result = userManager.addGameHistory(parseInt(req.params.userId), req.body);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// ==================== ADMIN ENDPOINTS ====================

// GET /api/admin/users - Get all users (admin)
app.get('/api/admin/users', (req, res) => {
    const users = userManager.getAllUsers();
    res.json({ success: true, users, count: users.length });
});

// DELETE /api/admin/users/:userId - Delete user (admin)
app.delete('/api/admin/users/:userId', (req, res) => {
    const result = userManager.deleteUser(parseInt(req.params.userId));

    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// POST /api/admin/reset - Clear all users (admin - use with caution)
app.post('/api/admin/reset', (req, res) => {
    const result = userManager.clearAllUsers();
    res.json(result);
});

// ==================== HEALTH CHECK ====================

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Mahoot Backend Server is running',
        timestamp: new Date().toISOString(),
        usersCount: userManager.users.length
    });
});

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🎮 MAHOOT BACKEND SERVER RUNNING 🎮  ║
╠════════════════════════════════════════╣
║  Server: http://localhost:${PORT}           ║
║  API Docs: http://localhost:${PORT}/api/health║
║  Frontend: http://localhost:${PORT}           ║
║  User Data: ./data/users.json           ║
╚════════════════════════════════════════╝
    `);
});
