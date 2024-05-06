const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ExpensiveTrackerModel = require('./models/ExpensiveTracker');
const TransactionModel = require('./models/Transaction');
const GetTransaction = require('./models/GetTransactions');

const app = express();

app.use(
  compression({
    level: 6,
    threshold: 10 * 1000,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
);
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://tracker:tracker-123456@cluster0.ot5fa5d.mongodb.net/ExpensiveTracker");


// Endpoint to check database connection status
app.get('/check-db-connection', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    if (dbStatus === 1) {
        res.json({ message: 'Database connected successfully' });
    } else {
        res.status(500).json({ message: 'Failed to connect to database' });
    }
});


const JWT_SECRET = 'h7K#p5Z@u$9!a2Ys'

app.post('/register', (req, res) => {
    ExpensiveTrackerModel
        .create(req.body)
        .then(expensivetrackers => res.json(expensivetrackers))
        .catch(err => res.status(500).json({ message: 'Server Error' }));
});


// Endpoint to fetch all users
app.get('/users', async (req, res) => {
    try {
        // Fetch all user documents from the ExpensiveTracker collection
        const users = await ExpensiveTrackerModel.find();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Login route
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    ExpensiveTrackerModel
        .findOne({ email: email })
        .then(user => {
            if (user) {
                if (user.password === password) {
                    const expirationTime = Math.floor(Date.now() / 1000) + 60; 
                    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1m' });
                    res.json({ token, expirationTime, message: "Success" });
                } else {
                    res.json({ message: "Incorrect password" });
                }
            } else {
                res.json({ message: "User not found" });
            }
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        });
});



app.post("/updatetoken", (req, res) => {
    try {
        const expirationTime = Math.floor(Date.now() / 1000) + 60; 
        const token = jwt.sign({ id: req.body.userId }, JWT_SECRET, { expiresIn: '1m' });
        res.json({ token, expirationTime, message: "Success" });
    } catch (error) {
        console.error('Token generation failed:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});






app.post('/transactions', (req, res) => {
    TransactionModel
        .create(req.body)
        .then(transactions => res.json(transactions))
        .catch(err => res.status(500).json({ message: 'Server Error' }));
});

app.get('/get-transactions', async (req, res) => {
    try {
        const transactions = await GetTransaction.find();
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});



function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: "Unauthorized: Missing token" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Unauthorized: Invalid token" });
        req.userId = decoded.id;
        next();
    });
}

app.get('/protected-route', authenticateToken, (req, res) => {
    res.json({ message: 'Access granted' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
