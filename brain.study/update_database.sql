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

USE study;
DROP TABLE IF EXISTS NAP;

USE study;
ALTER TABLE SLEEP_LOG
MODIFY COLUMN ALARM_USED ENUM('silent', 'low', 'medium', 'loud');

USE study;
ALTER TABLE SLEEP_LOG
MODIFY COLUMN ALARM_USED ENUM('none', 'silent', 'low', 'medium', 'loud');

USE study;
ALTER TABLE SLEEP_LOG
ADD PHONE_BF_SLEEP ENUM('none', 'short', 'moderate', 'long');

USE study;
ALTER TABLE EATING_LOG
MODIFY COLUMN FOOD_SOURCE ENUM('home cooked', 'ordered', 'takeaway', 'packaged', 'prepackaged', 'friend made', 'canteen', 'outside', 'restaurant', 'other');

USE study;

ALTER TABLE DAY
DROP COLUMN FITNESS;

ALTER TABLE DAY
DROP COLUMN COOKED;

CREATE TABLE FITNESS_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    FITNESS_START TIME NOT NULL,
    FITNESS_TYPE ENUM('walking', 'running', 'cycling', 'swimming', 'yoga', 'stretching', 'strength_training', 'bodyweight_training', 'sports', 'aerobic_dance', 'hiking', 'other'),
    FITNESS_DURATION_MINUTES INT,
    FITNESS_INTENSITY ENUM('low', 'moderate', 'high'),
    PRIMARY KEY (USER_ID, DAY_ID, FITNESS_START),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES DAY(DAY_ID) ON DELETE CASCADE
);

CREATE TABLE COOKING_LOG (
    USER_ID INT NOT NULL,
    DAY_ID INT NOT NULL,
    COOK_START TIME NOT NULL,
    COOK_TIME ENUM('short', 'medium', 'long'),
    DIFFICULTY ENUM('easy', 'medium', 'hard'),
    PRIMARY KEY (USER_ID, DAY_ID, COOK_START),
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (DAY_ID) REFERENCES DAY(DAY_ID) ON DELETE CASCADE
);

USE study;

ALTER TABLE EATING_LOG
ADD FLAVOUR ENUM('terrible', 'poor', 'average', 'delicious', 'very delicious');

USE study;

ALTER TABLE EATING_LOG
ADD EAT_FILL ENUM('still hungry', 'not full', 'neutral', 'full', 'stuffed');

USE study;
ALTER TABLE EATING_LOG
MODIFY COLUMN EAT_FILL ENUM('still hungry', 'not full', 'neutral', 'full', 'very full');

USE study;
ALTER TABLE SEXUAL_LOG
ADD SEXLOG_SHOOT ENUM('none', 'low', 'moderate', 'strong', 'explosive');

USE study;

CREATE TABLE KIT_TESTS (
    KIT_ID INT NOT NULL AUTO_INCREMENT,
    KIT_TAB VARCHAR(100),
    PRIMARY KEY (KIT_ID)
);

ALTER TABLE ACTIVITY
ADD KIT_ID INT NOT NULL;

ALTER TABLE ACTIVITY
ADD FOREIGN KEY (KIT_ID) REFERENCES KIT_TESTS(KIT_ID) ON DELETE CASCADE;

ALTER TABLE ACTIVITY_OUTPUT
ADD KIT_ID INT NOT NULL;

ALTER TABLE ACTIVITY_OUTPUT
ADD FOREIGN KEY (KIT_ID) REFERENCES KIT_TESTS(KIT_ID) ON DELETE CASCADE;

USE study;

ALTER TABLE KIT_TESTS
MODIFY COLUMN KIT_TAB VARCHAR(100) NOT NULL;

USE study;

ALTER TABLE ACTIVITY_OUTPUT
MODIFY KIT_ID INT NOT NULL AFTER ACTI_LOG_ID;

ALTER TABLE ACTIVITY
MODIFY KIT_ID INT NOT NULL AFTER ACTIVITY_CATEGORY;

USE study;

ALTER TABLE SEXUAL_LOG
MODIFY SATISFACTION ENUM('very unsatisfied', 'unsatisfied', 'neutral', 'satisfied', 'very satisfied');

USE study;


ALTER TABLE SEXUAL_LOG
MODIFY SEXLOG_SHOOT ENUM('none', 'very weak', 'weak', 'moderate', 'strong', 'explosive');

USE study;

ALTER TABLE ACTIVITY
RENAME COLUMN ACT_BENCHMARK_MIN TO ACT_BENCHMARK;

ALTER TABLE ACTIVITY
MODIFY ACT_BENCHMARK BOOLEAN;

ALTER TABLE ACTIVITY
ADD ACT_MEANS ENUM('exam_practice', 'textbook', 'ebook', 'article', 'book', 'guidebook', 'video', 'tutorial', 'interactive', 'audio', 'podcast', 'course', 'live_session', 'slide', 'handout', 'journal', 'manual');

ALTER TABLE ACTIVITY
ADD ACT_TOTAL_MEANS FLOAT;

ALTER TABLE ACTIVITY
ADD TOTAL_MEANS_UNIT ENUM('minutes', 'pages', 'words', 'items', 'sessions', 'modules', 'steps', 'questions', 'slides', 'tasks', 'points', 'percentage', 'stars', 'grade', 'level', 'rank', 'scale-10', 'scale-5', 'scale-9', 'yes-no', 'pass-fail', 'count');

USE study;

ALTER TABLE ACTIVITY
DROP COLUMN ACT_BENCHMARK;

ALTER TABLE ACTIVITY
DROP COLUMN ACT_MEANS;

ALTER TABLE ACTIVITY
DROP COLUMN ACT_TOTAL_MEANS;

