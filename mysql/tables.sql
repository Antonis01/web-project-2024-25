CREATE TABLE roles (
	id INT NOT NULL AUTO_INCREMENT,
	roles ENUM('teacher', 'student', 'secretary'),

	PRIMARY KEY (id)
	
) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE teacher (
	teacher_id INT NOT NULL AUTO_INCREMENT,
	teacher_username VARCHAR(30) DEFAULT 'unkown' NOT NULL,
	teacher_password VARCHAR(30) DEFAULT 'unkown' NOT NULL,

	UNIQUE (teacher_username),
	PRIMARY KEY (teacher_id),

	FOREIGN KEY (teacher_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;


CREATE TABLE student  (
	student_id INT NOT NULL AUTO_INCREMENT,
	student_username VARCHAR(30) DEFAULT 'unkown' NOT NULL,
	student_password VARCHAR(30) DEFAULT 'unkown' NOT NULL,

	UNIQUE (student_username),
	PRIMARY KEY (student_id),

	FOREIGN KEY (student_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;


CREATE TABLE secretary (
	secretary_id INT NOT NULL AUTO_INCREMENT,
	secretary_username VARCHAR(30) DEFAULT 'unkown' NOT NULL,
	secretary_password VARCHAR(30) DEFAULT 'unkown' NOT NULL,

	UNIQUE (secretary_username),
	PRIMARY KEY (secretary_id),

	FOREIGN KEY (secretary_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;

CREATE TABLE diplomatic_exercise  (
	diplomatic_exercise_id INT NOT NULL AUTO_INCREMENT,
	diplomatic_exercise_username VARCHAR(30) DEFAULT 'unkown' NOT NULL,
	student_password VARCHAR(30) DEFAULT 'unkown' NOT NULL,

	UNIQUE (diplomatic_exercise_username),
	PRIMARY KEY (diplomatic_exercise_id),

	FOREIGN KEY (diplomatic_exercise_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
    

) ENGINE = InnoDB CHARACTER SET greek COLLATE greek_general_ci;
