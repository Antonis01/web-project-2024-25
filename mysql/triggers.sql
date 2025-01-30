-- Drop the existing trigger
DROP TRIGGER IF EXISTS prevent_duplicate_student_am;

-- Create the new trigger
DELIMITER ??

CREATE TRIGGER prevent_duplicate_student_am
BEFORE INSERT ON Theses
FOR EACH ROW
BEGIN
    IF NEW.student_am IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM Theses WHERE student_am = NEW.student_am) > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ο φοιτητής έχει ήδη ανατεθεί σε άλλη διπλωματική εργασία';
        END IF;
    END IF;
END ??

DELIMITER ;

-- Drop the existing trigger
DROP TRIGGER IF EXISTS prevent_duplicate_student_am_update;

-- Create the new trigger for update
DELIMITER ??

CREATE TRIGGER prevent_duplicate_student_am_update
BEFORE UPDATE ON Theses
FOR EACH ROW
BEGIN
    IF NEW.student_am IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM Theses WHERE student_am = NEW.student_am AND thesis_id != OLD.thesis_id) > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ο φοιτητής έχει ήδη ανατεθεί σε άλλη διπλωματική εργασία';
        END IF;
    END IF;
END ??

DELIMITER ;