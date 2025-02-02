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
const { Parser } = require('json2csv');
const xml2js = require('xml2js');
const fileUpload = require('express-fileupload');
const { format } = require('date-fns');

const app = express();

// Use bodyParser to parse JSON data
app.use(bodyParser.json()); 

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());

app.use(fileUpload());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


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
            res.status(401).json({ message: 'Λανθασμένο username ή Κωδικός' });
            return;
        }

        const { table, role, redirect } = roles[index];
        db.query(`SELECT *, ${role}_am FROM ${table} WHERE ${role.toLowerCase()}_username = ? AND ${role.toLowerCase()}_password = ?`, [username, password], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }
            if (results.length > 0) {
                req.session.user = { username: username, role: role, am: results[0][`${role.toLowerCase()}_am`] };
                console.log(`User ${username} logged in with role ${role} and session ID: ${req.sessionID} and session am: ${req.session.user.am}`);
                res.json({ redirect });
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

// Middleware function to update the thesis status
// to 'Ενεργή' if all committee members have accepted
function checkAndUpdateThesisStatus(thesis_id) {
    const query = `
        SELECT response2, response3
        FROM Committees
        WHERE thesis_id = ?
    `;

    db.query(query, [thesis_id], (err, results) => {
        if (err) {
            console.error('Error checking committee responses:', err);
            return;
        }

        if (results.length > 0) {
            const { response2, response3 } = results[0];

            if (response2 === 'Αποδοχή' && response3 === 'Αποδοχή') {
                const updateQuery = `
                    UPDATE Theses
                    SET status = 'Ενεργή'
                    WHERE thesis_id = ? AND status = 'Υπό Ανάθεση'
                `;

                db.query(updateQuery, [thesis_id], (err) => {
                    if (err) {
                        console.error('Error updating thesis status:', err);
                    } 

                    const updateQuery2 = `
                        UPDATE Assignments
                        SET status = 'Οριστική'
                        WHERE thesis_id = ? AND status = 'Προσωρινή'
                    `;

                    db.query(updateQuery2, [thesis_id], (err) => {
                        if (err) {
                            console.error('Σφάλμα κατά την ενημέρωση:', err);
                        }
                    });
                });
            }
        }
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

app.get('/get-thesis/:id', (req, res) => {
    const query = 'SELECT * FROM Theses WHERE thesis_id = ?';
    console.log("get-thesis test111111111111111111111111111111");
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

// Route handler for fetching theses by partial title
app.get('/search-theses/:title', (req, res) => {
    const query = 'SELECT * FROM Theses WHERE title LIKE ? AND student_am IS NULL';
    const searchTerm = `%${req.params.title}%`;
    console.log("Searching theses with title like:", searchTerm);
    db.query(query, [searchTerm], (err, results) => {
        if (err) {
            console.error('Error searching theses:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ success: false, message: 'Δεν βρέθηκαν διπλωματικές' });
            return;
        }
        res.json({ success: true, data: results });
    });
});

app.get('/get-theses', (req, res) => {
    const statusFilter = req.query.status;
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let query = `
        SELECT Theses.*, 
               t1.teacher_name AS teacher_name, Committees.role,
               t2.teacher_name AS teacher2_name, Committees.role2,
               t3.teacher_name AS teacher3_name, Committees.role3,
               Committees.invitation_date, Committees.response, Committees.response_date,
               Committees.invitation_date2, Committees.response2, Committees.response_date2,
               Committees.invitation_date3, Committees.response3, Committees.response_date3
        FROM Theses 
        LEFT JOIN Committees ON Theses.thesis_id = Committees.thesis_id 
        LEFT JOIN Teachers t1 ON Committees.teacher_am = t1.teacher_am
        LEFT JOIN Teachers t2 ON Committees.teacher_am2 = t2.teacher_am
        LEFT JOIN Teachers t3 ON Committees.teacher_am3 = t3.teacher_am
        WHERE 1
    `;
    const queryParams = [];

    if (statusFilter && statusFilter !== 'Όλες') {
        query += ' AND Theses.status = ?';
        queryParams.push(statusFilter);
    } else {
        query += ' AND Theses.teacher_am = ?';
        queryParams.push(teacherAM);
    }

    if (statusFilter && statusFilter === 'Υπό Ανάθεση') {
        query += ' AND (Committees.teacher_am = ? OR Committees.teacher_am2 = ? OR Committees.teacher_am3 = ?)';
        queryParams.push(teacherAM, teacherAM, teacherAM);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching theses:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα' });
        }

        const theses = results.map(thesis => {
            return {
                ...thesis,
                committee: [
                    {
                        teacher_name: thesis.teacher_name,
                        teacher_am: thesis.teacher_am,
                        role: thesis.role,
                        invitation_date: thesis.invitation_date,
                        response: thesis.response,
                        response_date: thesis.response_date
                    },
                    {
                        teacher_name: thesis.teacher2_name,
                        teacher_am: thesis.teacher_am2,
                        role: thesis.role2,
                        invitation_date: thesis.invitation_date2,
                        response: thesis.response2,
                        response_date: thesis.response_date2
                    },
                    {
                        teacher_name: thesis.teacher3_name,
                        teacher_am: thesis.teacher_am3,
                        role: thesis.role3,
                        invitation_date: thesis.invitation_date3,
                        response: thesis.response3,
                        response_date: thesis.response_date3
                    }
                ]
            };
        });

        res.json({ success: true, data: theses, teacher_am: teacherAM });
    });
});

// Route handler for searching students
app.get("/search-student", (req, res) => {
    const { am, studentName } = req.query;
    let query = '';
    let queryParams = [];

    if (am) {
        query = `
            SELECT s.student_name, s.student_am 
            FROM Students s 
            LEFT JOIN Theses t ON s.student_am = t.student_am 
            WHERE s.student_am LIKE ? AND t.student_am IS NULL`;
        queryParams = [`%${am}%`];
    } else if (studentName) {
        query = `
            SELECT s.student_name, s.student_am 
            FROM Students s 
            LEFT JOIN Theses t ON s.student_am = t.student_am 
            WHERE s.student_name LIKE ? AND t.student_am IS NULL`;
        queryParams = [`%${studentName}%`];
    } else {
        res.status(400).json({ success: false, message: 'Missing search parameter' });
        return;
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error("Error searching student:", err);
            return res.status(500).json({ success: false, message: "Σφάλμα" });
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

    if (roleFilter && roleFilter !== 'all') {
        query += ` AND ((Committees.role = ? AND Committees.teacher_am = ?) OR (Committees.role2 = ? AND Committees.teacher_am2 = ?) OR (Committees.role3 = ? AND Committees.teacher_am3 = ?))`;
        queryParams.push(roleFilter, teacherId, roleFilter, teacherId, roleFilter, teacherId);
    } else {
        query += ` AND (Committees.teacher_am = ? OR Committees.teacher_am2 = ? OR Committees.teacher_am3 = ?)`;
        queryParams.push(teacherId, teacherId, teacherId);
    }

    if (statusFilter && statusFilter !== 'all') {
        query += ' AND Theses.status = ?';
        queryParams.push(statusFilter);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error searching theses:', err);
            res.status(500).json({ success: false, message: 'Σφάλμα' });
            return;
        }
        res.json({ success: true, data: results });
    });
});

// Export theses to CSV or JSON
app.get('/export-theses', getTeacherId, (req, res) => {
    const statusFilter = req.query.status;
    const roleFilter = req.query.role;
    const format = req.query.format;
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

    if (roleFilter && roleFilter !== 'all') {
        query += ` AND ((Committees.role = ? AND Committees.teacher_am = ?) OR (Committees.role2 = ? AND Committees.teacher_am2 = ?) OR (Committees.role3 = ? AND Committees.teacher_am3 = ?))`;
        queryParams.push(roleFilter, teacherId, roleFilter, teacherId, roleFilter, teacherId);
    } else {
        query += ` AND (Committees.teacher_am = ? OR Committees.teacher_am2 = ? OR Committees.teacher_am3 = ?)`;
        queryParams.push(teacherId, teacherId, teacherId);
    }

    if (statusFilter && statusFilter !== 'all') {
        query += ' AND Theses.status = ?';
        queryParams.push(statusFilter);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error exporting theses:', err);
            res.status(500).json({ success: false, message: 'Σφάλμα' });
            return;
        }

        if (format === 'csv') {
            // Convert results to CSV using json2csv
            const fields = ['thesis_id', 'title', 'summary', 'status', 'teacher_name', 'role', 'teacher2_name', 'role2', 'teacher3_name', 'role3', 'student_am'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(results);

            // Set headers for CSV file download
            res.header('Content-Type', 'text/csv');
            res.attachment('theses.csv');
            res.send(csv);
        } else if (format === 'json') {
            // Send JSON response
            res.header('Content-Type', 'application/json');
            res.attachment('theses.json');
            res.send(JSON.stringify(results, null, 2));
        } else {
            res.status(400).json({ success: false, message: 'Μη Έγκυρο format' });
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
            return res.status(500).json({ success: false, message: "Σφάλμα" });
        }

    
        res.json({ success: true, data: results });
    });
});

app.get('/get-invitations', (req, res) => {
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        console.error('Teacher AM not found in session');
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
    SELECT c.committee_id, c.role2, c.response2, c.invitation_date2, t.title AS thesisTitle,
           c.role3, c.response3, c.invitation_date3, c.teacher_am2 as teacherAM2, c.teacher_am3 as teacherAM3
    FROM Committees AS c
    JOIN Theses AS t ON c.thesis_id = t.thesis_id
    WHERE (c.teacher_am2 = ? AND c.response2 IS NULL)
       OR (c.teacher_am3 = ? AND c.response3 IS NULL)
`;

    db.query(query, [teacherAM, teacherAM], (err, results) => {
        if (err) {
            console.error('Error fetching invitations:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        res.json({ success: true, data: results });
    });
});

app.get('/get-thesis-st', (req, res) => {
    const studentAm = req.session.user.am; 
    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
        SELECT 
            t.title, 
            t.summary, 
            t.status, 
            t.pdf_path, 
            t.final_submission_date,
            t1.teacher_name AS teacher_name,
            t2.teacher_name AS teacher_name2,
            t3.teacher_name AS teacher_name3,
            DATEDIFF(CURRENT_DATE, a.assigned_date) AS days_since_assignment
        FROM Theses t
        LEFT JOIN Committees c ON t.thesis_id = c.thesis_id
        LEFT JOIN Teachers t1 ON c.teacher_am = t1.teacher_am
        LEFT JOIN Teachers t2 ON c.teacher_am2 = t2.teacher_am
        LEFT JOIN Teachers t3 ON c.teacher_am3 = t3.teacher_am
        LEFT JOIN Assignments a ON t.thesis_id = a.thesis_id
        WHERE t.student_am = ? AND t.status != 'Ακυρωμένη'
    `;

    db.query(query, [studentAm], (err, results) => {
        if (err) {
            console.error('Error fetching thesis:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα στην βάση' });
        }

        console.log(results);

        if (results.length > 0) {
            const thesis = results[0];

            const currentDate = new Date();
            let timeSinceAssignment = null;

            if (thesis.assignment_date) {
                const assignmentDate = new Date(thesis.assignment_date);
                const diffTime = Math.abs(currentDate - assignmentDate);
                timeSinceAssignment = `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} ημέρες`;
            }

            return res.json({
                success: true,
                thesis: {
                    ...thesis,
                    time_since_assignment: timeSinceAssignment,
                    committee: [] 
                }
            });
        } else {
            res.json({ success: false, message: 'Δεν βρέθηκαν διπλωματικές για τον φοιτητή.' });
        }
    });
});

app.get('/get-statistics-time', (req, res) => {
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
        SELECT 
            DATEDIFF(t.final_submission_date, c.response_date) AS completionTime1,
            DATEDIFF(t.final_submission_date, c.response_date2) AS completionTime2,
            DATEDIFF(t.final_submission_date, c.response_date3) AS completionTime3
        FROM Committees c
        JOIN Theses t ON c.thesis_id = t.thesis_id
        WHERE 
            (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') OR
            (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
            (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') AND
            (c.response_date IS NOT NULL OR c.response_date2 IS NOT NULL OR c.response_date3 IS NOT NULL) AND
            t.final_submission_date IS NOT NULL
    `;

    db.query(query, [teacherAM, teacherAM, teacherAM], (err, results) => {
        if (err) {
            console.error('Error fetching statistics:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα' });
        }

        const totalDays = results.reduce((acc, row) => {
            let total = 0;
            
            if (row.completionTime1) 
                total += row.completionTime1;
            if (row.completionTime2) 
                total += row.completionTime2;
            if (row.completionTime3) 
                total += row.completionTime3;
            
            return acc + total;
        }, 0);

        const cnt = results.reduce((acc, row) => {
            let cnt = 0;
            
            if (row.completionTime1) 
                cnt++;
            if (row.completionTime2) 
                cnt++;
            if (row.completionTime3) 
                cnt++;
            
            return acc + cnt;
        }, 0);
        const avgCompletionTimeTotal = (totalDays / cnt) / 30.44;
        
        query2 = `
            SELECT
                DATEDIFF(t.final_submission_date, c.response_date) AS completionTime1
            FROM Committees c
            JOIN Theses t ON c.thesis_id = t.thesis_id
            WHERE 
                (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') AND
                c.response_date IS NOT NULL AND
                t.final_submission_date IS NOT NULL
        `;

        db.query(query2, [teacherAM], (err, results) => {
            if (err) {
                console.error('Error fetching statistics:', err);
                return res.status(500).json({ success: false, message: 'Σφάλμα' });
            }

            const totalDays = results.reduce((acc, row) => {
                return acc + row.completionTime1;
            }, 0);

            const avgCompletionTime1 = (totalDays / results.length) / 30.44;

            query3 = `
                SELECT
                    DATEDIFF(t.final_submission_date, c.response_date2) AS completionTime2,
                    DATEDIFF(t.final_submission_date, c.response_date3) AS completionTime3
                FROM Committees c
                JOIN Theses t ON c.thesis_id = t.thesis_id
                WHERE 
                    (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
                    (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') AND
                    (c.response_date2 IS NOT NULL OR c.response_date3 IS NOT NULL) AND
                    t.final_submission_date IS NOT NULL
            `;

            db.query(query3, [teacherAM, teacherAM], (err, results) => {
                if(err) {
                    console.error('Error fetching statistics:', err);
                    return res.status(500).json({ success: false, message: 'Σφάλμα' });
                }

                const totalDays = results.reduce((acc, row) => {
                    let total = 0;
                    
                    if (row.completionTime2) 
                        total += row.completionTime2;
                    if (row.completionTime3) 
                        total += row.completionTime3;
                    
                    return acc + total;
                }, 0);

                const cnt = results.reduce((acc, row) => {
                    let cnt = 0;
                    
                    if (row.completionTime2) 
                        cnt++;
                    if (row.completionTime3) 
                        cnt++;
                    
                    return acc + cnt;
                }, 0);

                const avgCompletionTime2 = (totalDays / cnt) / 30.44;


                res.json({ success: true, data: { avgCompletionTimeTotal, avgCompletionTime1, avgCompletionTime2 } });
                console.log({ avgCompletionTimeTotal, avgCompletionTime1, avgCompletionTime2 });
            });
        });     
    });
});

app.get('/get-statistics-grades', (req, res) => {
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
        SELECT 
            AVG(CASE WHEN c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων' THEN t.final_grade ELSE NULL END) AS avgGrade1,
            AVG(CASE WHEN (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR 
                        (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') THEN t.final_grade ELSE NULL END) AS avgGrade2,
            AVG(CASE WHEN (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') OR
                        (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
                        (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') THEN t.final_grade ELSE NULL END) AS avgGradeTotal
        FROM Theses t
        JOIN Committees c ON t.thesis_id = c.thesis_id
        WHERE
            (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') OR
            (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
            (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος')
    `;

    db.query(query, [teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM], (err, results) => {
        if (err) {
            console.error('Error fetching statistics:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα'});
        }

        res.json({ success: true, data: results[0] });
        console.log(results[0]);
    });
});

app.get('/get-statistics-count', (req, res) => {
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
        SELECT
            COUNT(CASE WHEN c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων' THEN 1 ELSE NULL END) AS count1,
            COUNT(CASE WHEN (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
                           (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') THEN 1 ELSE NULL END) AS count2,
            COUNT(CASE WHEN (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') OR
                           (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
                           (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') THEN 1 ELSE NULL END) AS countTotal
        FROM Committees c
        JOIN Theses t ON c.thesis_id = t.thesis_id
        WHERE 
            (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') OR
            (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
            (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος')
    `;
    db.query(query, [teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM], (err, results) => {
        if (err) {
            console.error('Error fetching statistics:', err);
            return res.status(500).json({ success: false, message: 'Μη πιστοποιημένος' });
        }

        res.json({ success: true, data: results[0] });
        console.log(results[0]);
    });
});

app.get('/get-profile-st', (req, res) => {
    const studentAm = req.session.user?.am;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
        SELECT home_address, email, mobile_phone, landline_phone
        FROM Students
        WHERE student_am = ?
    `;

    db.query(query, [studentAm], (err, results) => {
        if (err) {
            console.error('Error fetching profile:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα βάσης' });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'Δεν βρέθηκε φοιτητής για την διπλωματική.' });
        }

        return res.json({ success: true, profile: results[0] });
    });
});

app.get('/get-active-theses', (req, res) => {
    const statusFilter = ['Ενεργή', 'Υπό Εξέταση']; // Καταστάσεις που θέλουμε
    const secretaryAM = req.session.user.am; // Αναγνωριστικό Γραμματείας

    if (!secretaryAM) {
        console.error('User is not authenticated or session is invalid');
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
      SELECT Theses.thesis_id, Theses.title, Theses.summary, Theses.status,
        a.assigned_date, 
        DATEDIFF(NOW(), a.assigned_date) AS days_since_assignment,
        t1.teacher_name AS teacher_name, Committees.role,
        t2.teacher_name AS teacher2_name, Committees.role2,
        t3.teacher_name AS teacher3_name, Committees.role3
      FROM Theses
       LEFT JOIN Assignments a ON Theses.thesis_id = a.thesis_id
       LEFT JOIN Committees ON Theses.thesis_id = Committees.thesis_id
       LEFT JOIN Teachers t1 ON Committees.teacher_am = t1.teacher_am
       LEFT JOIN Teachers t2 ON Committees.teacher_am2 = t2.teacher_am
       LEFT JOIN Teachers t3 ON Committees.teacher_am3 = t3.teacher_am
      WHERE Theses.status IN ('Ενεργή', 'Υπό Εξέταση')
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching active theses:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα' });
        }
        res.json({ success: true, data: results });
    });
});

// Route handler for fetching grades for a specific thesis

// Route handler για ανάκτηση βαθμών και τελικού βαθμού
app.get('/get-grades/:thesis_id', (req, res) => {
    const thesis_id = req.params.thesis_id;
    const teacherAM = req.session.user ? req.session.user.am : null;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Έλεγχος αν ο καθηγητής είναι στην επιτροπή
    const checkCommitteeQuery = `
        SELECT * FROM Committees 
        WHERE thesis_id = ? AND (teacher_am = ? OR teacher_am2 = ? OR teacher_am3 = ?)
    `;

    db.query(checkCommitteeQuery, [thesis_id, teacherAM, teacherAM, teacherAM], (err, results) => {
        if (err) {
            console.error("Error checking committee membership:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        if (results.length === 0) {
            return res.status(403).json({ success: false, message: "Δεν είστε μέλος Τριμελούς." });
        }

        // Ανάκτηση βαθμών από Grades
        const fetchGradesQuery = `
            SELECT g.teacher_am, t.teacher_name, g.grade
            FROM Grades g
            JOIN Teachers t ON g.teacher_am = t.teacher_am
            WHERE g.thesis_id = ?
        `;

        db.query(fetchGradesQuery, [thesis_id], (err, gradeResults) => {
            if (err) {
                console.error("Error fetching grades:", err);
                return res.status(500).json({ success: false, message: "Internal Server Error" });
            }

            if (gradeResults.length === 0) {
                return res.json({ success: false, message: "Δεν υπάρχουν βαθμολογίες ακόμη." });
            }

            // Υπολογισμός τελικού βαθμού
            let avgGrade = gradeResults.reduce((sum, g) => sum + parseFloat(g.grade), 0) / gradeResults.length;
            let finalGrade = avgGrade * 0.85;
            let bonus = 0;
            let bonusMessage = "Δεν παίρνει βαθμό bonus έγκαιρης παράδοσης.";

            // Έλεγχος αν υπάρχει bonus
            const timeQuery = `
                SELECT a.assigned_date, t.final_submission_date
                FROM Assignments a
                JOIN Theses t ON a.thesis_id = t.thesis_id
                WHERE a.thesis_id = ?;
            `;

            db.query(timeQuery, [thesis_id], (err, timeResults) => {
                if (err) {
                    console.error("Error fetching thesis dates:", err);
                    return res.status(500).json({ success: false, message: "Internal Server Error" });
                }

                if (timeResults.length === 0 || !timeResults[0].final_submission_date) {
                    return res.json({ success: false, message: "Μη διαθέσιμη ημερομηνίας παράδοσης." });
                }

                const assignedDate = new Date(timeResults[0].assigned_date);
                const finalSubmissionDate = new Date(timeResults[0].final_submission_date);
                const diffYears = (finalSubmissionDate - assignedDate) / (1000 * 60 * 60 * 24 * 365);

                if (diffYears <= 1.5) {
                    bonus = 1.5;
                    finalGrade += bonus;
                    bonusMessage = "1.5 μονάδα βαθμός έγκαιρης περάτωσης !";
                }

                //  Ενημέρωση final_grade στον Grades
                const updateFinalGradeQuery = `
                    UPDATE Theses SET final_grade = ? WHERE thesis_id = ?;
                `;

                db.query(updateFinalGradeQuery, [finalGrade.toFixed(2), thesis_id], (err, result) => {
                    if (err) {
                        console.error("Σφάλμα ανανέωησης τελικής βαθμολογίας:", err);
                        return res.status(500).json({ success: false, message: "Σφάλμα" });
                    }

                    res.json({ 
                        success: true, 
                        grades: gradeResults, 
                        final_grade: finalGrade.toFixed(2), 
                        bonusMessage 
                    });
                });
            });
        });
    });
});





app.get('/get-theses-status', (req, res) => {
    const studentAm = req.session.user.am;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Μη πιστοποιημένος' });
    }

    const query = `
        SELECT  
            t.status
        FROM Theses t
        LEFT JOIN Committees c ON t.thesis_id = c.thesis_id
        LEFT JOIN Teachers t1 ON c.teacher_am = t1.teacher_am
        LEFT JOIN Teachers t2 ON c.teacher_am2 = t2.teacher_am
        LEFT JOIN Teachers t3 ON c.teacher_am3 = t3.teacher_am
        LEFT JOIN Assignments a ON t.thesis_id = a.thesis_id
        WHERE t.student_am = ? AND t.status != 'Ακυρωμένη'
    `;

    db.query(query, [studentAm], (err, results) => {
        if (err) {
            console.error('Error fetching theses status:', err); 
            return res.status(500).json({ success: false, message: 'Database query error' });
        }
        console.log('Theses status results:', results); 
        res.json({ success: true, theses: results });
    });
});

app.get('/get-teacher-info', (req, res) => {
    const query = 'SELECT teacher_name, teacher_am, email FROM Teachers';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching teacher info:', err);
            res.status(500).json({ success: false, message: 'Error fetching teacher info' });
        } 
            
        res.json({ success: true, teachers: results });
        console.log('Teacher info:', results);
        
    });
});

app.get('/get-thesis-id', (req, res) => {
    const studentAm = req.session.user.am;

    const query = `
        SELECT thesis_id
        FROM Theses
        WHERE student_am = ?
    `;

    db.query(query, [studentAm], (err, results) => {
        if (err) {
            console.error('Error fetching thesis_id:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Thesis not found for the student' });
        }

        res.json({ success: true, thesis_id: results[0].thesis_id });
        console.log('Thesis id:', results[0].thesis_id);
    });
});

// Route handler for fetching announcements
app.get('/announcements', (req, res) => {
    const { format: responseFormat } = req.query;
    const currentDate = new Date();
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(currentDate.getFullYear() + 1);

    const formattedCurrentDate = currentDate.toISOString().split('T')[0];
    const formattedNextYear = nextYear.toISOString().split('T')[0];

    const query = `
        SELECT 
            Theses.title, 
            Students.student_name, 
            Presentations.presentation_date, 
            Presentations.presentation_time, 
            Presentations.presentation_type, 
            CASE 
                WHEN Presentations.presentation_type = 'in-person' THEN Presentations.presentation_location 
                WHEN Presentations.presentation_type = 'online' THEN Presentations.presentation_link 
                ELSE NULL 
            END AS presentation_detail
        FROM Theses
        JOIN Students ON Theses.student_am = Students.student_am
        JOIN Presentations ON Theses.thesis_id = Presentations.thesis_id
        WHERE Presentations.presentation_date BETWEEN ? AND ?
    `;

    db.query(query, [formattedCurrentDate, formattedNextYear], (err, results) => {
        if (err) {
            console.error('Error fetching announcements:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        results.forEach(announcement => {
            announcement.presentation_date = format(new Date(announcement.presentation_date), 'yyyy-MM-dd');
        });

        if (responseFormat === 'xml') {
            const builder = new xml2js.Builder();
            const xml = builder.buildObject({ announcements: results });
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        } else {
            res.json({ success: true, data: results });
        }
    });
});

app.get('/get-pending-theses', (req, res) => {
    const query = `
        SELECT thesis_id, title 
        FROM Theses 
        WHERE status = 'Υπό Ανάθεση'
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching pending theses:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        res.json({ success: true, data: results });
    });
});

app.get('/api/theses', (req, res) => {
    const statusFilter = req.query.status;

    let query = `
        SELECT 
            t.thesis_id, 
            t.title, 
            t.status, 
            t.final_grade, 
            p.repository_link 
        FROM Theses t
        LEFT JOIN Presentations p ON t.thesis_id = p.thesis_id
        WHERE t.status IN ('Ενεργή', 'Υπό Εξέταση')
    `;

    const queryParams = [];
    if (statusFilter) {
        query += ' AND t.status = ?';
        queryParams.push(statusFilter);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Σφάλμα στη φόρτωση των διπλωματικών:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα στη βάση δεδομένων.' });
        }
        res.json({ success: true, theses: results });
    });
});

app.get('/exam-report/:thesis_id', (req, res) => {
    const thesisId = req.params.thesis_id;
    const studentAm = req.session.user.am;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const query = `
        SELECT 
            t.title, 
            t.summary, 
            t.status, 
            t.final_grade, 
            t1.teacher_name AS supervisor,
            t2.teacher_name AS committee_member1,
            t3.teacher_name AS committee_member2,
            p.repository_link
        FROM Theses t
        LEFT JOIN Committees c ON t.thesis_id = c.thesis_id
        LEFT JOIN Teachers t1 ON c.teacher_am = t1.teacher_am
        LEFT JOIN Teachers t2 ON c.teacher_am2 = t2.teacher_am
        LEFT JOIN Teachers t3 ON c.teacher_am3 = t3.teacher_am
        LEFT JOIN Presentations p ON t.thesis_id = p.thesis_id
        WHERE t.thesis_id = ? AND t.student_am = ? AND t.final_grade IS NOT NULL
    `;

    db.query(query, [thesisId, studentAm], (err, results) => {
        if (err) {
            console.error('Error fetching exam report:', err);
            return res.status(500).json({ success: false, message: 'Error fetching exam report' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Δεν βρέθηκε διπλωματική' });
        }

        const examReport = results[0];
        res.render('exam-report', { examReport });
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
app.post('/add-thesis', (req, res) => {
    const { title, description } = req.body;
    const teacher_am = req.session.user.am;

    if (!req.files || !req.files.file) {
        return res.status(400).json({ success: false, message: 'Δεν μεταφορτώθηκε αρχείο.' });
    }

    const pdfFile = req.files.file;
    const pdfPath = `uploads/${pdfFile.name}`;

    pdfFile.mv(path.join(__dirname, pdfPath), (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const query = `
            INSERT INTO Theses (title, summary, pdf_path, teacher_am, status)
            VALUES (?, ?, ?, ?, 'Υπό Ανάθεση')
        `;
        
        const values = [title, description, pdfPath, teacher_am || null];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error inserting thesis:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            const query2 = `
                INSERT INTO Committees (thesis_id, teacher_am, role, response, invitation_date, response_date)
                VALUES (LAST_INSERT_ID(), ?, 'Επιβλέπων', 'Αποδοχή', NOW(), NOW())
            `;

            db.query(query2, [teacher_am], (err) => {
                if (err) {
                    console.error('Error inserting committee:', err);
                    return res.status(500).json({ success: false, message: 'Internal Server Error' });
                }
                
                res.json({ success: true, message: 'Επιτυχής καταχώρηση Διπλωματικής!' });
            });
        });
    });
});

// Route handler for updating a thesis
app.post('/update-thesis', (req, res) => {
    const { thesis_id, title, description, teacher_am, student_am, final_submission_date, status } = req.body;

    let pdfPath = null;
    if (req.files && req.files.file) {
        const pdfFile = req.files.file;
        pdfPath = `uploads/${pdfFile.name}`;

        pdfFile.mv(path.join(__dirname, pdfPath), (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).json({ success: false, message: 'Σφάλμα' });
            }
        });
    }

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
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const query2 = `
            UPDATE Committees
            SET teacher_am = ?
            WHERE thesis_id = ? AND role = 'Επιβλέπων'
        `;
        db.query(query2, [teacher_am, thesis_id], (err) => {
            if (err) {
                console.error('Error updating committee:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            res.json({ success: true, message: 'Επιτυχής ανανέωση διπλωματικής!' });
        });
    });
});

// Assign a thesis to a student
app.post("/assign-theses", (req, res) => {
    const { thesisId, studentAm } = req.body;
    const teacherAM = req.session.user.am;

    if (!thesisId || !studentAm) {
        return res.status(400).json({ success: false, message: 'Missing thesisId or studentAm' });
    }

    const query = 'UPDATE Theses SET student_am = ? WHERE thesis_id = ? AND teacher_am = ?';
    db.query(query, [studentAm, thesisId, teacherAM], (err, results) => {
        if (err) {
            if (err.sqlState === '45000') {
                return res.status(400).json({ success: false, message: err.message });
            }
            console.error('Error assigning thesis:', err);
            return res.status(500).json({ success: false, message: 'Δεν είστε ο επιβλέπων καθηγητής της διπλωματικής' });
        }

        if (results.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Δεν είστε ο επιβλέπων καθηγητής της διπλωματικής' });
        }

        const query2 = `
            INSERT INTO Assignments (thesis_id, student_am, assigned_date, status)
            SELECT ?, ?, NOW(), "Προσωρινή"
            FROM Theses
            WHERE thesis_id = ? AND teacher_am = ?
        `;
        db.query(query2, [thesisId, studentAm, thesisId, teacherAM], (err) => {
            if (err) {
                if (err.sqlState === '45000') {
                    return res.status(400).json({ success: false, message: err.message });
                }
                console.error('Error inserting assignment:', err);
                return res.status(500).json({ success: false, message: 'Δεν είστε ο επιβλέπων καθηγητής της διπλωματικής' });
            }

            res.json({ success: true, message: 'Thesis assigned successfully' });
        });
    });
});

// Route handler for cancelling an assignment
app.post('/cancel-assignment/:id', (req, res) => {
    const thesisId = req.params.id;
    const teacherAM = req.session.user.am;

    // Check if the current teacher is the supervisor
    const checkSupervisorQuery = `
        SELECT * FROM Committees 
        WHERE thesis_id = ? AND teacher_am = ? AND role = 'Επιβλέπων'
    `;
    db.query(checkSupervisorQuery, [thesisId, teacherAM], (err, results) => {
        if (err) {
            console.error('Error checking supervisor role:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        if (results.length === 0) {
            return res.status(403).json({ success: false, message: 'Μόνο ο Επιβλέπων μπορεί να ακυρώσει την ανάθεση' });
        }

        // Cancel the assignment
        const cancelAssignmentQuery = `
            UPDATE Theses 
            SET status = 'Ακυρωμένη', student_am = NULL 
            WHERE thesis_id = ?
        `;
        db.query(cancelAssignmentQuery, [thesisId], (err) => {
            if (err) {
                console.error('Error cancelling assignment:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            res.json({ success: true, message: "Η ανάθεση ακυρώθηκε επιτυχώς!" });
        });
    });
});

app.post('/accept-invitation/:id', (req, res) => {
    const committeeId = req.params.id;
    const teacherAM = req.session.user.am;

    const query = `
        UPDATE Committees
        SET 
            response2 = CASE WHEN teacher_am2 = ? THEN 'Αποδοχή' ELSE response2 END,
            response_date2 = CASE WHEN teacher_am2 = ? THEN NOW() ELSE response_date2 END,
            response3 = CASE WHEN teacher_am3 = ? THEN 'Αποδοχή' ELSE response3 END,
            response_date3 = CASE WHEN teacher_am3 = ? THEN NOW() ELSE response_date3 END
        WHERE committee_id = ?
    `;

    db.query(query, [teacherAM, teacherAM, teacherAM, teacherAM, committeeId], (err) => {
        if (err) {
            console.error('Error accepting invitation:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        
        const thesisQuery = `
            SELECT thesis_id FROM Committees WHERE committee_id = ?
        `;
        db.query(thesisQuery, [committeeId], (err, results) => {
            if (err) {
                console.error('Error fetching thesis id:', err);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
                return;
            }

            const thesis_id = results[0].thesis_id;
            checkAndUpdateThesisStatus(thesis_id);
        });

        res.json({ success: true, message: 'Επιτυχής αποδοχή πρόσκλησης!' });
    });
});

app.post('/reject-invitation/:id', (req, res) => {
    const committeeId = req.params.id;
    const teacherAM = req.session.user.am;
    const query = `
        UPDATE Committees
        SET 
            response2 = CASE WHEN teacher_am2 = ? THEN 'Απόρριψη' ELSE response2 END,
            response_date2 = CASE WHEN teacher_am2 = ? THEN NOW() ELSE response_date2 END,
            response3 = CASE WHEN teacher_am3 = ? THEN 'Απόρριψη' ELSE response3 END,
            response_date3 = CASE WHEN teacher_am3 = ? THEN NOW() ELSE response_date3 END
        WHERE committee_id = ?
    `;

    db.query(query, [teacherAM, teacherAM, teacherAM, teacherAM, committeeId], (err) => {
        if (err) {
            console.error('Error rejecting invitation:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        res.json({ success: true, message: 'Η πρόσκληση έχει απορριφθεί!' });
    });
});

// Route handler for adding a note
app.post('/add-note', (req, res) => {
    const { thesis_id, content } = req.body;
    const teacher_am = req.session.user.am;

    if (!teacher_am) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const query = `
        INSERT INTO Notes (thesis_id, teacher_am, content)
        VALUES (?, ?, ?)
    `;
    db.query(query, [thesis_id, teacher_am, content], (err, result) => {
        if (err) {
            console.error('Error adding note:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        res.json({ success: true, message: 'Επιτυχής προσθήκη σημείωσης!' });
    });
});

// Route handler for retrieving notes for a specific thesis
app.get('/get-notes/:thesis_id', (req, res) => {
    const thesis_id = req.params.thesis_id;
    const teacher_am = req.session.user.am;

    if (!teacher_am) {
        return res.status(401).json({ success: false, message: 'Μη εξουσιοδοτημένος' });
    }

    const query = `
        SELECT * FROM Notes
        WHERE thesis_id = ? AND teacher_am = ?
        ORDER BY created_at DESC
    `;
    db.query(query, [thesis_id, teacher_am], (err, results) => {
        if (err) {
            console.error('Error fetching notes:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα' });
        }
        res.json({ success: true, data: results });
    });
});

// Route handler for changing the status of a thesis
app.post('/change-status/:id', (req, res) => {
    const thesisId = req.params.id;
    const newStatus = req.body.status;
    const teacherAM = req.session.user.am;

    // Check if the current teacher is the supervisor
    const checkSupervisorQuery = `
        SELECT * FROM Committees 
        WHERE thesis_id = ? AND teacher_am = ? AND role = 'Επιβλέπων'
    `;
    db.query(checkSupervisorQuery, [thesisId, teacherAM], (err, results) => {
        if (err) {
            console.error("Error checking supervisor:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        if (results.length === 0) {
            return res.status(403).json({ success: false, message: "Δεν είστε ο υπεύθυνος." });
        }

        // Change the status of the thesis
        const changeStatusQuery = `
            UPDATE Theses 
            SET status = 'Υπο εξέταση' 
            WHERE thesis_id = ?
        `;
        db.query(changeStatusQuery, [thesisId], (err) => {
            if (err) {
                console.error("Error changing status:", err);
                return res.status(500).json({ success: false, message: "Σφάλμα" });
            }

            res.json({ success: true, message: "Επιτυχής αλλαγή κατάστασης" });
        });
    });
});

// Route handler for submitting a grade
app.post('/submit-grade', (req, res) => {
    const { thesis_id, grade } = req.body;
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Μη εξουσιοδοτημένος' });
    }

    // Check if the current teacher is a member of the committee
    const checkCommitteeQuery = `
        SELECT * FROM Committees 
        WHERE thesis_id = ? AND (teacher_am = ? OR teacher_am2 = ? OR teacher_am3 = ?)
    `;
    db.query(checkCommitteeQuery, [thesis_id, teacherAM, teacherAM, teacherAM], (err, results) => {
        if (err) {
            console.error("Error checking committee membership:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        if (results.length === 0) {
            return res.status(403).json({ success: false, message: "Δεν είστε μέλος της τριμελούς." });
        }

        // Check if the teacher has already submitted a grade
        const checkGradeQuery = `
            SELECT * FROM Grades 
            WHERE thesis_id = ? AND teacher_am = ?
        `;
        db.query(checkGradeQuery, [thesis_id, teacherAM], (err, gradeResults) => {
            if (err) {
                console.error("Error checking existing grade:", err);
                return res.status(500).json({ success: false, message: "Internal Server Error" });
            }
            if (gradeResults.length > 0) {
                return res.status(400).json({ success: false, message: "Υπάρχει ήδη καταχωρημένος βαθμός." });
            }

            // Insert the grade
            const insertGradeQuery = `
                INSERT INTO Grades (thesis_id, teacher_am, grade)
                VALUES (?, ?, ?)
            `;
            db.query(insertGradeQuery, [thesis_id, teacherAM, grade], (err) => {
                if (err) {
                    console.error("Error submitting grade:", err);
                    return res.status(500).json({ success: false, message: "Internal Server Error" });
                }
                res.json({ success: true, message: 'Επιτυχής καταχώρηση βαθμού!' });
            });
        });
    });
});

// Route handler for updating a grade
// ✔️ Update Grade
app.post('/update-grade', (req, res) => {
    const { thesis_id, grade } = req.body;
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Μη εξουσιοδοτημένος' });
    }

    const updateGradeQuery = `
        UPDATE Grades 
        SET grade = ?
        WHERE thesis_id = ? AND teacher_am = ?
    `;

    db.query(updateGradeQuery, [grade, thesis_id, teacherAM], (err) => {
        if (err) {
            console.error("Error updating grade:", err);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        res.json({ success: true, message: 'Επιτυχής ανανέωση βαθμολογίας!' });
    });
});



// Διαδρομή για εισαγωγή JSON δεδομένων
app.post('/import-json', (req, res) => {
    if (!req.files || !req.files.jsonFile) {
        return res.status(400).send('Δεν μεταφορτώθηκε αρχείο.');
    }

    try {
        const jsonFile = req.files.jsonFile;
        const jsonData = JSON.parse(jsonFile.data.toString());

        // Εισαγωγή δεδομένων στη βάση
        const insertStudents = 'INSERT INTO Students (student_am, role_id, student_username, student_password, student_name, email, home_address, mobile_phone, landline_phone) VALUES ?';
        const insertTeachers = 'INSERT INTO Teachers (teacher_am, role_id, teacher_username, teacher_password, teacher_name, email) VALUES ?';

        const studentData = jsonData.students.map(student => [
            student.student_am,
            student.role_id,
            student.student_username,
            student.student_password,
            student.student_name,
            student.email,
            student.home_address,
            student.mobile_phone,
            student.landline_phone
        ]);

        const teacherData = jsonData.teachers.map(teacher => [
            teacher.teacher_am,
            teacher.role_id,
            teacher.teacher_username,
            teacher.teacher_password,
            teacher.teacher_name,
            teacher.email
        ]);

        // Εκτέλεση ερωτήματος για εισαγωγή φοιτητών
        db.query(insertStudents, [studentData], (err) => {
            if (err) {
                console.error('Error inserting students:', err);
                return res.status(500).json({ success: false, message: 'Σφάλμα' });
            }

            // Εκτέλεση ερωτήματος για εισαγωγή διδασκόντων
            db.query(insertTeachers, [teacherData], (err) => {
                if (err) {
                    console.error('Error inserting teachers:', err);
                    return res.status(500).json({ success: false, message: 'Σφάλμα' });
                }

                res.json({ success: true, message: 'Επιτυχής μεταφόρτωση δεδομένων!' });
            });
        });
    } catch (error) {
        console.error('Error processing JSON file:', error);
        res.status(400).send('Λανθασμένο JSON αρχείο.');
    }
});
    
app.post('/invite-teacher', (req, res) => {
    const { thesis_id, teacher_am, role } = req.body;

    const invitationDate = new Date();

    const check = 'SELECT teacher_am2, teacher_am3, response2, response3 FROM Committees WHERE thesis_id = ?';
    db.query(check, [thesis_id], (err, result) => {
        if (err) {
            console.error('Error checking teacher:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Δεν βρέθηκαν διπλωματικές' });
        }

        let query;
        let queryParams;

        if (!result[0].teacher_am2 || result[0].response2 === 'Απόρριψη') {
            query = `
                UPDATE Committees
                SET teacher_am2 = ?, role2 = ?, invitation_date2 = ?, response2 = NULL, response_date2 = NULL
                WHERE thesis_id = ?
            `;
            queryParams = [teacher_am, role, invitationDate, thesis_id];
            
        } else if (!result[0].teacher_am3 || result[0].response3 === 'Απόρριψη') {
            query = `
                UPDATE Committees
                SET teacher_am3 = ?, role3 = ?, invitation_date3 = ?, response3 = NULL, response_date3 = NULL
                WHERE thesis_id = ?
            `;
            queryParams = [teacher_am, role, invitationDate, thesis_id];

        } else {
            return res.status(400).json({ success: false, message: 'Δεν υπάεχει διαθέσημη θέση' });
        }

        db.query(query, queryParams, (err) => {
            if (err) {
                console.error('Error inviting teacher:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            res.json({ success: true, message: 'Επιτυχής πρόσκληση διδάσκοντα!' });
        });
    });
});

app.post('/erase-assignment/:id', (req, res) => {
    const thesisId = req.params.id;

    // Erase the assignment by setting student_am to NULL
    const eraseAssignmentQuery = `
        UPDATE Theses 
        SET student_am = NULL 
        WHERE thesis_id = ?
    `;
    db.query(eraseAssignmentQuery, [thesisId], (err) => {
        if (err) {
            console.error('Error erasing assignment:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        res.json({ success: true, message: 'Επιτυχής αναίρεση ανάθεσης!' });
    });
});
    
app.post('/set-presentation', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        console.error('No files were uploaded.');
        return res.status(400).json({ success: false, message: 'Δεν μεταφορτώθηκαν αρχεία.' });
    }

    const thesisDraft = req.files.thesisDraft;
    const thesisId = req.body.thesis_id;
    const studentAm = req.session.user.am;
    const presentationDate = req.body.presentation_date;
    const presentationTime = req.body.presentation_time;
    const presentationType = req.body.presentation_type;
    const presentationLocation = req.body.presentation_location;
    const presentationLink = req.body.presentation_link;
    const additionalLinks = req.body.additional_links;

    if (!thesisId) {
        console.error('Thesis ID is required.');
        return res.status(400).json({ success: false, message: 'Χρειαζόμαστε το Thesis ID .' });
    }

    if (!studentAm) {
        console.error('Student AM is required.');
        return res.status(400).json({ success: false, message: 'Χρειαζόμασρε το Student AM .' });
    }

    const getTitleQuery = 'SELECT title FROM Theses WHERE thesis_id = ?';
    db.query(getTitleQuery, [thesisId], (err, results) => {
        if (err) {
            console.error('Error fetching thesis title:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        if (results.length === 0) {
            console.error('Thesis not found.');
            return res.status(404).json({ success: false, message: 'Δεν βρέθηκε διπλωματική.' });
        }

        const currentDate = new Date().toISOString().split('T')[0]; 
        const fileName = `${studentAm}_${currentDate}.pdf`;
        const uploadDir = 'theses_drafts';
        const uploadPath = path.join(__dirname, uploadDir, fileName);
        const relativePath = path.join(uploadDir, fileName);

        thesisDraft.mv(uploadPath, (err) => {
            if (err) {
                console.error('Error uploading thesis draft:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            const query = `
                INSERT INTO Presentations (theses_pdf_draft_path, presentation_date, presentation_time, presentation_type, presentation_location, presentation_link, thesis_id, additional_links) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(query, [relativePath, presentationDate, presentationTime, presentationType, presentationLocation, presentationLink, thesisId, additionalLinks], (err) => {
                if (err) {
                    console.error('Error updating thesis draft path:', err);
                    return res.status(500).json({ success: false, message: 'Internal Server Error' });
                }
                res.json({ success: true, message: 'Επιτυχής μεταφόρτωση πρόχειρου αρχείου διπλωματικής!', path: relativePath });
            });
        });
    });
});

/*
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------Put Requests-----------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
*/

// Route to approve a thesis (Ενεργή)
app.put('/api/assignment/gs_number', (req, res) => { 
    const { thesis_id, gs_number_assignment } = req.body;

    if (!thesis_id || !gs_number_assignment) {
        return res.status(400).json({ success: false, message: 'Όλα τα πεδία είναι υποχρεωτικά.' });
    }

    const query = `
    UPDATE Assignments AS a
    LEFT JOIN Theses AS t ON a.thesis_id = t.thesis_id
    SET a.gs_number_assignment = ?
    WHERE t.thesis_id = ? 
      AND a.status = 'Οριστική';

    `;

    db.query(query, [gs_number_assignment, thesis_id], (err, results) => {
        if (err) {
            console.error('Σφάλμα κατά την καταχώρηση του ΑΠ:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα στη βάση δεδομένων.' });
        }
        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'ΑΠ Γενικής Συνέλευσης για ολοκλήρωση ανάθεσης καταχωρήθηκε επιτυχώς!' });
        } else {
            res.status(400).json({ success: false, message: 'Δεν βρέθηκε ανάθεση με κατάσταση "Οριστική" για τη συγκεκριμένη διπλωματική.' });
        }
    });
});



app.put('/api/thesis/cancel', (req, res) => {
    const { thesis_id, gs_number, gs_year, cancellation_reason } = req.body;

    const query = `
        UPDATE Theses 
        SET status = 'Ακυρωμένη', gs_number = ?, gs_year = ?, cancellation_reason = ?
        WHERE thesis_id = ? AND status = 'Ενεργή';
    `;

    db.query(query, [gs_number, gs_year, cancellation_reason, thesis_id], (err, results) => {
        if (err) {
            console.error('Error cancelling thesis:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Thesis cancelled successfully!' });
        } else {
            res.status(400).json({ success: false, message: 'Η διπλωματική δεν βρέθηκε ή δεν είναι ενεργή.' });
        }
    });
});

