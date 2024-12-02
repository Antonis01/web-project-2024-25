/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------Node.js Server----------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

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

// Use bodyParser to parse JSON data
app.use(bodyParser.json()); 

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
---------------------------------Database Connection --------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

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

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
------------------------------Login and Authentication-------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

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

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const roles = [
        { table: 'Teachers', role: 'teacher', redirect: '/private/teacher/teacher.html' },
        { table: 'Students', role: 'student', redirect: '/private/student/student.html' },
        { table: 'Secretary', role: 'secretary', redirect: '/private/secretary/secretary.html' }
    ];

    const checkCredentials = (index) => {
        if (index >= roles.length) {
            res.status(401).json({ message: 'Invalid username or password' });
            return;
        }

        const { table, role, redirect } = roles[index];
        db.query(`SELECT * FROM ${table} WHERE ${role.toLowerCase()}_username = ? AND 
        ${role.toLowerCase()}_password = ?`, [username, password], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }
            if (results.length > 0) {
                req.session.user = { username: username, role: role, teacher_am: results[0].teacher_am };
                console.log(`User ${username} logged in with role ${role} and session ID: ${req.sessionID}`);
                res.json({ redirect });
                console.log(res);
            } else {
                checkCredentials(index + 1);
            }
        });
    };

    checkCredentials(0);
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

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
------------------------------------Middleware Functions-----------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

// Middleware function to get the teacher id from the session
// It's used in the /search-theses get request
function getTeacherId(req, res, next) {
    const username = req.session.user.username;
    const query = 'SELECT teacher_am FROM Teachers WHERE teacher_username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching teacher id:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        req.teacherId = results[0].teacher_am;
        next();
    });
}

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------Route Handlers----------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

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

// Dynamic route handler for the private/teacher directory
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

// Dynamic route handler for the private/student directory
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

// Dynamic route handler for the private/secretary directory
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

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------Get Requests------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

// Route handler for assigning a thesis to a student
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

// Route handler for getting all theses
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

// Route handler for searching students
app.get("/search-student", (req, res) => {
    const { am, studentName } = req.query;
    let query = '';
    let queryParams = [];

    if (am) {
        query = 'SELECT student_am FROM Students WHERE student_am LIKE ?';
        queryParams = [`%${am}%`];
    } else if (studentName) {
        query = 'SELECT student_name, student_am FROM Students WHERE student_name LIKE ?';
        queryParams = [`%${studentName}%`];
    } else {
        res.status(400).json({ success: false, message: 'Missing search parameter' });
        return;
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error("Error searching student:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, data: results });
    });
});

// Searching theses by the logged in teacher
app.get('/search-theses', getTeacherId, (req, res) => {
    const statusFilter = req.query.status;
    const roleFilter = req.query.role;
    const teacherId = req.teacherId;
    let query = `
        SELECT Theses.*, 
               t1.teacher_name AS teacher_name, Committees.role,
               t2.teacher_name AS teacher2_name, Committees.role2,
               t3.teacher_name AS teacher3_name, Committees.role3,
               Students.student_am AS student_am
        FROM Theses 
        LEFT JOIN Committees ON Theses.thesis_id = Committees.thesis_id 
        LEFT JOIN Teachers t1 ON Committees.teacher_am = t1.teacher_am
        LEFT JOIN Teachers t2 ON Committees.teacher_am2 = t2.teacher_am
        LEFT JOIN Teachers t3 ON Committees.teacher_am3 = t3.teacher_am
        LEFT JOIN Students ON Theses.student_am = Students.student_am
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

    if (teacherId) {
        query += ' AND Committees.teacher_am = ?';
        queryParams.push(teacherId);
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

// Route handler for getting the theses title
app.get("/get-theses-title", (req, res) => {
    const { subject } = req.query;
    if (!subject) {
        res.status(400).json({ success: false, message: 'Missing search parameter' });
        return;
    }

    const query = 'SELECT title FROM Theses WHERE title LIKE ?';
    const queryParams = [`%${subject}%`];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error("Error searching thesis:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, data: results });
    });
});

// Route handler for exporting theses
app.get('/export-theses', (req, res) => {
    const statusFilter = req.query.status;
    const roleFilter = req.query.role;
    const format = req.query.format;

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
            console.error('Error exporting theses:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }

        if (format === 'csv') {
            const csv = results.map(row => Object.values(row).join(',')).join('\n');
            res.header('Content-Type', 'text/csv');
            res.attachment('theses.csv');
            res.send(csv);
        } else if (format === 'json') {
            res.header('Content-Type', 'application/json');
            res.attachment('theses.json');
            res.send(JSON.stringify(results));
        } else {
            res.status(400).json({ success: false, message: 'Invalid format' });
        }
    });
});

// Route handler for fetching active theses
app.get('/active-theses', (req, res) => {
    const query = `
        SELECT thesis_id, title 
        FROM Theses 
        WHERE status = 'Ενεργή'
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching active theses:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        //console.log('Active theses results:', results);
        res.json({ success: true, data: results });
    });
});


