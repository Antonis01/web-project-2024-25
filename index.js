const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');

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

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM teacher WHERE teacher_username = ? AND teacher_password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (results.length > 0) {
            res.redirect('/private/teacher/teacher_main_page.html');
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

app.get('/private/teacher/teacher_main_page.html', (req, res) => {
    const filePath = path.join(__dirname, 'private/teacher/teacher_main_page.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error reading teacher_main_page.html:', err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

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

const server = http.createServer(app);

server.listen(8080, () => {
    console.log('Server is listening on http://localhost:8080');
});