app.put('/api/theses/complete', (req, res) => {
    const { thesis_id } = req.body;

    if (!thesis_id) {
        return res.status(400).json({ success: false, message: "Λείπει το ID της διπλωματικής." });
    }

    // Έλεγχος αν υπάρχουν final_grade και repository_link
    const checkQuery = `
        SELECT t.final_grade, p.repository_link
        FROM Theses t
        INNER JOIN Presentations p ON t.thesis_id = p.thesis_id
        WHERE t.thesis_id = ? 
          AND t.status = 'Υπό Εξέταση'
          AND t.final_grade IS NOT NULL
          AND p.repository_link IS NOT NULL
    `;

    db.query(checkQuery, [thesis_id], (err, results) => {
        if (err) {
            console.error("Σφάλμα στον έλεγχο των δεδομένων:", err);
            return res.status(500).json({ success: false, message: "Σφάλμα στη βάση δεδομένων." });
        }

        console.log("Αποτελέσματα από το checkQuery:", results); // Debugging

        if (results.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Η διπλωματική δεν μπορεί να ολοκληρωθεί: λείπει βαθμός ή σύνδεσμος.",
                final_grade: results[0]?.final_grade || "Δεν υπάρχει",
                repository_link: results[0]?.repository_link || "Δεν υπάρχει"
            });
        }

        // Ενημέρωση της κατάστασης της διπλωματικής
        const updateQuery = `
            UPDATE Theses 
            SET status = 'Περατωμένη' 
            WHERE thesis_id = ? AND status = 'Υπό Εξέταση'
        `;

        db.query(updateQuery, [thesis_id], (updateErr, updateResults) => {
            if (updateErr) {
                console.error("Σφάλμα κατά την ενημέρωση της κατάστασης:", updateErr);
                return res.status(500).json({ success: false, message: "Σφάλμα στη βάση δεδομένων." });
            }

            if (updateResults.affectedRows > 0) {
                res.json({ success: true, message: "Η διπλωματική ολοκληρώθηκε επιτυχώς!" });
            } else {
                res.status(400).json({ success: false, message: "Η διπλωματική δεν πληροί τις προϋποθέσεις για ολοκλήρωση." });
            }
        });
    });
});