// Route handler for fetching active invitations
app.get('/active-invitations', (req, res) => {
    const query = `
        SELECT committee_id, thesis_id, role, response 
        FROM Committees 
        WHERE response IS NULL
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching active invitations:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        //console.log('Active invitations results:', results);
        res.json({ success: true, data: results });
    });
});

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------Post Requests-----------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

// Route handler for the add-thesis form
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

// Route handler for the add-thesis form
app.post('/add-thesis', upload.single('file'), (req, res) => {
    const { title, description } = req.body;
    const pdfPath = req.file ? `uploads/${req.file.filename}` : null; // Store the relative path
    const status = 'Υπό Ανάθεση'; // Default status
    const teacher_am = req.session.user.teacher_am;
    console.log("teeeeeestttt");
    console.log(teacher_am);
    console.log(req.session.user.teacher_am);
    console.log("tesssssssssssssst");
    const query = `
        INSERT INTO Theses (title, summary, pdf_path, status, teacher_am)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [title, description, pdfPath, status, teacher_am || null];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting thesis:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }

        const query2 = `
            INSERT INTO Committees (thesis_id, teacher_am, role)
            VALUES (LAST_INSERT_ID(), ?, 'Επιβλέπων')
        `;

        db.query(query2, [teacher_am], (err) => {
            if (err) {
                console.error('Error inserting committee:', err);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
                return;
            }
        });
        res.json({ success: true, message: 'Thesis added successfully!' });
    });
});

// Route handler for updating a thesis
// We use let instead of const because we will be appending to the query string
// Route handler for updating a thesis
app.post('/update-thesis', upload.single('file'), (req, res) => {
    const { thesis_id, title, description, teacher_am, student_am, final_submission_date, status } = req.body;
    const pdfPath = req.file ? `uploads/${req.file.filename}` : null;

    let query = `
        UPDATE Theses
        SET title = ?, summary = ?, status = ?, teacher_am = ?, 
        student_am = ?, final_submission_date = ?
    `;
    const values = [title, description, status, teacher_am, student_am || null, final_submission_date || null];

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

        const query2 = `
            UPDATE Committees
            SET teacher_am = ?
            WHERE thesis_id = ? AND role = 'Επιβλέπων'
        `;
        db.query(query2, [teacher_am, thesis_id], (err) => {
            if (err) {
                console.error('Error updating committee:', err);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
                return;
            }
            res.json({ success: true, message: 'Theses and Committee updated successfully!' });
        });
    });
});

