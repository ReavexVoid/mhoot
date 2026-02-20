// ==================== USER MANAGER (Backend) ====================
// Handles all user-related operations and persists to users.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

class UserManager {
    constructor() {
        this.users = this.loadUsers();
    }

    // Load users from users.json
    loadUsers() {
        try {
            if (fs.existsSync(USERS_FILE)) {
                const data = fs.readFileSync(USERS_FILE, 'utf8');
                return data ? JSON.parse(data) : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    // Save users to users.json
    saveUsers() {
        try {
            fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    // Simple password hashing (same as frontend for compatibility)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Register a new user
    register(username, email, password) {
        // Validation
        if (!username || !email || !password) {
            return { success: false, error: 'All fields required' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        if (this.users.some(u => u.email === email)) {
            return { success: false, error: 'Email already registered' };
        }

        if (this.users.some(u => u.username === username)) {
            return { success: false, error: 'Username already taken' };
        }

        // Create user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            stats: {
                quizzesCreated: 0,
                gamesPlayed: 0,
                averageScore: 0,
                highScore: 0
            },
            createdAt: new Date().toISOString(),
            quizzes: [],
            gameHistory: []
        };

        this.users.push(newUser);
        this.saveUsers();

        return {
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                stats: newUser.stats
            }
        };
    }

    // Login user
    login(email, password) {
        const user = this.users.find(u => u.email === email);

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, error: 'Invalid password' };
        }

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                stats: user.stats
            }
        };
    }

    // Get user by ID
    getUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                stats: user.stats
            }
        };
    }

    // Get user by email
    getUserByEmail(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                stats: user.stats
            }
        };
    }

    // Update user stats
    updateStats(userId, stats) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        user.stats = { ...user.stats, ...stats };
        this.saveUsers();

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                stats: user.stats
            }
        };
    }

    // Add quiz to user
    addQuiz(userId, quizId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (!user.quizzes.includes(quizId)) {
            user.quizzes.push(quizId);
            user.stats.quizzesCreated = user.quizzes.length;
            this.saveUsers();
        }

        return { success: true };
    }

    // Add game to user history
    addGameHistory(userId, gameData) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        user.gameHistory.push({
            id: Date.now(),
            quizId: gameData.quizId,
            score: gameData.score,
            maxScore: gameData.maxScore,
            percentage: gameData.percentage,
            date: new Date().toISOString()
        });

        // Update stats
        const gamesPlayed = user.gameHistory.length;
        const totalScore = user.gameHistory.reduce((sum, game) => sum + game.percentage, 0);
        const averageScore = Math.round(totalScore / gamesPlayed);
        const highScore = Math.max(...user.gameHistory.map(g => g.percentage));

        user.stats.gamesPlayed = gamesPlayed;
        user.stats.averageScore = averageScore;
        user.stats.highScore = highScore;

        this.saveUsers();
        return { success: true };
    }

    // Get all users (admin only - limited info)
    getAllUsers() {
        return this.users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            stats: u.stats,
            createdAt: u.createdAt
        }));
    }

    // Delete user
    deleteUser(userId) {
        const index = this.users.findIndex(u => u.id === userId);
        if (index === -1) {
            return { success: false, error: 'User not found' };
        }

        this.users.splice(index, 1);
        this.saveUsers();
        return { success: true };
    }

    // Clear all users (useful for reset)
    clearAllUsers() {
        this.users = [];
        this.saveUsers();
        return { success: true };
    }
}

export default new UserManager();

