INSERT INTO roles VALUES 
(1, 'teacher'),
(2, 'student'),
(3, 'secretary');

INSERT INTO Students (student_am, role_id, student_username, student_password, student_name, email, home_address, mobile_phone, landline_phone) VALUES
(10433999, 2, '10433999', '1234', 'Makis Makopoulos', '104333999@students.upatras.gr', 'test street 45, test city 39955', '6939096979', '2610333000'),
(10434000, 2, '10434000', '1234', 'John Lennon', 'st10434000@upnet.gr', 'Ermou 18, Athens 10431', '6970001112', '2610123456'),
(10434001, 2, '10434001', '1234', 'Petros Verikokos', 'st10434001@upnet.gr', 'Adrianou 20, Thessaloniki 54248', '6970001112', '2610778899'),
(10434002, 2, '10434002', '1234', 'test name', 'st10434002@upnet.gr', 'str 1, patra 26222', '6912345678', '2610123456'),
(10434003, 2, '10434003', '1234', 'Robert Smith', 'st10434003@upnet.gr', 'Fascination 17, London 1989', '6902051989', '2610251989'),
(10434004, 2, '10434004', '1234', 'Rex Tyrannosaurus', 'st10434004@upnet.gr', 'Cretaceous 2, Laramidia 54321', '6911231234', '2610432121'),
(10434005, 2, '10434005', '1234', 'Paul Mescal', 'st10434005@upnet.gr', 'Smith Str. 33, New York 59', 'unknown', 'unknown'),
(10434006, 2, '10434006', '1234', 'Pedro Pascal', 'st10434006@upnet.gr', 'Johnson 90, New York 70', 'unknown', 'unknown'),
(10434007, 2, '10434007', '1234', 'David Gilmour', 'st10434007@upnet.gr', 'Sortef 29, New York 26', 'unknown', 'unknown'),
(10434008, 2, '10434008', '1234', 'Lana Del Rey', 'st10434008@upnet.gr', 'Groove Str. 23, Los Angeles 1', 'unknown', 'unknown'),
(10434009, 2, '10434009', '1234', 'Stevie Nicks', 'st10434009@upnet.gr', 'Magic Str. 8, New Orleans 35', '67', '56'),
(10434010, 2, '10434010', '1234', 'Margaret Qualley', 'st10434010@upnet.gr', 'Substance Str. 25, Los Angeles 7', '90', '67');

-- Insert statements for teachers (with required fields only)
INSERT INTO Teachers (teacher_am, role_id, teacher_username, teacher_password, teacher_name, email) VALUES
(1, 1, 'akomninos@ceid.upatras.gr', '1234', 'Andreas Komninos', 'akomninos@ceid.upatras.gr'),
(7, 1, 'vasfou@ceid.upatras.gr', '1234', 'Vasilis Foukaras', 'vasfou@ceid.upatras.gr'),
(8, 1, 'karras@nterti.com', '1234', 'Basilis Karras', 'karras@nterti.com'),
(9, 1, 'eleni@ceid.gr', '1234', 'Eleni Voyiatzaki', 'eleni@ceid.gr'),
(10, 1, 'hozier@ceid.upatras.gr', '1234', 'Andrew Hozier Byrne', 'hozier@ceid.upatras.gr'),
(11, 1, 'nikos.korobos12@gmail.com', '1234', 'Nikos Korobos', 'nikos.korobos12@gmail.com');

INSERT INTO Secretary (secretary_am, role_id, secretary_username, secretary_password) VALUES
(2, 3, 'secretary', '1234');