// Route handler for assigning a thesis to a student
app.post("/assign-topic", (req, res) => {
    const { am, subject } = req.body;

    if (!am || !subject) {
        res.status(400).json({ success: false, message: 'Missing student AM or subject' });
        return;
    }

    // Check if the student AM exists in the students table and get the student_id
    const checkStudentQuery = 'SELECT student_am FROM Students WHERE student_am = ?';
    db.query(checkStudentQuery, [am], (err, studentResults) => {
        if (err) {
            console.error("Error checking student:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        if (studentResults.length === 0) {
            return res.status(400).json({ success: false, message: 'Student AM does not exist' });
        }

        const studentAM = studentResults[0].student_am;

        // Check if the thesis is available
        const queryCheck = `
            SELECT thesis_id 
            FROM Theses 
            WHERE title = ? AND status = 'Υπό Ανάθεση'
        `;
        db.query(queryCheck, [subject], (err, thesisResults) => {
            if (err) {
                console.error("Error checking thesis:", err);
                return res.status(500).json({ success: false, message: "Internal Server Error" });
            }

            if (thesisResults.length === 0) {
                return res.status(404).json({ success: false, message: "Το θέμα δεν είναι διαθέσιμο." });
            }

            const thesisId = thesisResults[0].thesis_id;
            
            const queryAssign = `
                UPDATE Theses 
                SET status = 'Ενεργή', student_am = ? 
                WHERE thesis_id = ?
            `;
            db.query(queryAssign, [studentAM, thesisId], (err) => {
                if (err) {
                    console.error("Error assigning thesis:", err);
                    return res.status(500).json({ success: false, message: "Internal Server Error" });
                }

                const queryAssignments = `
                    INSERT INTO Assignments (student_am, thesis_id) 
                    VALUES (?, ?)
                `;

                db.query(queryAssignments, [studentAM, thesisId], (err) => {
                    if (err) {
                        console.error("Error inserting assignment:", err);
                        return res.status(500).json({ success: false, message: "Internal Server Error" });
                    }
                });

                res.json({ success: true, message: "Το θέμα ανατέθηκε επιτυχώς στον φοιτητή." });
            });
        });
    });
});

// Route handler for cancelling an assignment
app.post('/cancel-assignment/:id', (req, res) => {
    const thesisId = req.params.id;
    const query = `
        UPDATE Theses 
        SET status = 'Ακυρωμένη', student_id = NULL 
        WHERE thesis_id = ?
    `;
    db.query(query, [thesisId], (err) => {
        if (err) {
            console.error("Error cancelling assignment:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, message: "Assignment cancelled successfully!" });
    });
});

// Route handler for accepting an invitation
app.post('/accept-invitation/:id', (req, res) => {
    const committeeId = req.params.id;
    const query = `
        UPDATE Committees 
        SET response = 'Αποδοχή', response_date = NOW() 
        WHERE committee_id = ?
    `;
    db.query(query, [committeeId], (err) => {
        if (err) {
            console.error("Error accepting invitation:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, message: "Invitation accepted successfully!" });
    });
});

// Route handler for rejecting an invitation
app.post('/reject-invitation/:id', (req, res) => {
    const committeeId = req.params.id;
    const query = `
        UPDATE Committees 
        SET response = 'Απόρριψη', response_date = NOW() 
        WHERE committee_id = ?
    `;
    db.query(query, [committeeId], (err) => {
        if (err) {
            console.error("Error rejecting invitation:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        res.json({ success: true, message: "Invitation rejected successfully!" });
    });
});

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------Delete Requests---------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

// Delete the theses 
app.delete('/delete-thesis/:id', (req, res) => {
    const thesisId = req.params.id;

    // Delete from Assignments table
    const query1 = 'DELETE FROM Assignments WHERE thesis_id = ?';
    db.query(query1, [thesisId], (err, result) => {
        if (err) {
            console.error('Error deleting assignments:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }

        // Delete from Committees table
        const query2 = 'DELETE FROM Committees WHERE thesis_id = ?';
        db.query(query2, [thesisId], (err, result) => {
            if (err) {
                console.error('Error deleting committees:', err);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
                return;
            }

            // Delete from Theses table
            const query3 = 'DELETE FROM Theses WHERE thesis_id = ?';
            db.query(query3, [thesisId], (err, result) => {
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
    });
});

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------Server Listening--------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

const server = http.createServer(app);

server.listen(8080, () => {
    console.log('Server is listening on http://localhost:8080');
});
