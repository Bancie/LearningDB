USE study;

DROP TABLE IF EXISTS PERFORMANCE_SCORE;

ALTER TABLE ACTIVITY_LOG
DROP COLUMN ACTLOG_FINISH;

ALTER TABLE ACTIVITY_LOG
DROP COLUMN LEVELRATED;

CREATE TABLE ACTIVITY_OUTPUT (
    AO_ID INT NOT NULL AUTO_INCREMENT,
    ACTI_LOG_ID INT NOT NULL,
    AO_FINISH TIME,
    BREAK_LEVEL ENUM('none', 'short', 'moderate', 'long'),
    AO_DIFFICULTY ENUM('effortless', 'very easy', 'easy', 'moderate', 'hard', 'very hard', 'overwhelming'),
    AO_SATISFACTION ENUM('unsatisfied', 'neutral', 'satisfied'),
    FOCUS_LEVEL ENUM('very low', 'low', 'medium', 'high', 'very high'),
    TARGET_MET BOOLEAN,
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (ACTI_LOG_ID) REFERENCES ACTIVITY_LOG(ACTI_LOG_ID) ON DELETE CASCADE
);

USE study;

ALTER TABLE DAY
DROP COLUMN BEDTIME;

ALTER TABLE DAY
DROP COLUMN WAKETIME;

USE study;

DROP TABLE IF EXISTS SLEEP_LOG;

CREATE TABLE SLEEP_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    SLEEP_START DATETIME NOT NULL,
    SLEEP_END DATETIME,
    SLEEP_TYPE ENUM('night', 'nap', 'recovery', 'fragmented', 'other'),
    SLEEP_QUALITY ENUM('very poor', 'poor', 'fair', 'good', 'very good', 'excellent'),
    DREAM ENUM('none', 'vague', 'vivid'),
    WAKE_COUNT INT,
    FELL_ASLEEP ENUM('easy', 'normal', 'difficult'),
    WAKE_FEELING ENUM('very_groggy', 'groggy', 'neutral', 'refreshed', 'energized'),
    SLEEP_ENVIRONMENT ENUM('terrible', 'poor', 'fair', 'good', 'excellent'),
    ALARM_USED BOOLEAN,
    PRIMARY KEY (USER_ID, DAY_ID, SLEEP_START),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES DAY(DAY_ID) ON DELETE CASCADE
)

USE study;

ALTER TABLE SLEEP_LOG
MODIFY COLUMN WAKE_FEELING ENUM('very groggy', 'groggy', 'neutral', 'refreshed', 'energized');