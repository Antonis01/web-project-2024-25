const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const multer = require('multer');

const app = express();
app.use(bodyParser.json()); // Use bodyParser to parse JSON data

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create connection to the localhost database 
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

// Use the session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));

// Check if user is authenticated and authorized
function isAuthenticated(req, res, next) {
    const roleUrlMap = {
        teacher: '/private/teacher',
        student: '/private/student',
        secretary: '/private/secretary'
    };

    if (req.session.user) {
        const role = req.session.user.role;
        const url = req.originalUrl;
        
        if (roleUrlMap[role] && url.startsWith(roleUrlMap[role])) {
            return next();
        } else {
            res.redirect(roleUrlMap[role] ? `${roleUrlMap[role]}/${role}.html` : '/');
        }
    } else {
        res.redirect('/');
    }
}

// Updated login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const roles = [
        { table: 'Instructors', role: 'teacher', redirect: '/private/teacher/teacher.html' },
        { table: 'Students', role: 'student', redirect: '/private/student/student.html' },
        { table: 'Secretary', role: 'secretary', redirect: '/private/secretary/secretary.html' }
    ];

    const checkCredentials = (index) => {
        if (index >= roles.length) {
            res.status(401).json({ message: 'Invalid username or password' });
            return;
        }

        const { table, role, redirect } = roles[index];
        db.query(`SELECT * FROM ${table} WHERE ${role.toLowerCase()}_username = ? AND ${role.toLowerCase()}_password = ?`, [username, password], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }
            if (results.length > 0) {
                req.session.user = { username: username, role: role };
                console.log(`User ${username} logged in with role ${role} and session ID: ${req.sessionID}`);
                res.json({ redirect });
                // print the ajax response
                console.log(res);
            } else {
                checkCredentials(index + 1);
            }
        });
    };

    checkCredentials(0);
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
        console.log(req.params.filename);
        console.log(filePath);
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
        console.log(req.params.filename);
        console.log(filePath);
        res.end(data);
    });
});

// Dynamic route handler for any HTML file inside private/secretary directory
app.get('/private/secretary/:filename', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, 'private/secretary', req.params.filename);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading ${req.params.filename}:`, err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        console.log(req.params.filename);
        console.log(filePath);
        res.end(data);
    });
});

// Route handler for the main page
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public/main.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error reading main_page.html:', err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        console.log(filePath);
        res.end(data);
    });
});

app.post('/logout', (req, res) => {
    console.log(`User ${req.session.user.username} logged out with session ID: ${req.sessionID}`);
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }
        console.log('Session destroyed');
        res.json({ message: 'Logout successful', redirect: '/' });
        console.log(res);
    });
});

const upload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, 'uploads'));
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `file-${Date.now()}${ext}`);
        }
    })
});

app.post('/add-thesis', upload.single('file'), (req, res) => {
    const { title, description, instructor_id, student_id, final_submission_date } = req.body;
    const pdfPath = req.file ? `uploads/${req.file.filename}` : null; // Store the relative path
    const status = 'Υπό Ανάθεση'; // Default status

    // Insert thesis into Theses table
    const query = `
        INSERT INTO Theses (title, summary, pdf_path, status, instructor_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [title, description, pdfPath, status, instructor_id || null];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting thesis:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        res.json({ success: true, message: 'Thesis added successfully!' });
    });
});

app.post('/update-thesis', upload.single('file'), (req, res) => {
    const { thesis_id, title, description, instructor_id, student_id, final_submission_date, status } = req.body;
    const pdfPath = req.file ? `uploads/${req.file.filename}` : null;

    let query = `
        UPDATE Theses
        SET title = ?, summary = ?, status = ?, instructor_id = ?, student_id = ?, final_submission_date = ?
    `;
    const values = [title, description, status, instructor_id, student_id || null, final_submission_date || null];

    if (pdfPath) {
        query += `, pdf_path = ?`;
        values.push(pdfPath);
    }

    query += ` WHERE thesis_id = ?`;
    values.push(thesis_id);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating thesis:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        res.json({ success: true, message: 'Thesis updated successfully!' });
    });
});

app.get('/get-thesis/:id', (req, res) => {
    const query = 'SELECT * FROM Theses WHERE thesis_id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching thesis:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ success: false, message: 'Thesis not found' });
            return;
        }
        res.json({ success: true, data: results[0] });
    });
});

app.get('/get-theses', (req, res) => {
    const query = 'SELECT * FROM Theses';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching theses:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        res.json({ success: true, data: results });
    });
});

app.delete('/delete-thesis/:id', (req, res) => {
    const thesisId = req.params.id;
    const query = 'DELETE FROM Theses WHERE thesis_id = ?';

    db.query(query, [thesisId], (err, result) => {
        if (err) {
            console.error('Error deleting thesis:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Thesis not found' });
            return;
        }
        res.json({ success: true, message: 'Thesis deleted successfully!' });
    });
});

app.get("/search-student", (req, res) => {
    const { studentId } = req.query;
  
    const query = `
      SELECT student_name 
      FROM Students 
      WHERE am = ?
    `;
    db.query(query, [studentId], (err, results) => {
      if (err) {
        console.error("Error searching student:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
      }
  
      if (results.length > 0) {
        res.json({ success: true, data: results[0] });
      } else {
        res.json({ success: false, message: "Student not found." });
      }
    });
  });

app.get('/search-theses', (req, res) => {
    const statusFilter = req.query.status;
    const roleFilter = req.query.role;
    let query = `
        SELECT Theses.*, Committees.role 
        FROM Theses 
        LEFT JOIN Committees ON Theses.thesis_id = Committees.thesis_id 
        WHERE 1=1
    `;
    const queryParams = [];

    if (statusFilter && statusFilter !== 'Όλες') {
        query += ' AND Theses.status = ?';
        queryParams.push(statusFilter);
    }

    if (roleFilter && roleFilter !== 'all') {
        query += ' AND Committees.role = ?';
        queryParams.push(roleFilter);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error searching theses:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        res.json({ success: true, data: results });
    });
});

app.post("/assign-topic", (req, res) => {
    const { studentId, subject } = req.body;
  
    // Ελέγχει αν το θέμα υπάρχει και είναι διαθέσιμο
    const queryCheck = `
      SELECT thesis_id 
      FROM Theses 
      WHERE title = ? AND status = 'Υπό Ανάθεση'
    `;
    db.query(queryCheck, [subject], (err, results) => {
      if (err) {
        console.error("Error checking thesis:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: "Το θέμα δεν είναι διαθέσιμο." });
      }
  
      // Ανάθεση θέματος στον φοιτητή
      const thesisId = results[0].thesis_id;
      const queryAssign = `
        UPDATE Theses 
        SET status = 'Ενεργή', student_id = ? 
        WHERE thesis_id = ?
      `;
      db.query(queryAssign, [studentId, thesisId], (err) => {
        if (err) {
          console.error("Error assigning thesis:", err);
          return res.status(500).json({ message: "Internal Server Error" });
        }
  
        res.json({ message: "Το θέμα ανατέθηκε επιτυχώς στον φοιτητή." });
      });
    });
  });
const server = http.createServer(app);

server.listen(8080, () => {
    console.log('Server is listening on http://localhost:8080');
});
