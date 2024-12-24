INSERT INTO roles VALUES 
(1, 'teacher'),
(2, 'student'),
(3, 'secretary');

INSERT INTO Teachers (teacher_am, role_id, teacher_username, teacher_password, teacher_name, email) VALUES
(1, 1, 'mike_tyson', '1234', 'Mike Tyson', 'miketyson@gmail.com'),
(4, 1, 'leclerc', '1234', 'Charles Leclerc', 'leclerc@gmail.com'),
(9, 1, 'rodinei', '1234', 'rodinei', 'rodinei@gmail.com');

INSERT INTO Students (student_am, role_id, student_username, student_password, student_name, email) VALUES
(2, 2, 'mike', '1111', 'mike', 'mike@gmail.com'),
(5, 2, 'test1', 'test2', 'Test Test', 'test@gmail.com'),
(6, 2, 'test2', 'test2', 'Test2 Test', 'test2@gmail.com'),
(7, 2, 'Test3', 'test3', 'Test3 Test', 'test3@gmail.com'),
(8, 2, 'Test4', 'test4', 'Test4 Test', 'test4@gmail.com');

INSERT INTO Secretary (secretary_am, role_id, secretary_username, secretary_password) VALUES
(3, 3, 'ion', '2222');

INSERT INTO Theses (thesis_id, title, summary, pdf_path, status, teacher_am, student_am, final_submission_date) VALUES
(5, '1', '1', 'uploads/file-1732056646481.pdf', 'Ενεργή', 1, 2, '2024-11-29'),
(6, '2', '2', 'uploads/file-1732111707033.pdf', 'Υπό Ανάθεση', 1, NULL, NULL),
(7, '3', '3', 'uploads/file-1732111784608.pdf', 'Ακυρωμένη', 1, NULL, NULL),
(8, 'r', 't', 'uploads/file-1732130764007.pdf', 'Ενεργή', 1, 6, NULL),
(10, 'uuu', 'qqqqqqqqq', 'uploads/file-1732300444244.pdf', 'Υπό Ανάθεση', 1, NULL, NULL),
(11, 'ferrari', 'hehe', 'uploads/file-1732724620698.pdf', 'Υπό Ανάθεση', 4, NULL, NULL),
(12, 'hehe', 'haha', 'uploads/file-1733061141563.pdf', 'Υπό Ανάθεση', 1, NULL, NULL);

INSERT INTO Assignments (assignment_id, thesis_id, student_am, assigned_date, status) VALUES
(1, 5, 2, '2024-11-20', 'Προσωρινή');

INSERT INTO Committees (committee_id, thesis_id, assignment_id, teacher_am, role, response, invitation_date, response_date, teacher_am2, role2, response2, invitation_date2, response_date2, teacher_am3, role3, response3, invitation_date3, response_date3) VALUES
(1, 5, 1, 1, 'Επιβλέπων', 'Αποδοχή', '2024-11-28', '2024-11-28', 4, 'Μέλος', 'Αποδοχή', '2024-11-28', '2024-11-28', 9, 'Μέλος', 'Αποδοχή', '2024-11-28', '2024-11-28'),
(2, 12, NULL, 1, 'Επιβλέπων', NULL, NULL, NULL, NULL, 'Επιβλέπων', NULL, NULL, NULL, NULL, 'Επιβλέπων', NULL, NULL, NULL);

INSERT INTO Presentations (thesis_id, presentation_date, presentation_time, presentation_type, presentation_location, presentation_link)
VALUES (1, '2023-12-15', '10:00:00', 'in-person', 'Room 101', NULL);

INSERT INTO Presentations (thesis_id, presentation_date, presentation_time, presentation_type, presentation_location, presentation_link)
VALUES (2, '2023-12-16', '11:00:00', 'online', NULL, 'https://example.com/meeting-link');