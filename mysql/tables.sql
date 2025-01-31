CREATE TABLE roles (
    id INT NOT NULL,
    roles ENUM('teacher', 'student', 'secretary'),
    PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Teachers (
    teacher_am INT UNIQUE NOT NULL,
    role_id INT NOT NULL,
    teacher_username VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    teacher_password VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    teacher_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    UNIQUE (teacher_username),
    PRIMARY KEY (teacher_am),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Students (
    student_am INT UNIQUE NOT NULL,
    role_id INT NOT NULL,
    student_username VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    student_password VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    home_address VARCHAR(100) DEFAULT 'unknown' NOT NULL,
    mobile_phone VARCHAR(15) DEFAULT 'unknown' NOT NULL,
    landline_phone VARCHAR(15) DEFAULT 'unknown' NOT NULL,
    UNIQUE (student_username),
    PRIMARY KEY (student_am),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Secretary (
    secretary_am INT UNIQUE NOT NULL,
    role_id INT NOT NULL,
    secretary_username VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    secretary_password VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    UNIQUE (secretary_username),
    PRIMARY KEY (secretary_am),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Theses (
    thesis_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    pdf_path VARCHAR(255),
    status ENUM('Υπό Ανάθεση', 'Ενεργή', 'Υπό Εξέταση', 'Περατωμένη', 'Ακυρωμένη') NULL,
    teacher_am INT,
    student_am INT,
    final_submission_date DATE DEFAULT NULL,
    theses_pdf_draft_path VARCHAR(255),
    FOREIGN KEY (teacher_am) REFERENCES Teachers(teacher_am),
    FOREIGN KEY (student_am) REFERENCES Students(student_am)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    student_am INT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    status ENUM('Προσωρινή', 'Οριστική') NOT NULL,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (student_am) REFERENCES Students(student_am)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Committees (
    committee_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    teacher_am INT,
    role ENUM('Επιβλέπων', 'Μέλος') NOT NULL,
    response ENUM('Αποδοχή', 'Απόρριψη') DEFAULT NULL,
    invitation_date DATE DEFAULT NULL,
    response_date DATE DEFAULT NULL,
    teacher_am2 INT,
    role2 ENUM('Επιβλέπων', 'Μέλος') DEFAULT NULL,
    response2 ENUM('Αποδοχή', 'Απόρριψη') DEFAULT NULL,
    invitation_date2 DATE DEFAULT NULL,
    response_date2 DATE DEFAULT NULL,
    teacher_am3 INT,
    role3 ENUM('Επιβλέπων', 'Μέλος') DEFAULT NULL,
    response3 ENUM('Αποδοχή', 'Απόρριψη') DEFAULT NULL,
    invitation_date3 DATE DEFAULT NULL,
    response_date3 DATE DEFAULT NULL,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (teacher_am) REFERENCES Teachers(teacher_am),
    FOREIGN KEY (teacher_am2) REFERENCES Teachers(teacher_am),
    FOREIGN KEY (teacher_am3) REFERENCES Teachers(teacher_am),
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Notes (
    note_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    teacher_am INT,
    content VARCHAR(300) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (teacher_am) REFERENCES Teachers(teacher_am)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Grades (
    grade_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    teacher_am INT,
    grade DECIMAL(4, 2) NOT NULL,
    criteria TEXT,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (teacher_am) REFERENCES Teachers(teacher_am),
    CHECK (grade >= 0.0 AND grade <= 10.0)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Presentations (
    presentation_id INT AUTO_INCREMENT PRIMARY KEY,
    thesis_id INT NOT NULL,
    presentation_date DATE NOT NULL,
    presentation_time TIME NOT NULL,
    presentation_type ENUM('in-person', 'online') NOT NULL,
    presentation_location VARCHAR(255) DEFAULT NULL,
    presentation_link VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;