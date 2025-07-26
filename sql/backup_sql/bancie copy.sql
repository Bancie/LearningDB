USE bancie;

DROP DATABASE IF EXISTS bancie;

CREATE DATABASE bancie;

USE bancie;

CREATE TABLE `USERS` (
  `USER_ID` INT NOT NULL AUTO_INCREMENT,
  `FULLNAME` VARCHAR(100) NOT NULL,
  `BIRTH` DATE NOT NULL,
  `GENDER` ENUM('male', 'female', 'other') NOT NULL,
  `MAJOR` VARCHAR(100) NOT NULL,
  `USER_LOCATION` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`USER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `SLEEP_LOG` (
  `USER_ID` INT NOT NULL,
  `SLEEP_START` DATETIME NOT NULL,
  `SLEEP_END` DATETIME,
  `SLEEP_ALONE` TINYINT(1),
  `SLEEP_TYPE` ENUM(
    'night',
    'nap',
    'recovery',
    'fragmented',
    'other'
  ),
  `SLEEP_QUALITY` ENUM(
    'very poor',
    'poor',
    'fair',
    'good',
    'very good',
    'excellent'
  ),
  `DREAM` ENUM(
    'none',
    'vague',
    'vivid'
  ),
  `WAKE_COUNT` INT,
  `FELL_ASLEEP` ENUM(
    'easy',
    'normal',
    'difficult'
  ),
  `WAKE_FEELING` ENUM(
    'very groggy',
    'groggy',
    'neutral',
    'refreshed',
    'energized'
  ),
  `SLEEP_ENVIRONMENT` ENUM(
    'terrible',
    'poor',
    'fair',
    'good',
    'excellent'
  ),
  `ALARM_USED` ENUM(
    'none',
    'silent',
    'low',
    'medium',
    'loud'
  ),
  `PHONE_BF_SLEEP` ENUM(
    'none',
    'short',
    'moderate',
    'long'
  ),
  PRIMARY KEY (`USER_ID`, `SLEEP_START`),
  CONSTRAINT `SLEEP_LOG_ibfk_1`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `SHOWER_LOG` (
  `USER_ID` INT NOT NULL,
  `SHOWER_START` DATETIME NOT NULL,
  `SHOWER_DURING` ENUM(
    'short',
    'medium',
    'long'
  ),
  `SHOWER_TEMP` ENUM(
    'cold',
    'warm',
    'hot'
  ),
  PRIMARY KEY (`USER_ID`, `SHOWER_START`),
  CONSTRAINT `SHOWER_LOG_ibfk_1`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `SEXUAL_LOG` (
  `USER_ID` INT NOT NULL,
  `SEXLOG_TIME` DATETIME NOT NULL,
  `SEXLOG_DURING` ENUM(
    'short',
    'medium',
    'long'
  ),
  `PARTNERED` TINYINT(1),
  `SATISFACTION` ENUM(
    'very unsatisfied',
    'unsatisfied',
    'neutral',
    'satisfied',
    'very satisfied'
  ),
  `SEXLOG_LOCATION` ENUM(
    'room',
    'bedroom',
    'bathroom',
    'hotel',
    'car',
    'public place',
    'living room',
    'partner home',
    'other'
  ),
  `SEXLOG_SHOOT` ENUM(
    'none',
    'very weak',
    'weak',
    'moderate',
    'strong',
    'explosive'
  ),
  PRIMARY KEY (`USER_ID`, `SEXLOG_TIME`),
  CONSTRAINT `SEXUAL_LOG_ibfk_1`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `SCREEN_TIME` (
  `SCREEN_TIME_ID` INT NOT NULL AUTO_INCREMENT,
  `USER_ID` INT NOT NULL,
  `DAY` DATE NOT NULL,
  `DEVICE` ENUM(
    'smartphone',
    'tablet',
    'laptop',
    'desktop',
    'smartwatch',
    'tv',
    'other'
  ),
  `SCREEN_TIME` FLOAT,
  `SOCIAL` FLOAT,
  PRIMARY KEY (`SCREEN_TIME_ID`),
  CONSTRAINT `SCREEN_TIME_ibfk_1`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `FITNESS_LOG` (
  `USER_ID` INT NOT NULL,
  `FITNESS_START` DATETIME NOT NULL,
  `FITNESS_TYPE` ENUM(
    'walking',
    'running',
    'cycling',
    'swimming',
    'yoga',
    'stretching',
    'strength_training',
    'bodyweight_training',
    'sports',
    'aerobic_dance',
    'hiking',
    'other'
  ),
  `FITNESS_DURATION_MINUTES` INT,
  `FITNESS_INTENSITY` ENUM(
    'low',
    'moderate',
    'high'
  ),
  PRIMARY KEY (`USER_ID`, `FITNESS_START`),
  CONSTRAINT `FITNESS_LOG_ibfk_1`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `EATING_LOG` (
  `EATING_LOG_ID` INT NOT NULL AUTO_INCREMENT,
  `USER_ID` INT NOT NULL,
  `EAT_TIME` DATETIME NOT NULL,
  `EAT_TYPE` ENUM(
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'supper',
    'midnight snack',
    'drinking'
  ),
  `FOOD` ENUM(
    'main dish',
    'fast_food',
    'junk_food',
    'soup',
    'snack',
    'side_dish',
    'dessert',
    'beverage',
    'fruit',
    'vegetable',
    'other'
  ),
  `EAT_AMOUNT` ENUM(
    'small',
    'medium',
    'large'
  ),
  `FOOD_SOURCE` ENUM(
    'home cooked',
    'ordered',
    'takeaway',
    'packaged',
    'prepackaged',
    'friend made',
    'canteen',
    'outside',
    'restaurant',
    'other'
  ),
  `HEALTHINESS` ENUM(
    'very unhealthy',
    'unhealthy',
    'neutral',
    'healthy',
    'super healthy'
  ),
  `FLAVOUR` ENUM(
    'terrible',
    'poor',
    'average',
    'delicious',
    'very delicious'
  ),
  `EAT_FILL` ENUM(
    'still hungry',
    'not full',
    'neutral',
    'full',
    'very full'
  ),
  PRIMARY KEY (`EATING_LOG_ID`),
  CONSTRAINT `EATING_LOG_ibfk_1`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ACTIVITY` (
  `ACTIVITY_ID` INT NOT NULL AUTO_INCREMENT,
  `USER_ID` INT NOT NULL,
  `ACT_NAME` VARCHAR(500),
  `ACTIVITY_TAGS` ENUM(
    'mental',
    'productive',
    'physical',
    'emotional',
    'social',
    'entertainment',
    'other'
  ),
  `ACTIVITY_CATEGORY` ENUM(
    'academic',
    'language',
    'self-development',
    'technical_&_vocational',
    'creative_arts',
    'well-being_&_lifestyle'
  ),
  `IS_RESEARCH` TINYINT(1),
  `ACT_STATUS` ENUM(
    'not_started',
    'in_progress',
    'paused',
    'completed',
    'skipped',
    'cancelled'
  ),
  `PRIOR_PROB` DECIMAL(5,4),
  `POSTERIOR_PROB_LEARNING` DECIMAL(5,4),
  `POSTERIOR_PROB_OVERVIEW` DECIMAL(5,4),
  `POSTERIOR_PROB_PRACTICE` DECIMAL(5,4),
  `CREATED_AT` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `UPDATED_AT` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ACTIVITY_ID`),
  KEY `USER_ID` (`USER_ID`),
  CONSTRAINT `ACTIVITY_ibfk_2`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ACTIVITY_LOG` (
  `ACTI_LOG_ID` INT NOT NULL AUTO_INCREMENT,
  `USER_ID` INT NOT NULL,
  `ACTIVITY_ID` INT NOT NULL,
  `ACTLOG_START` DATETIME NOT NULL,
  `MUSIC_ON` TINYINT(1),
  `SOUND_VOLUME` ENUM(
    'silent',
    'very_quiet',
    'quiet',
    'moderate',
    'loud',
    'very_loud'
  ),
  `DEVICE` ENUM(
    'laptop',
    'smartphone',
    'book',
    'tablet',
    'other'
  ),
  `ACTLOG_LOCATION` ENUM(
    'home',
    'library',
    'cafe',
    'school',
    'work',
    'traveling',
    'park',
    'gym',
    'public_transport',
    'outdoor',
    'indoor',
    'classroom',
    'bedroom',
    'living_room',
    'kitchen',
    'bathroom',
    'office',
    'study_room',
    'laboratory',
    'workshop',
    'studio',
    'restaurant',
    'hotel',
    'conference_room',
    'co-working_space',
    'community_center',
    'other'
  ),
  `WEATHER` ENUM(
    'stormy',
    'rainy',
    'cloudy',
    'clear',
    'sunny'
  ),
  `TEMPERATURE` ENUM(
    'freezing',
    'cold',
    'cool',
    'mild',
    'warm',
    'hot',
    'very_hot',
    'scorching'
  ),
  `MOOD` ENUM(
    'very_bad',
    'bad',
    'slightly_bad',
    'neutral',
    'slightly_good',
    'good',
    'very_good'
  ),
  `HEALTH` ENUM(
    'poor',
    'normal',
    'good'
  ),
  `ENERGY` ENUM(
    'exhausted',
    'low',
    'normal',
    'high',
    'bursting'
  ),
  `HUNGER` ENUM(
    'starving',
    'extreme_hungry',
    'very_hungry',
    'slightly_hungry',
    'satisfied',
    'full',
    'overstuffed'
  ),
  `AROUSAL` ENUM(
    'very_low',
    'low',
    'slightly_low',
    'neutral',
    'slightly_high',
    'high',
    'very_high'
  ),
  PRIMARY KEY (`ACTI_LOG_ID`),
  KEY `USER_ID` (`USER_ID`),
  KEY `ACTIVITY_ID` (`ACTIVITY_ID`),
  CONSTRAINT `ACTIVITY_LOG_ibfk_1`
    FOREIGN KEY (`USER_ID`)
    REFERENCES `USERS` (`USER_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `ACTIVITY_LOG_ibfk_2`
    FOREIGN KEY (`ACTIVITY_ID`)
    REFERENCES `ACTIVITY` (`ACTIVITY_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ACTIVITY_OUTPUT` (
  `AO_ID` INT NOT NULL AUTO_INCREMENT,
  `ACTI_LOG_ID` INT NOT NULL,
  `AO_FINISH` DATETIME,
  `BREAK_TIME` INT,
  `MENTAL_IN_BREAK` ENUM(
    'very_chaotic',
    'chaotic',
    'slightly_chaotic',
    'neutral',
    'slightly_calm',
    'calm',
    'very_calm'
  ),
  `AO_SATISFACTION` ENUM(
    'very_unsatisfied',
    'unsatisfied',
    'neutral',
    'satisfied',
    'very_satisfied'
  ),
  `FOCUS_LEVEL` ENUM(
    'very_low',
    'low',
    'medium',
    'high',
    'very_high'
  ),
  `TARGET_MET` TINYINT(1),
  PRIMARY KEY (`AO_ID`),
  KEY `ACTI_LOG_ID` (`ACTI_LOG_ID`),
  CONSTRAINT `ACTIVITY_OUTPUT_ibfk_2`
    FOREIGN KEY (`ACTI_LOG_ID`)
    REFERENCES `ACTIVITY_LOG` (`ACTI_LOG_ID`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_ACADEMIC_READING` (
  `KIT_ACADEMIC_READING_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `COMPREHENSION_DEPTH` ENUM(
    'surface_level',
    'partial_understanding',
    'understood_core_ideas',
    'grasped_all_arguments',
    'deep_and_connected_insight'
  ),
  `PROOF_TRACE_ABILITY` ENUM(
    'non_proof',
    'lost_immediately',
    'followed_some_steps',
    'mostly_followed',
    'fully_followed',
    'followed_and_critiqued'
  ),
  `LINKING_TO_PREVIOUS_KNOWLEDGE` ENUM(
    'no_connection_made',
    'forced_linking',
    'some_connections',
    'natural_linking',
    'integrated_into_framework'
  ),
  `MENTAL_FATIGUE` ENUM(
    'exhausted_quickly',
    'tired_early',
    'moderately_fatigued',
    'sustained_attention',
    'deep_focus_maintained'
  ),
  `READING_SPEED_FOR_PROOF` ENUM(
    'non_proof',
    'extremely_slow',
    'slow',
    'average',
    'fast',
    'very_fast_with_understanding'
  ),
  `CONTENT_LEVEL` ENUM(
    'very_easy',
    'easy',
    'moderate',
    'hard',
    'very_hard'
  ),
  PRIMARY KEY (`KIT_ACADEMIC_READING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_ACADEMIC_READING`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_COUNT` (
  `KIT_COUNT_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `TOTAL_COUNT` FLOAT,
  `UNIT_COUNT` ENUM(
    'points',
    'percentage',
    'stars',
    'grade',
    'level',
    'second',
    'minutes',
    'hours',
    'rank',
    'scale-10',
    'scale-5',
    'boolean',
    'count',
    'words',
    'tasks',
    'steps',
    'calories',
    'bpm',
    'score_band',
    'xp',
    'coins',
    'none',
    'pages',
    'problems',
    'questions',
    'exercises',
    'problems_solved',
    'questions_answered',
    'exercises_completed',
    'tasks_completed',
    'items_collected'
  ),
  PRIMARY KEY (`KIT_COUNT_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_COUNT`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_EXERCISES` (
  `KIT_EXERCISES_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `TOTAL_QUESTION` FLOAT,
  `TRUE_TOTAL` FLOAT,
  `TIME_FINISH` ENUM(
    'no_time_recorded',
    'too_slow',
    'a_bit_slow',
    'acceptable',
    'a_bit_fast',
    'fast_and_confident'
  ),
  PRIMARY KEY (`KIT_EXERCISES_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_EXERCISES`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_IELTS_LISTENING` (
  `KIT_IELTS_LISTENING_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `SCORE_BAND` FLOAT,
  `COMPREHENSION_TYPE` ENUM(
    'multiple_choice',
    'form_completion',
    'map_diagram',
    'matching',
    'sentence_completion',
    'summary_completion',
    'short_answer'
  ),
  `TOPIC_FAMILIARITY` ENUM(
    'very_unfamiliar',
    'unfamiliar',
    'neutral',
    'familiar',
    'very_familiar'
  ),
  `SPEED_HANDLING` ENUM(
    'lost',
    'struggled',
    'managed_okay',
    'comfortable',
    'fluent_response'
  ),
  `SPELLING_ACCURACY` ENUM(
    'poor',
    'needs_improvement',
    'adequate',
    'good',
    'perfect'
  ),
  `ANSWER_COMPLETION` ENUM(
    'mostly_blank',
    'partially_filled',
    'mostly_filled',
    'fully_filled_but_incorrect',
    'fully_correct'
  ),
  `AUDIO_RECOGNITION` ENUM(
    'missed_info',
    'some_misheard',
    'understood_main_ideas',
    'understood_details',
    'complete_understanding'
  ),
  PRIMARY KEY (`KIT_IELTS_LISTENING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_LISTENING`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_IELTS_READING` (
  `KIT_IELTS_READING_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `SCORE_BAND` FLOAT,
  `COMPREHENSION_TYPE` ENUM(
    'matching_headings',
    'multiple_choice',
    'true_false_not_given',
    'yes_no_not_given',
    'summary_completion',
    'sentence_completion',
    'note_table_flowchart_completion',
    'short_answer'
  ),
  `TIME_MANAGEMENT` ENUM(
    'ran_out_of_time',
    'barely_finished',
    'just_in_time',
    'finished_early',
    'finished_with_review'
  ),
  `READING_SPEED` ENUM(
    'very_slow',
    'slow',
    'average',
    'fast',
    'very_fast'
  ),
  `COMPREHENSION_DEPTH` ENUM(
    'missed_main_ideas',
    'got_main_ideas',
    'understood_details',
    'inferred_meanings',
    'mastered_all_levels'
  ),
  `TEXT_COMPLEXITY_HANDLING` ENUM(
    'too_difficult',
    'challenging',
    'just_right',
    'easy',
    'too_easy'
  ),
  `VOCABULARY_RECOGNITION` ENUM(
    'very_limited',
    'limited',
    'moderate',
    'strong',
    'expert'
  ),
  `ANSWER_ACCURACY` ENUM(
    'mostly_wrong',
    'some_correct',
    'about_half_correct',
    'mostly_correct',
    'all_correct'
  ),
  PRIMARY KEY (`KIT_IELTS_READING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_READING`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_IELTS_SPEAKING` (
  `KIT_IELTS_SPEAKING_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `FLUENCY_COHESION` ENUM(
    'frequent_pauses',
    'hesitant',
    'some_disfluency',
    'mostly_fluent',
    'naturally_fluent'
  ),
  `LEXICAL_RESOURCE` ENUM(
    'very_basic_words',
    'repetitive',
    'some_range',
    'wide_range',
    'rich_and_precise'
  ),
  `GRAMMATICAL_RANGE_ACCURACY` ENUM(
    'frequent_errors',
    'simple_only',
    'moderate_range',
    'accurate_with_complex',
    'wide_and_consistent_accuracy'
  ),
  `PRONUNCIATION` ENUM(
    'unclear',
    'hard_to_understand',
    'mostly_clear',
    'clear_and_natural',
    'native_like'
  ),
  `IDEA_ORGANIZATION` ENUM(
    'no_structure',
    'jumpy',
    'basic_sequence',
    'clear_flow',
    'well_structured'
  ),
  `TOPIC_HANDLING` ENUM(
    'off_topic',
    'barely_on_topic',
    'partially_developed',
    'developed',
    'insightful_response'
  ),
  `INTERACTIVE_COMMUNICATION` ENUM(
    'minimal',
    'reluctant',
    'adequate',
    'responsive',
    'engaging_and_natural'
  ),
  `CONFIDENCE_LEVEL` ENUM(
    'very_nervous',
    'nervous',
    'neutral',
    'confident',
    'very_confident'
  ),
  PRIMARY KEY (`KIT_IELTS_SPEAKING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_SPEAKING`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_IELTS_WRITING_TASK1` (
  `KIT_IELTS_WRITING_TASK1_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `TASK_ACHIEVEMENT` ENUM(
    'off_topic',
    'insufficient_data_coverage',
    'partial_summary',
    'clear_summary',
    'fully_meets_requirements'
  ),
  `COHERENCE_COHESION` ENUM(
    'no_logical_flow',
    'some_linking',
    'adequate_organization',
    'logical_and_effective',
    'seamless_and_engaging'
  ),
  `LEXICAL_RESOURCE` ENUM(
    'basic_words_only',
    'repetitive',
    'moderate_range',
    'varied_and_precise',
    'advanced_and_natural'
  ),
  `GRAMMATICAL_RANGE_ACCURACY` ENUM(
    'many_errors',
    'basic_structures_only',
    'mostly_correct',
    'some_complex_structures',
    'complex_and_accurate'
  ),
  `TONE_FORMALITY` ENUM(
    'too_informal',
    'slightly_informal',
    'appropriate',
    'formal',
    'perfectly_matched'
  ),
  `VISUAL_DESCRIPTION_SKILL` ENUM(
    'missing_comparison',
    'basic_reporting',
    'some_comparison',
    'well_analyzed',
    'insightful_and_concise'
  ),
  PRIMARY KEY (`KIT_IELTS_WRITING_TASK1_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_WRITING_TASK1`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_IELTS_WRITING_TASK2` (
  `KIT_IELTS_WRITING_TASK2_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `TASK_RESPONSE` ENUM(
    'off_topic',
    'weak_argument',
    'partially_addressed',
    'clearly_addressed',
    'fully_developed'
  ),
  `COHERENCE_COHESION` ENUM(
    'no_logical_flow',
    'some_linking',
    'adequate_organization',
    'logical_and_effective',
    'seamless_and_engaging'
  ),
  `LEXICAL_RESOURCE` ENUM(
    'basic_words_only',
    'repetitive',
    'moderate_range',
    'varied_and_precise',
    'advanced_and_natural'
  ),
  `GRAMMATICAL_RANGE_ACCURACY` ENUM(
    'many_errors',
    'basic_structures_only',
    'mostly_correct',
    'some_complex_structures',
    'complex_and_accurate'
  ),
  `ARGUMENT_QUALITY` ENUM(
    'no_argument',
    'weak_claims',
    'some_support',
    'well_supported',
    'convincing_and_logical'
  ),
  `IDEAS_ORIGINALITY` ENUM(
    'very_common',
    'somewhat_generic',
    'some_freshness',
    'original_and_thoughtful',
    'highly_creative'
  ),
  `COUNTERARGUMENT_HANDLING` ENUM(
    'none',
    'weak_or_forced',
    'acknowledged',
    'refuted_effectively',
    'masterfully_addressed'
  ),
  PRIMARY KEY (`KIT_IELTS_WRITING_TASK2_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_WRITING_TASK2`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

CREATE TABLE `KIT_RESEARCH_WRITING` (
  `KIT_RESEARCH_WRITING_ID` INT NOT NULL AUTO_INCREMENT,
  `AO_ID` INT NOT NULL,
  `AMOUNT_WRITTEN` ENUM(
    'tiny',
    'short',
    'moderate',
    'substantial',
    'intensive'
  ),
  `ORIGINALITY` ENUM(
    'descriptive',
    'emergent',
    'creative',
    'original_rigorous'
  ),
  `STRUCTURE` ENUM(
    'fragmented',
    'loose',
    'mostly_structured',
    'clear',
    'excellent'
  ),
  PRIMARY KEY (`KIT_RESEARCH_WRITING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_RESEARCH_WRITING`
    FOREIGN KEY (`AO_ID`)
    REFERENCES `ACTIVITY_OUTPUT` (`AO_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4;

create view `bayes_act` as
select `USER_ID`, `ACTIVITY_ID`, `ACT_NAME`, `PRIOR_PROB`, `POSTERIOR_PROB_LEARNING`, `POSTERIOR_PROB_OVERVIEW`, `POSTERIOR_PROB_PRACTICE`
from `ACTIVITY`
where `ACT_STATUS`='not_started';

create view `minutes_per_day_second_ver` as
select DATE(`ACTLOG_START`) as `DAY`, sum(timestampdiff(minute, `ACTLOG_START`, `AO_FINISH`)) as `minutes`
from `ACTIVITY_LOG`
natural join `ACTIVITY_OUTPUT`
group by `DAY`;

create view `current_activity_log` as
select `USER_ID`, `ACTIVITY_ID`, `ACTI_LOG_ID`, `ACT_NAME`, TIME(`ACTLOG_START`) as `START_TIME`
from `ACTIVITY_LOG`
natural join `ACTIVITY`
where DATE(`ACTLOG_START`)=curdate();

create view `current_activity_output` as
select `USER_ID`, `AO_ID`, `ACT_NAME`, `START_TIME`, TIME(`AO_FINISH`) as `FINISH_TIME`
from `ACTIVITY_OUTPUT`
natural join `current_activity_log`;

insert into `USERS`(`FULLNAME`,`BIRTH`,`GENDER`,`MAJOR`,`USER_LOCATION`)
values ('Nguyễn Chí Bằng','2003-09-03','male','student','district 5, Ho Chi Minh city');

insert into `ACTIVITY`(`USER_ID`,`ACT_NAME`,`ACTIVITY_TAGS`,`ACTIVITY_CATEGORY`,`IS_RESEARCH`,`ACT_STATUS`,`PRIOR_PROB`,`POSTERIOR_PROB_LEARNING`,`POSTERIOR_PROB_OVERVIEW`,`POSTERIOR_PROB_PRACTICE`)
values
(1,'Statistics for Business & Economics','mental','academic',0,'not_started',0,0,0,0),
(1,'[RESEARCH] Location-Scheduling Problem','productive','academic',1,'not_started',0,0,0,0),
(1,'Tư tưởng Hồ Chí Minh','social','academic',0,'not_started',0,0,0,0),
(1,'Lịch sử Đảng','social','academic',0,'not_started',0,0,0,0),
(1,'THE KEY TO IELTS SUCCESS - Pauline Cullen','productive','language',0,'not_started',0,0,0,0),
(1,'[CAM] GRAMMAR FOR IELTS WITH ANSWERS','productive','language',0,'not_started',0,0,0,0),
(1,'[CAM] VOCABULARY FOR IELTS','productive','language',0,'not_started',0,0,0,0),
(1,'[CAM] ENGLISH COLLOCATIONS IN USE','productive','language',0,'not_started',0,0,0,0),
(1,'[OXFORD] Phrasal Verbs and Idioms','productive','language',0,'not_started',0,0,0,0),
(1,'Software Engineering - Ian Sommerville','mental','technical_&_vocational',0,'not_started',0,0,0,0),
(1,'Android Programming: The Big Nerd Ranch Guide - Bryan Sills, Brian Gardner, Kristin Marsicano and Chris Stewart','mental','technical_&_vocational',0,'not_started',0,0,0,0),
(1,'Artificial Intelligence: A Modern Approach - Stuart Russell','mental','academic',0,'not_started',0,0,0,0),
(1,'DATA CLUSTERING - Charu C. Aggarwal','mental','academic',0,'not_started',0,0,0,0),
(1,'DATABASE MANAGEMENT SYSTEMS - Raghu Ramakrishnan','mental','technical_&_vocational',0,'not_started',0,0,0,0),
(1,'INTRODUCTION TO MODERN CRYPTOGRAPHY','mental','technical_&_vocational',0,'not_started',0,0,0,0),
(1,'PROJECT MANAGEMENT - HAROLD KERZNER','mental','technical_&_vocational',0,'not_started',0,0,0,0),
(1,'INTER IELTS VIDEOS','productive','language',0,'not_started',0,0,0,0),
(1,'[PROGRAMIZ] Data Structures and Algorithms','mental','technical_&_vocational',0,'not_started',0,0,0,0),
(1,'[IELTS 18] LISTENING','productive','language',0,'not_started',0,0,0,0),
(1,'[IELTS 18] READING','productive','language',0,'not_started',0,0,0,0),
(1,'[IELTS 18] WRITING TASK 1','productive','language',0,'not_started',0,0,0,0),
(1,'[TiLearn] Personal Project Development','productive','technical_&_vocational',1,'not_started',0,0,0,0),
(1,'[IELTS 18] WRITING TASK 2','productive','language',0,'not_started',0,0,0,0);