ALTER TABLE ACTIVITY
DROP COLUMN TOTAL_MEANS_UNIT;

USE study;

ALTER TABLE ACTIVITY
MODIFY ACTIVITY_CATEGORY ENUM('academic', 'language', 'self-development', 'technical & vocational', 'creative arts', 'well-being & lifestyle') NOT NULL AFTER KIT_ID;

ALTER TABLE ACTIVITY
ADD ACT_DES VARCHAR(100) CHARACTER SET utf8mb4 NOT NULL;

USE study;

ALTER TABLE ACTIVITY
MODIFY ACTIVITY_TAGS ENUM('mental', 'productive', 'physical', 'emotional', 'social', 'entertainment', 'other') AFTER ACT_DES;

USE study;

ALTER TABLE `DAY`
ADD IS_EVENT BOOLEAN;

ALTER TABLE `DAY`
ADD IS_FREE BOOLEAN;

USE study;

ALTER TABLE ACTIVITY
ADD USER_ID INT NOT NULL AFTER ACTIVITY_ID;

ALTER TABLE ACTIVITY
ADD FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE;

USE study;

ALTER TABLE ACTIVITY_OUTPUT
DROP COLUMN AO_DIFFICULTY;

USE study;

ALTER TABLE ACTIVITY_LOG
DROP FOREIGN KEY ACTIVITY_LOG_ibfk_4;

ALTER TABLE ACTIVITY_LOG
DROP COLUMN SOUND_ID;

DROP TABLE IF EXISTS `SOUND`;

ALTER TABLE ACTIVITY_LOG
ADD SOUND_BACKGROUND SET('music', 'white_noise', 'ambient_noise', 'silence', 'podcast', 'construction', 'nature', 'headphones', 'earbuds', 'speakers', 'public', 'private_room');

ALTER TABLE ACTIVITY_LOG
ADD SOUND_INTENSITY ENUM('silent', 'very_low', 'low', 'medium', 'high', 'very_high');

USE study;

ALTER TABLE ACTIVITY_LOG
MODIFY SOUND_BACKGROUND SET('music', 'white_noise', 'ambient_noise', 'silence', 'podcast', 'construction', 'nature', 'headphones', 'earbuds', 'speakers', 'public', 'private_room') AFTER ACTLOG_START;

ALTER TABLE ACTIVITY_LOG
MODIFY SOUND_INTENSITY ENUM('silent', 'very_low', 'low', 'medium', 'high', 'very_high') AFTER SOUND_BACKGROUND;

USE study;

ALTER TABLE ACTIVITY_LOG
MODIFY AC_ON BOOLEAN;

USE study;

ALTER TABLE ACTIVITY_LOG
MODIFY AC_TEMP INT CHECK (AC_TEMP BETWEEN 16 AND 31);

USE study;

ALTER TABLE ACTIVITY_LOG
DROP COLUMN AQI;
ALTER TABLE ACTIVITY_LOG
DROP COLUMN PM25;
ALTER TABLE ACTIVITY_LOG
DROP COLUMN HUMIDITY;

USE study;

ALTER TABLE ACTIVITY_LOG
MODIFY HUNGER ENUM('starving', 'extreme_hungry', 'very_hungry', 'slightly_hungry', 'satisfied', 'full', 'overstuffed');

ALTER TABLE ACTIVITY_LOG
MODIFY ACTLOG_START TIME AFTER AC_ON;

ALTER TABLE ACTIVITY_LOG
MODIFY ENERGY ENUM('exhausted', 'low', 'normal', 'high', 'bursting');

USE study;

ALTER TABLE ACTIVITY_LOG
MODIFY SOUND_BACKGROUND SET('category_music', 'category_white_noise', 'category_ambient_noise', 'category_silence', 'category_podcast', 'category_construction', 'category_nature', 'source_headphones', 'source_earbuds', 'source_speakers', 'source_public', 'source_private_room');

USE study;

ALTER TABLE ACTIVITY_OUTPUT
RENAME COLUMN BREAK_LEVEL TO BREAK_TIME;

ALTER TABLE ACTIVITY_OUTPUT
MODIFY BREAK_TIME INT;

USE study;

ALTER TABLE ACTIVITY
ADD ACT_STATUS ENUM('not_started', 'in_progress', 'paused', 'completed', 'skipped', 'cancelled');

USE study;

ALTER TABLE KIT_ACADEMIC_READING
MODIFY SPEED_READ ENUM('extremely_slow', 'very_slow', 'slow', 'average', 'fast', 'very_fast', 'ultra_fast');

USE study;

ALTER TABLE KIT_EXERCISES
MODIFY TIME_FINISH ENUM('no_time_recorded', 'too_slow', 'a_bit_slow', 'acceptable', 'a_bit_fast', 'fast_and_confident');

USE study;

ALTER TABLE ACTIVITY
DROP FOREIGN KEY ACTIVITY_ibfk_1;

ALTER TABLE ACTIVITY_OUTPUT
DROP FOREIGN KEY ACTIVITY_OUTPUT_ibfk_1;

DROP TABLE IF EXISTS KIT_TESTS;

USE study;

ALTER TABLE ACTIVITY
ADD CONSTRAINT ACTIVITY_ibfk_2
FOREIGN KEY (USER_ID)
REFERENCES USERS(USER_ID)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE ACTIVITY_OUTPUT
ADD CONSTRAINT ACTIVITY_OUTPUT_ibfk_2
FOREIGN KEY (ACTI_LOG_ID)
REFERENCES ACTIVITY_LOG(ACTI_LOG_ID)
ON DELETE CASCADE
ON UPDATE CASCADE;

USE study;

ALTER TABLE ACTIVITY
DROP COLUMN KIT_ID;

ALTER TABLE ACTIVITY_OUTPUT
DROP COLUMN KIT_ID;