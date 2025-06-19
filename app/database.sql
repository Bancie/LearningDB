CREATE DATABASE bigbrain;

USE bigbrain;

CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    activity VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);