app.post('/update-profile-st', (req, res) => {
    const studentAm = req.session.user?.am; // Αναγνωριστικό φοιτητή από το session
    const { home_address, email, mobile_phone, landline_phone } = req.body;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Μη εξουσιοδοτημένος' });
    }

    const query = `
        UPDATE Students
        SET home_address = ?, email = ?, mobile_phone = ?, landline_phone = ?
        WHERE student_am = ?
    `;

    db.query(
        query,
        [home_address, email, mobile_phone, landline_phone, studentAm],
        (err, result) => {
            if (err) {
                console.error('Error updating profile:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            return res.json({ success: true, message: 'Επιτυχής ανανέωση προφίλ' });
        }
    );
});

app.put('/submit-repository-link', (req, res) => {
    const studentAm = req.session.user.am;
    const { thesis_id, repository_link } = req.body;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Μη εξουσιοδοτημένος'});
    }

    const query = `
        UPDATE Presentations
        SET repository_link = ?
        WHERE thesis_id = ?
    `;

    db.query(query, [repository_link, thesis_id, studentAm], (err, result) => {
        if (err) {
            console.error('Error updating repository link:', err);
            return res.status(500).json({ success: false, message: 'Σφάλμα ανανέωσης συνδέσμου' });
        }

        res.json({ success: true, message: 'Σφάλμα ανανέωσης συνδέσμου' });
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
                    res.status(404).json({ success: false, message: 'Δεν βρέθηκαν διπλωματικές' });
                    return;
                }

                res.json({ success: true, message: 'Η διπλωματική διαγράφηκε επιτυχώς!' });
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
