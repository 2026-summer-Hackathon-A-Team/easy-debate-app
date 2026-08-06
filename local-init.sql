CREATE DATABASE IF NOT EXISTS `easy-debate_shadow`
    CHARACTER SET utf8mb4;

CREATE USER IF NOT EXISTS 'db_user_shadow'@'%' IDENTIFIED BY 'password-shadow';

GRANT CREATE, ALTER, DROP, INDEX, REFERENCES, SELECT, INSERT, UPDATE, DELETE
    ON `easy-debate\_shadow`.* TO 'db_user_shadow'@'%';