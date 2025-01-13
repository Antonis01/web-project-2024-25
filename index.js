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
const { Parser } = require('json2csv');
const xml2js = require('xml2js');
//const fileUpload = require('express-fileupload');

const app = express();

// Use bodyParser to parse JSON data
app.use(bodyParser.json()); 

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//app.use(express.json());

//app.use(fileUpload());


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
                    } else {
                        console.log(`Thesis ${thesis_id} status updated to 'Ενεργή'`);
                    }
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
    const query = 'SELECT * FROM Theses WHERE title LIKE ?';
    const searchTerm = `%${req.params.title}%`;
    console.log("Searching theses with title like:", searchTerm);
    db.query(query, [searchTerm], (err, results) => {
        if (err) {
            console.error('Error searching theses:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ success: false, message: 'No theses found' });
            return;
        }
        res.json({ success: true, data: results });
    });
});

// Route handler for retrieving theses for management
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
        WHERE (Committees.teacher_am = ? OR Committees.teacher_am2 = ? OR Committees.teacher_am3 = ?)
    `;
    const queryParams = [teacherAM, teacherAM, teacherAM];

    if (statusFilter && statusFilter !== 'Όλες') {
        query += ' AND Theses.status = ?';
        queryParams.push(statusFilter);
    }

    if (statusFilter === 'Υπό Ανάθεση') {
        query += ' AND ( Committees.role = "Επιβλέπων" AND Committees.teacher_am = ?)';
        queryParams.push(teacherAM);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching theses:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const theses = results.map(thesis => {
            return {
                ...thesis,
                committee: [
                    {
                        teacher_name: thesis.teacher_name,
                        role: thesis.role,
                        invitation_date: thesis.invitation_date,
                        response: thesis.response,
                        response_date: thesis.response_date
                    },
                    {
                        teacher_name: thesis.teacher2_name,
                        role: thesis.role2,
                        invitation_date: thesis.invitation_date2,
                        response: thesis.response2,
                        response_date: thesis.response_date2
                    },
                    {
                        teacher_name: thesis.teacher3_name,
                        role: thesis.role3,
                        invitation_date: thesis.invitation_date3,
                        response: thesis.response3,
                        response_date: thesis.response_date3
                    }
                ]
            };
        });

        res.json({ success: true, data: theses });
    });
});

// Route handler for searching students
app.get("/search-student", (req, res) => {
    const { am, studentName } = req.query;
    let query = '';
    let queryParams = [];

    if (am) {
        query = 'SELECT student_name, student_am FROM Students WHERE student_am LIKE ?';
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
            res.status(500).json({ success: false, message: 'Internal Server Error' });
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
            res.status(500).json({ success: false, message: 'Internal Server Error' });
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

app.get('/get-invitations', (req, res) => {
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        console.error('Teacher AM not found in session');
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
            return res.status(500).json({ success: false, message: 'Database error' });
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
            res.json({ success: false, message: 'No thesis found for the student.' });
        }
    });
});

app.get('/get-statistics-time', (req, res) => {
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
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
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
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
                    return res.status(500).json({ success: false, message: 'Internal Server Error' });
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
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const query = `
        SELECT 
            AVG(CASE WHEN c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων' THEN g.grade ELSE NULL END) AS avgGrade1,
            AVG(CASE WHEN (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR 
                        (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') THEN g.grade ELSE NULL END) AS avgGrade2,
            AVG(CASE WHEN (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') OR
                        (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
                        (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος') THEN g.grade ELSE NULL END) AS avgGradeTotal
        FROM Grades g
        JOIN Theses t ON g.thesis_id = t.thesis_id
        JOIN Committees c ON t.thesis_id = c.thesis_id
        WHERE 
            (c.teacher_am = ? AND c.response = 'Αποδοχή' AND c.role = 'Επιβλέπων') OR
            (c.teacher_am2 = ? AND c.response2 = 'Αποδοχή' AND c.role2 = 'Μέλος') OR
            (c.teacher_am3 = ? AND c.response3 = 'Αποδοχή' AND c.role3 = 'Μέλος')
    `;

    db.query(query, [teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM, teacherAM], (err, results) => {
        if (err) {
            console.error('Error fetching statistics:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        res.json({ success: true, data: results[0] });
        console.log(results[0]);
    });
});

app.get('/get-statistics-count', (req, res) => {
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        res.json({ success: true, data: results[0] });
        console.log(results[0]);
    });
});

// Route handler for generating and displaying the announcement text
app.get('/generate-announcement/:id', (req, res) => {
    const thesisId = req.params.id;
    const teacherAM = req.session.user.teacher_am;

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
            return res.status(403).json({ success: false, message: "You are not the supervisor of this thesis." });
        }

        // Fetch the thesis details including presentation details
        const fetchThesisQuery = `
            SELECT Theses.title, Theses.student_am, Presentations.presentation_date, Presentations.presentation_time, Presentations.presentation_type, Presentations.presentation_location, Presentations.presentation_link
            FROM Theses
            JOIN Presentations ON Theses.thesis_id = Presentations.thesis_id
            WHERE Theses.thesis_id = ?
        `;
        db.query(fetchThesisQuery, [thesisId], (err, results) => {
            if (err) {
                console.error("Error fetching thesis details:", err);
                return res.status(500).json({ success: false, message: "Internal Server Error" });
            }
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "Thesis not found." });
            }

            const thesis = results[0];
            if (!thesis.presentation_date || !thesis.presentation_time || (!thesis.presentation_location && !thesis.presentation_link)) {
                return res.status(400).json({ success: false, message: "Presentation details are incomplete." });
            }

            let announcementText = `
                Ανακοίνωση Παρουσίασης Διπλωματικής Εργασίας
                Τίτλος: ${thesis.title}
                Φοιτητής: ${thesis.student_am}
                Ημερομηνία: ${thesis.presentation_date}
                Ώρα: ${thesis.presentation_time}
            `;

            if (thesis.presentation_type === 'in-person') {
                announcementText += `
                    Τοποθεσία: ${thesis.presentation_location}
                `;
            } else if (thesis.presentation_type === 'online') {
                announcementText += `
                    Σύνδεσμος: ${thesis.presentation_link}
                `;
            }

            res.json({ success: true, announcement: announcementText });
        });
    });
});

app.get('/get-profile-st', (req, res) => {
    const studentAm = req.session.user?.am;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const query = `
        SELECT home_address, email, mobile_phone, landline_phone
        FROM Students
        WHERE student_am = ?
    `;

    db.query(query, [studentAm], (err, results) => {
        if (err) {
            console.error('Error fetching profile:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'No profile found for the student.' });
        }

        return res.json({ success: true, profile: results[0] });
    });
});

app.get('/get-active-theses', (req, res) => {
    const statusFilter = ['Ενεργή', 'Υπό Εξέταση']; // Καταστάσεις που θέλουμε
    const secretaryAM = req.session.user.am; // Αναγνωριστικό Γραμματείας

    if (!secretaryAM) {
        console.error('User is not authenticated or session is invalid');
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
      WHERE Theses.status IN ('Ενεργή', 'Υπό Εξέταση');

`; 

    db.query(query, statusFilter, (err, results) => {
        if (err) {
            console.error('Error fetching theses:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        // Μορφοποίηση δεδομένων
        const theses = results.map(thesis => ({
            thesis_id: thesis.thesis_id,
            title: thesis.title,
            summary: thesis.summary,
            status: thesis.status,
            days_since_assignment: thesis.assigned_date ? thesis.days_since_assignment : null,
            committee: [
                {
                    teacher_name: thesis.teacher_name,
                    role: thesis.role
                },
                {
                    teacher_name: thesis.teacher2_name,
                    role: thesis.role2
                },
                {
                    teacher_name: thesis.teacher3_name,
                    role: thesis.role3
                }
            ]
        }));

        res.json({ success: true, data: theses });
    });
});


// Route handler for fetching grades for a specific thesis
app.get('/get-grades/:thesis_id', (req, res) => {
    const thesis_id = req.params.thesis_id;
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
            return res.status(403).json({ success: false, message: "You are not a member of the committee for this thesis." });
        }

        // Fetch the grades
        const fetchGradesQuery = `
            SELECT g.teacher_am, t.teacher_name, g.grade
            FROM Grades g
            JOIN Teachers t ON g.teacher_am = t.teacher_am
            WHERE g.thesis_id = ?
        `;
        db.query(fetchGradesQuery, [thesis_id], (err, results) => {
            if (err) {
                console.error("Error fetching grades:", err);
                return res.status(500).json({ success: false, message: "Internal Server Error" });
            }
            res.json({ success: true, data: results });
        });
    });
});


app.get('/get-theses-status', (req, res) => {
    const studentAm = req.session.user.am;
    const statusFilter = req.query.status;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Thesis not found for the student' });
        }

        res.json({ success: true, thesis_id: results[0].thesis_id });
        console.log('Thesis id:', results[0].thesis_id);
    });
});

// Route handler for fetching announcements within a specified date range
app.get('/announcements', (req, res) => {
    const { startDate, endDate, format } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Missing startDate or endDate' });
    }

    const query = `
        SELECT 
            Theses.title, 
            Students.student_name, 
            Presentations.presentation_date, 
            Presentations.presentation_time, 
            Presentations.presentation_type, 
            Presentations.presentation_location, 
            Presentations.presentation_link
        FROM Theses
        JOIN Students ON Theses.student_am = Students.student_am
        JOIN Presentations ON Theses.thesis_id = Presentations.thesis_id
        WHERE Presentations.presentation_date BETWEEN ? AND ?
    `;

    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error fetching announcements:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        if (format === 'xml') {
            const builder = new xml2js.Builder();
            const xml = builder.buildObject({ announcements: results });
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        } else {
            res.json({ success: true, data: results });
        }
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
    const teacher_am = req.session.user.am;

    const query = `
        INSERT INTO Theses (title, summary, pdf_path, teacher_am, status)
        VALUES (?, ?, ?, ?, 'Υπό Ανάθεση')
    `;
    
    const values = [title, description, pdfPath, teacher_am || null];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting thesis:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
            return;
        }

        const query2 = `
            INSERT INTO Committees (thesis_id, teacher_am, role, response, invitation_date, response_date)
            VALUES (LAST_INSERT_ID(), ?, 'Επιβλέπων', 'Αποδοχή', NOW(), NOW())
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

// Assign a thesis to a student
app.post("/assign-theses", (req, res) => {
    const { thesisId, studentAm } = req.body;

    if (!thesisId || !studentAm) {
        return res.status(400).json({ success: false, message: 'Missing thesisId or studentAm' });
    }

    const query = 'UPDATE Theses SET student_am = ? WHERE thesis_id = ?';
    db.query(query, [studentAm, thesisId], (err, results) => {
        if (err) {
            console.error('Error assigning thesis:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const query2 = 'INSERT INTO Assignments (thesis_id, student_am, assigned_date, status) VALUES (?, ?, NOW(), "Προσωρινή")';
        db.query(query2, [thesisId, studentAm], (err) => {
            if (err) {
                console.error('Error inserting assignment:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        
            res.json({ success: true, message: 'Thesis assigned successfully' });
        });
    });
});

// Route handler for cancelling an assignment
app.post('/cancel-assignment/:id', (req, res) => {
    const thesisId = req.params.id;
    const query = `
        UPDATE Theses 
        SET status = 'Ακυρωμένη', student_am = NULL 
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

        res.json({ success: true, message: 'Invitation accepted successfully!' });
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
        res.json({ success: true, message: 'Invitation rejected successfully!' });
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
        res.json({ success: true, message: 'Note added successfully!' });
    });
});

