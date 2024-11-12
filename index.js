const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Create a connection to the MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'university'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Configure session 
const sessionStore = new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'university'
});

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));

// Check if user is authenticated and authorized
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        const role = req.session.user.role;
        const url = req.originalUrl;

        if (role === 'teacher' && url.startsWith('/private/teacher')) {
            return next();
        } else if (role === 'student' && url.startsWith('/private/student')) {
            return next();
        } else {
            // Redirect to the correct URL based on the role
            if (role === 'teacher') {
                res.redirect('/private/teacher/teacher_main_page.html');
            } else if (role === 'student') {
                res.redirect('/private/student/student_main_page.html');
            } else {
                res.redirect('/');
            }
        }
    } else {
        res.redirect('/');
    }
}

// Updated login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check teacher credentials
    db.query('SELECT * FROM teacher WHERE teacher_username = ? AND teacher_password = ?', [username, password], (err, teacherResults) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (teacherResults.length > 0) {
            req.session.user = { username: username, role: 'teacher' };
            res.redirect('/private/teacher/teacher_main_page.html');
        } else {
            // Check student credentials
            db.query('SELECT * FROM student WHERE student_username = ? AND student_password = ?', [username, password], (err, studentResults) => {
                if (err) {
                    console.error('Error executing query:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                if (studentResults.length > 0) {
                    req.session.user = { username: username, role: 'student' };
                    res.redirect('/private/student/student_main_page.html');
                } else {
                    res.status(401).send('Invalid username or password');
                }
            });
        }
    });
});

// Dynamic route handler for any HTML file inside private/teacher directory
app.get('/private/teacher/:filename', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, 'private/teacher', req.params.filename);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading ${req.params.filename}:`, err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

// Dynamic route handler for any HTML file inside private/student directory
app.get('/private/student/:filename', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, 'private/student', req.params.filename);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading ${req.params.filename}:`, err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

// Route handler for the main page
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'connection/main_page.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error reading main_page.html:', err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

// Route handler for the CSS file
app.get('/public/css/:filename', (req, res) => {
    const cssPath = path.join(__dirname, 'public/css', req.params.filename);
    fs.readFile(cssPath, (err, data) => {
        if (err) {
            console.error('Error reading CSS file:', err);
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found');
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.end(data);
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/');
    });
});

const server = http.createServer(app);

server.listen(8080, () => {
    console.log('Server is listening on http://localhost:8080');
});
