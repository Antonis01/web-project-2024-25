CREATE TABLE roles (
    id INT NOT NULL AUTO_INCREMENT,
    roles ENUM('teacher', 'student', 'secretary'),
    PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Instructors (
    instructor_id INT NOT NULL AUTO_INCREMENT,
    teacher_username VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    teacher_password VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    teacher_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    UNIQUE (teacher_username),
    PRIMARY KEY (instructor_id),
    FOREIGN KEY (instructor_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Students (
    student_id INT NOT NULL AUTO_INCREMENT,
    student_username VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    student_password VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    am VARCHAR(20) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    UNIQUE (student_username),
    PRIMARY KEY (student_id),
    FOREIGN KEY (student_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Secretary (
    secretary_id INT NOT NULL AUTO_INCREMENT,
    secretary_username VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    secretary_password VARCHAR(30) DEFAULT 'unknown' NOT NULL,
    UNIQUE (secretary_username),
    PRIMARY KEY (secretary_id),
    FOREIGN KEY (secretary_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Theses (
    thesis_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    pdf_path VARCHAR(255),
    status ENUM('Υπό Ανάθεση', 'Ενεργή', 'Υπό Εξέταση', 'Περατωμένη', 'Ακυρωμένη') NOT NULL,
    instructor_id INT,
    student_id INT,
    final_submission_date DATE DEFAULT NULL,
    FOREIGN KEY (instructor_id) REFERENCES Instructors(instructor_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    student_id INT,
    assigned_date DATE,
    status ENUM('Προσωρινή', 'Οριστική') NOT NULL,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Committees (
    committee_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    instructor_id INT,
    assignment_id INT,
    role ENUM('Επιβλέπων', 'Μέλος') NOT NULL,
    response ENUM('Αποδοχή', 'Απόρριψη') DEFAULT NULL,
    invitation_date DATE DEFAULT NULL,
    response_date DATE DEFAULT NULL,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (instructor_id) REFERENCES Instructors(instructor_id),
    FOREIGN KEY (assignment_id) REFERENCES Assignments(assignment_id)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Notes (
    note_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    instructor_id INT,
    content VARCHAR(300) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (instructor_id) REFERENCES Instructors(instructor_id)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE Grades (
    grade_id INT PRIMARY KEY AUTO_INCREMENT,
    thesis_id INT,
    instructor_id INT,
    grade DECIMAL(3, 2) NOT NULL,
    criteria TEXT,
    FOREIGN KEY (thesis_id) REFERENCES Theses(thesis_id),
    FOREIGN KEY (instructor_id) REFERENCES Instructors(instructor_id)
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;