// Route handler for retrieving notes for a specific thesis
app.get('/get-notes/:thesis_id', (req, res) => {
    const thesis_id = req.params.thesis_id;
    const teacher_am = req.session.user.am;

    if (!teacher_am) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const query = `
        SELECT * FROM Notes
        WHERE thesis_id = ? AND teacher_am = ?
        ORDER BY created_at DESC
    `;
    db.query(query, [thesis_id, teacher_am], (err, results) => {
        if (err) {
            console.error('Error fetching notes:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
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
            return res.status(403).json({ success: false, message: "You are not the supervisor of this thesis." });
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
                return res.status(500).json({ success: false, message: "Internal Server Error" });
            }

            res.json({ success: true, message: "Status changed successfully!" });
        });
    });
});

// Route handler for submitting a grade
app.post('/submit-grade', (req, res) => {
    const { thesis_id, grade } = req.body;
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
            return res.status(403).json({ success: false, message: "You are not a member of the committee for this thesis." });
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
                return res.status(400).json({ success: false, message: "You have already submitted a grade for this thesis." });
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
                res.json({ success: true, message: 'Grade submitted successfully!' });
            });
        });
    });
});

// Route handler for updating a grade
app.post('/update-grade', (req, res) => {
    const { thesis_id, grade } = req.body;
    const teacherAM = req.session.user.am;

    if (!teacherAM) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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
        if (gradeResults.length === 0) {
            return res.status(400).json({ success: false, message: "You have not submitted a grade for this thesis." });
        }

        // Update the grade
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
            res.json({ success: true, message: 'Grade updated successfully!' });
        });
    });
});

// Διαδρομή για εισαγωγή JSON δεδομένων
app.post('/import-json', (req, res) => {
    if (!req.files || !req.files.jsonFile) {
        return res.status(400).send('No file uploaded.');
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
                return res.status(500).send('Error inserting students into the database.');
            }

            // Εκτέλεση ερωτήματος για εισαγωγή διδασκόντων
            db.query(insertTeachers, [teacherData], (err) => {
                if (err) {
                    console.error('Error inserting teachers:', err);
                    return res.status(500).send('Error inserting teachers into the database.');
                }

                res.send({ message: 'JSON uploaded and processed successfully!' });
            });
        });
    } catch (error) {
        console.error('Error processing JSON file:', error);
        res.status(400).send('Invalid JSON file.');
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
            return res.status(404).json({ success: false, message: 'Thesis not found' });
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

            res.json({ success: true, message: 'Teacher invited successfully!' });
        });
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

app.post('/update-profile-st', (req, res) => {
    const studentAm = req.session.user?.am; // Αναγνωριστικό φοιτητή από το session
    const { home_address, email, mobile_phone, landline_phone } = req.body;

    if (!studentAm) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
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

            return res.json({ success: true, message: 'Profile updated successfully' });
        }
    );
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
