CREATE DATABASE IF NOT EXISTS study;
USE study;

-- USER Table
CREATE TABLE USERS (
    USER_ID INT NOT NULL AUTO_INCREMENT,
    FULLNAME VARCHAR(100) CHARACTER SET utf8mb4 NOT NULL,
    BIRTH DATE NOT NULL,
    GENDER ENUM('male', 'female', 'other') NOT NULL,
    MAJOR VARCHAR(100) NOT NULL,
    USER_LOCATION VARCHAR(100) NOT NULL,
    PRIMARY KEY (USER_ID)
);

-- ACTIVITY Table
CREATE TABLE ACTIVITY (
    ACTIVITY_ID INT NOT NULL AUTO_INCREMENT,
    ACTIVITY_CATEGORY VARCHAR(100) NOT NULL,
    ACTIVITY_TAGS ENUM('mental', 'productive', 'physical', 'emotional', 'social', 'entertainment', 'other'),
    ACT_BENCHMARK_MIN FLOAT,
    PRIMARY KEY (ACTIVITY_ID)
);

-- SOUND Table
CREATE TABLE SOUND (
    SOUND_ID INT NOT NULL AUTO_INCREMENT,
    SOUND_CATEGORY ENUM('music', 'white_noise', 'ambient_noise', 'silence', 'podcast', 'construction', 'nature', 'unknown'),
    SOUND_SOURCE ENUM('headphones', 'earbuds', 'speakers', 'public', 'private room', 'unknown'),
    SOUND_INTENSITY ENUM('very low', 'low', 'medium', 'high', 'very high'),
    GENRE_MUSIC ENUM('lo_fi', 'classical', 'jazz', 'pop', 'rock', 'edm', 'hip_hop', 'chill', 'ambient', 'instrumental', 'nature sounds', 'soundtrack', 'acoustic', 'random', 'other'),
    MUSIC_ORIGIN ENUM('us_uk', 'vpop', 'kpop', 'jpop', 'cpop', 'euro_pop', 'latin', 'indie', 'mixed', 'random', 'other'),
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
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
);

-- NAP Table
CREATE TABLE NAP (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    NAP_START TIME NOT NULL,
    NAP_WAKE TIME,
    NAP_QUALITY ENUM('very tired', 'tired', 'neutral', 'refreshed', 'very refreshed'),
    PRIMARY KEY (USER_ID, DAY_ID, NAP_START),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);

-- SHOWER_LOG Table
CREATE TABLE SHOWER_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    SHOWER_START TIME NOT NULL,
    SHOWER_DURING ENUM('short', 'medium', 'long'),
    SHOWER_TEMP ENUM('cold', 'warm', 'hot'),
    PRIMARY KEY (USER_ID, DAY_ID, SHOWER_START),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);

-- EATING_LOG Table
CREATE TABLE EATING_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    EAT_TIME TIME NOT NULL,
    EAT_TYPE ENUM('breakfast', 'lunch', 'dinner', 'snack', 'supper', 'midnight snack', 'drinking'),
    FOOD ENUM('main dish', 'fast_food', 'junk_food', 'soup', 'snack', 'side_dish', 'dessert', 'beverage', 'fruit', 'vegetable', 'other'),
    EAT_AMOUNT ENUM('small', 'medium', 'large'),
    FOOD_SOURCE ENUM('home cooked', 'ordered', 'takeaway', 'prepackaged', 'friend made', 'canteen', 'outside', 'restaurant', 'other'),
    HEALTHINESS ENUM('very unhealthy', 'unhealthy', 'neutral', 'healthy', 'super healthy'),
    PRIMARY KEY (USER_ID, DAY_ID, EAT_TIME),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);

-- ACTIVITY_LOG Table
CREATE TABLE ACTIVITY_LOG (
    ACTI_LOG_ID INT NOT NULL AUTO_INCREMENT,
    USER_ID INT NOT NULL,
    ACTIVITY_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    SOUND_ID INT NOT NULL,
    ACTLOG_START TIME,
    ACTLOG_FINISH TIME,
    AC_ON BOOLEAN,
    AC_TEMP FLOAT,
    DEVICE ENUM('laptop', 'smartphone', 'book', 'tablet', 'other'),
    ACTLOG_LOCATION ENUM('home', 'library', 'cafe', 'school', 'work', 'traveling', 'park', 'gym', 'other'),
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
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (ACTIVITY_ID) REFERENCES ACTIVITY(ACTIVITY_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE,
    FOREIGN KEY (SOUND_ID) REFERENCES SOUND(SOUND_ID) ON DELETE CASCADE
);

-- PERFORMANCE_SCORE Table
CREATE TABLE PERFORMANCE_SCORE (
    PERSCORE_ID INT NOT NULL AUTO_INCREMENT,
    ACTI_LOG_ID INT NOT NULL,
    SCORE_TYPE ENUM('practice', 'test', 'assignment', 'self_evaluation', 'peer_evaluation', 'teacher_feedback', 'presentation', 'project', 'other'),
    SCORE_VALUE FLOAT,
    SCORE_UNIT ENUM('points', 'percentage', 'stars', 'grade', 'level', 'minutes', 'hours', 'sec', 'rank', 'scale_10', 'scale_5', 'boolean', 'count', 'words', 'tasks', 'steps', 'none'),
    SCORE_MAX FLOAT,
    TARGET_MET BOOLEAN,
    PRIMARY KEY (PERSCORE_ID),
    FOREIGN KEY (ACTI_LOG_ID) REFERENCES ACTIVITY_LOG(ACTI_LOG_ID) ON DELETE CASCADE
);

-- SEXUAL_LOG Table
CREATE TABLE SEXUAL_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    SEXLOG_TIME TIME NOT NULL,
    SEXLOG_DURING ENUM('short', 'medium', 'long'),
    PARTNERED BOOLEAN,
    SATISFACTION BOOLEAN,
    SEXLOG_LOCATION ENUM('room', 'bedroom', 'bathroom', 'hotel', 'car', 'public place', 'living room', 'partner home', 'other'),
    PRIMARY KEY (USER_ID, DAY_ID, SEXLOG_TIME),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);

-- SAMSUNG_PHONE_SCREEN Table
CREATE TABLE SAMSUNG_PHONE_SCREEN (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    SCREEN_TIME FLOAT,
    SOCIAL FLOAT,
    PRODUCT_FIN FLOAT,
    AUDIO FLOAT,
    IMAGE FLOAT,
    MAP_TRAVEL FLOAT,
    VIDEO FLOAT,
    ACCESSIBILITY FLOAT,
    GAMES FLOAT,
    HEALTH_FIT FLOAT,
    NEWS_INF FLOAT,
    SHOPPING_FOOD FLOAT,
    OTHER_USAGE FLOAT,
    PRIMARY KEY (USER_ID, DAY_ID),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES `DAY`(DAY_ID) ON DELETE CASCADE
);