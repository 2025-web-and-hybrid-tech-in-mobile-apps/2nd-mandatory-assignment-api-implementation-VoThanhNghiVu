const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json
app.use(bodyParser.json());

const SECRET_KEY = 'mysecretkey';

// Mock database
const users = new Map();
const highScores = [];

// Register new user
app.post('/signup', (req, res) => {
    const { userHandle, password } = req.body;
    if (typeof userHandle !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'UserHandle and password must be strings' });
    }
    if (!userHandle || userHandle.length < 6 || !password || password.length < 6) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (users.has(userHandle)) {
        users.delete(userHandle);
    } 
  
    users.set(userHandle, password);
    res.status(201).json({ message: 'User registered successfully' });
});

// Login user
app.post('/login', (req, res) => {
    const { userHandle, password, ...extraFields } = req.body;
    if (Object.keys(extraFields).length > 0) {
      return res.status(400).json({ error: 'Bad Request: Unexpected fields in request' });
    }
    if (!userHandle || !password) {
      return res.status(400).json({ error: 'Bad Request: Missing userHandle or password' });
    }
    if (typeof userHandle !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Bad Request: userHandle and password must be strings' });
    }
    if (!users.has(userHandle) || users.get(userHandle) !== password) {
        return res.status(401).json({ error: 'Unauthorized, incorrect username or password' });
    }
    const token = jwt.sign({ userHandle }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ jsonWebToken: token });
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized, token missing' });
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(401).json({ error: 'Unauthorized, invalid token' });
        req.user = user;
        next();
    });
};

// Post high score
app.post('/high-scores', authenticateToken, (req, res) => {
    const { level, userHandle, score, timestamp } = req.body;
    if (!level || !userHandle || !score || !timestamp) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (typeof score !== "number") {
      return res.status(400).json({ error: 'Score must be a number' });
    }
    highScores.push({ level, userHandle, score, timestamp });
    res.status(201).json({ message: 'High score posted successfully' });
});

// Get high scores with pagination
app.get('/high-scores', (req, res) => {  
    const { level, page = 1 } = req.query;
    if (!level) {
        return res.status(400).json({ error: 'Level is required' });
    }
    
    const sortedScores = highScores.filter(score => score.level === level)
        .sort((a, b) => b.score - a.score);
    
    const pageSize = 20;
    const paginatedScores = sortedScores.slice((page - 1) * pageSize, page * pageSize);
    
    res.status(200).json(paginatedScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
