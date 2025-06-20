CREATE DATABASE IF NOT EXISTS study;
USE study;

-- USER Table
CREATE TABLE `USER` (
    USER_ID INT NOT NULL AUTO_INCREMENT,
    NAME VARCHAR(100) CHARACTER SET utf8mb4 NOT NULL,
    BIRTH DATE NOT NULL,
    GENDER ENUM('male', 'female', 'other') NOT NULL,
    MAJOR VARCHAR(100) NOT NULL,
    LOCATION VARCHAR(100) NOT NULL,
    PRIMARY KEY (USER_ID)
);

-- ACTIVITY Table
CREATE TABLE ACTIVITY (
    ACTIVITY_ID INT NOT NULL AUTO_INCREMENT,
    CATEGORY VARCHAR(100) NOT NULL,
    TAGS ENUM('mental', 'productive', 'physical', 'emotional', 'social', 'entertainment', 'other'),
    BENCHMARK_MIN FLOAT,
    PRIMARY KEY (ACTIVITY_ID)
);

-- SOUND Table
CREATE TABLE SOUND (
    SOUND_ID INT NOT NULL AUTO_INCREMENT,
    CATEGORY ENUM('music', 'white-noise', 'ambient-noise', 'silence', 'podcast', 'construction', 'nature', 'unknown'),
    SOURCE ENUM('headphones', 'earbuds', 'speakers', 'public', 'private room', 'unknown'),
    SOUND_INTENSITY ENUM('very low', 'low', 'medium', 'high', 'very high'),
    GENRE_MUSIC ENUM('lo-fi', 'classical', 'jazz', 'pop', 'rock', 'edm', 'hip-hop', 'chill', 'ambient', 'instrumental', 'nature sounds', 'soundtrack', 'acoustic', 'other'),
    ORIGIN ENUM('us-uk', 'vpop', 'kpop', 'jpop', 'cpop', 'euro-pop', 'latin', 'indie', 'mixed', 'other'),
    NC_ON BOOLEAN,
    PRIMARY KEY (SOUND_ID)
);

-- DAY Table
CREATE TABLE `DAY` (
    DAY_ID INT NOT NULL AUTO_INCREMENT,
    USER_ID INT NOT NULL,
    `DAY` DATE,
    BEDTIME DATETIME,
    WAKETIME DATETIME,
    FITNESS BOOLEAN,
    COOKED BOOLEAN,
    PRIMARY KEY (DAY_ID),
    FOREIGN KEY (USER_ID) REFERENCES `USER`(USER_ID) ON DELETE CASCADE
);

-- NAP Table
CREATE TABLE NAP (
    DAY_ID INT NOT NULL,
    USER_ID INT NOT NULL,
    `START` TIME NOT NULL,
    `WAKE` TIME,
    QUALITY ENUM('very tired', 'tired', 'neutral', 'refreshed', 'very refreshed'),
    PRIMARY KEY (DAY_ID, USER_ID, `START`),
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE,
    FOREIGN KEY (USER_ID) REFERENCES `USER`(USER_ID) ON DELETE CASCADE
);

-- SHOWER_LOG Table
CREATE TABLE SHOWER_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    `START` TIME NOT NULL,
    `FINISH` TIME,
    TEMP ENUM('cold', 'warm', 'hot'),
    PRIMARY KEY (USER_ID, DAY_ID, `START`),
    FOREIGN KEY (USER_ID) REFERENCES `USER`(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);

-- EATING_LOG Table
CREATE TABLE EATING_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    `TIME` TIME NOT NULL,
    TYPE ENUM('breakfast', 'lunch', 'dinner', 'snack', 'supper', 'midnight snack', 'drinking'),
    FOOD ENUM('main dish', 'fast-food', 'junk-food', 'soup', 'snack', 'side-dish', 'dessert', 'beverage', 'fruit', 'vegetable', 'other'),
    AMOUNT FLOAT,
    UNIT ENUM('gr', 'ml', 'bowls', 'cups', 'pieces', 'slices', 'plates', 'servings'),
    KCAL FLOAT,
    SOURCE ENUM('home cooked', 'ordered', 'takeaway', 'prepackaged', 'friend made', 'canteen', 'outside', 'restaurant', 'other'),
    HEALTHINESS ENUM('very unhealthy', 'unhealthy', 'neutral', 'healthy', 'super healthy'),
    PRIMARY KEY (USER_ID, DAY_ID, `TIME`),
    FOREIGN KEY (USER_ID) REFERENCES `USER`(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);

-- ACTIVITY_LOG Table
CREATE TABLE ACTIVITY_LOG (
    ACTI_LOG_ID INT NOT NULL AUTO_INCREMENT,
    USER_ID INT NOT NULL,
    ACTIVITY_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    SOUND_ID INT NOT NULL,
    `START` TIME,
    `FINISH` TIME,
    AC_ON BOOLEAN,
    AC_TEMP FLOAT,
    DEVICE ENUM('laptop', 'smartphone', 'book', 'tablet', 'other'),
    LOCATION ENUM('home', 'library', 'cafe', 'school', 'work', 'traveling', 'park', 'gym', 'other'),
    WEATHER ENUM('stormy', 'rainy', 'cloudy', 'clear', 'sunny'),
    TEMPERATURE ENUM('cold', 'normal', 'hot'),
    AQI INT,
    PM25 INT,
    HUMIDITY INT,
    MOOD ENUM('angry', 'frustrated', 'depressed', 'very sad', 'sad', 'tired', 'neutral', 'content', 'happy', 'very happy', 'excited'),
    HEALTH ENUM('poor', 'normal', 'good'),
    ENERGY ENUM('low', 'normal', 'high'),
    HUNGER ENUM('starving', 'very hungry', 'hungry', 'satisfied', 'full'),
    AROUSAL ENUM('unresponsive', 'low alert', 'drowsy', 'focused', 'hyper alert'),
    LEVELRATED ENUM('very poor', 'poor', 'fair', 'good', 'excellent'),
    PRIMARY KEY (ACTI_LOG_ID),
    FOREIGN KEY (USER_ID) REFERENCES `USER`(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (ACTIVITY_ID) REFERENCES ACTIVITY(ACTIVITY_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE,
    FOREIGN KEY (SOUND_ID) REFERENCES SOUND(SOUND_ID) ON DELETE CASCADE
);

-- PERFORMANCE_SCORE Table
CREATE TABLE PERFORMANCE_SCORE (
    PERSCORE_ID INT NOT NULL AUTO_INCREMENT,
    ACTI_LOG_ID INT NOT NULL,
    SCORE_TYPE ENUM('practice', 'test', 'assignment', 'self-evaluation', 'peer-evaluation', 'teacher-feedback', 'presentation', 'project', 'other'),
    VALUE FLOAT,
    UNIT ENUM('points', 'percentage', 'stars', 'grade', 'level', 'minutes', 'hours', 'sec', 'rank', 'scale-10', 'scale-5', 'boolean', 'count', 'words', 'tasks', 'steps', 'none'),
    `MAX` FLOAT,
    TARGET_MET BOOLEAN,
    PRIMARY KEY (PERSCORE_ID),
    FOREIGN KEY (ACTI_LOG_ID) REFERENCES ACTIVITY_LOG(ACTI_LOG_ID) ON DELETE CASCADE
);

-- SEXUAL_LOG Table
CREATE TABLE SEXUAL_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    `TIME` TIME NOT NULL,
    DURING ENUM('short', 'medium', 'long'),
    PARTNERED BOOLEAN,
    SATISFACTION BOOLEAN,
    LOCATION ENUM('room', 'bedroom', 'bathroom', 'hotel', 'car', 'public place', 'living room', 'partner home', 'other'),
    PRIMARY KEY (USER_ID, DAY_ID, `TIME`),
    FOREIGN KEY (USER_ID) REFERENCES `USER`(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);