-- MySQL dump 10.13  Distrib 9.5.0, for macos26.0 (arm64)
--
-- Host: 127.0.0.1    Database: bancie
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity` (
  `ACTIVITY_ID` int NOT NULL AUTO_INCREMENT,
  `USER_ID` int NOT NULL,
  `ACT_NAME` varchar(500) DEFAULT NULL,
  `ACTIVITY_TAGS` enum('mental','productive','physical','emotional','social','entertainment','other') DEFAULT NULL,
  `ACTIVITY_CATEGORY` enum('academic','language','self-development','technical_&_vocational','creative_arts','well-being_&_lifestyle') DEFAULT NULL,
  `LANGUAGE` enum('english','vietnamese','none') DEFAULT NULL,
  `IS_RESEARCH` tinyint(1) DEFAULT NULL,
  `ACT_STATUS` enum('not_started','in_progress','paused','completed','skipped','cancelled') DEFAULT NULL,
  `PRIOR_PROB` decimal(5,4) NOT NULL DEFAULT '0.0000',
  `POSTERIOR_PROB_LEARNING` decimal(5,4) NOT NULL DEFAULT '0.0000',
  `POSTERIOR_PROB_OVERVIEW` decimal(5,4) NOT NULL DEFAULT '0.0000',
  `POSTERIOR_PROB_PRACTICE` decimal(5,4) NOT NULL DEFAULT '0.0000',
  `CREATED_AT` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UPDATED_AT` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ACTIVITY_ID`),
  KEY `USER_ID` (`USER_ID`),
  CONSTRAINT `ACTIVITY_ibfk_2` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `ACTI_LOG_ID` int NOT NULL AUTO_INCREMENT,
  `USER_ID` int NOT NULL,
  `ACTIVITY_ID` int NOT NULL,
  `ACTLOG_START` datetime NOT NULL,
  `MUSIC_ON` tinyint(1) DEFAULT NULL,
  `SOUND_VOLUME` enum('silent','very_quiet','quiet','slightly_quiet','almost_moderate','moderate','loud','very_loud','extremely_loud','deafening') DEFAULT NULL,
  `DEVICE` enum('laptop','smartphone','book','tablet','other') DEFAULT NULL,
  `ACTLOG_LOCATION` enum('home','library','cafe','school','work','traveling','park','gym','public_transport','outdoor','indoor','classroom','bedroom','living_room','kitchen','bathroom','office','study_room','laboratory','workshop','studio','restaurant','hotel','conference_room','co-working_space','community_center','other') DEFAULT NULL,
  `CLEAN_LEVEL` enum('very_messy','messy','moderate','clean','very_clean') DEFAULT NULL,
  `WEATHER` enum('stormy','rainy','cloudy','clear','sunny') DEFAULT NULL,
  `TEMPERATURE` enum('freezing','cold','cool','mild','warm','hot','very_hot','scorching') DEFAULT NULL,
  `MOOD` enum('very_bad','bad','slightly_bad','neutral','slightly_good','good','very_good') DEFAULT NULL,
  `HEALTH` enum('very_poor','poor','normal','good','excellent') DEFAULT NULL,
  `HUNGER` enum('starving','extreme_hungry','very_hungry','hungry','slightly_hungry','satisfied','slightly_full','full','very_full','overstuffed','nauseatingly_full') DEFAULT NULL,
  `AROUSAL` enum('very_low','low','slightly_low','neutral','slightly_high','high','very_high') DEFAULT NULL,
  PRIMARY KEY (`ACTI_LOG_ID`),
  KEY `USER_ID` (`USER_ID`),
  KEY `ACTIVITY_ID` (`ACTIVITY_ID`),
  CONSTRAINT `ACTIVITY_LOG_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE,
  CONSTRAINT `ACTIVITY_LOG_ibfk_2` FOREIGN KEY (`ACTIVITY_ID`) REFERENCES `activity` (`ACTIVITY_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=379 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activity_output`
--

DROP TABLE IF EXISTS `activity_output`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_output` (
  `AO_ID` int NOT NULL AUTO_INCREMENT,
  `ACTI_LOG_ID` int NOT NULL,
  `AO_FINISH` datetime DEFAULT NULL,
  `BREAK_TIME` int DEFAULT NULL,
  `MENTAL_IN_BREAK` enum('none_break','very_chaotic','chaotic','slightly_chaotic','neutral','slightly_calm','calm','very_calm') DEFAULT NULL,
  `AO_SATISFACTION` enum('very_unsatisfied','unsatisfied','neutral','satisfied','very_satisfied') DEFAULT NULL,
  `FOCUS_LEVEL` enum('very_low','low','medium','high','very_high') DEFAULT NULL,
  PRIMARY KEY (`AO_ID`),
  KEY `ACTI_LOG_ID` (`ACTI_LOG_ID`),
  CONSTRAINT `ACTIVITY_OUTPUT_ibfk_2` FOREIGN KEY (`ACTI_LOG_ID`) REFERENCES `activity_log` (`ACTI_LOG_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=359 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_session`
--

DROP TABLE IF EXISTS `auth_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_session` (
  `ID` char(36) NOT NULL,
  `USER_ID` int NOT NULL,
  `TOKEN_HASH` char(64) NOT NULL,
  `EXPIRES_AT` timestamp NOT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `TOKEN_HASH` (`TOKEN_HASH`),
  KEY `idx_auth_session_user` (`USER_ID`),
  KEY `idx_auth_session_exp` (`EXPIRES_AT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `baitap_toan`
--

DROP TABLE IF EXISTS `baitap_toan`;
/*!50001 DROP VIEW IF EXISTS `baitap_toan`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `baitap_toan` AS SELECT 
 1 AS `ACT_NAME`,
 1 AS `TOTAL_COUNT`,
 1 AS `minutes`,
 1 AS `MENTAL_IN_BREAK`,
 1 AS `FOCUS_LEVEL`,
 1 AS `ACTLOG_LOCATION`,
 1 AS `CLEAN_LEVEL`,
 1 AS `MOOD`,
 1 AS `HUNGER`,
 1 AS `AROUSAL`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `bayes_act`
--

DROP TABLE IF EXISTS `bayes_act`;
/*!50001 DROP VIEW IF EXISTS `bayes_act`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `bayes_act` AS SELECT 
 1 AS `USER_ID`,
 1 AS `ACTIVITY_ID`,
 1 AS `ACT_NAME`,
 1 AS `PRIOR_PROB`,
 1 AS `POSTERIOR_PROB_LEARNING`,
 1 AS `POSTERIOR_PROB_OVERVIEW`,
 1 AS `POSTERIOR_PROB_PRACTICE`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `chat_conversation`
--

DROP TABLE IF EXISTS `chat_conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversation` (
  `ID` char(36) NOT NULL,
  `USER_ID` int NOT NULL,
  `TITLE` varchar(120) NOT NULL,
  `PROVIDER` varchar(64) NOT NULL,
  `MODEL` varchar(128) NOT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UPDATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `LAST_MESSAGE_AT` timestamp NULL DEFAULT NULL,
  `DELETED_AT` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `idx_chat_conversation_user` (`USER_ID`),
  KEY `idx_chat_conversation_last_message_at` (`LAST_MESSAGE_AT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_message`
--

DROP TABLE IF EXISTS `chat_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_message` (
  `ID` char(36) NOT NULL,
  `CONVERSATION_ID` char(36) NOT NULL,
  `USER_ID` int NOT NULL,
  `ROLE` enum('user','assistant') NOT NULL,
  `CONTENT` text NOT NULL,
  `REQUEST_ID` varchar(128) DEFAULT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `SEQ` int unsigned DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `idx_chat_message_conversation` (`CONVERSATION_ID`,`CREATED_AT`),
  KEY `idx_chat_message_user` (`USER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `current_activity_log`
--

DROP TABLE IF EXISTS `current_activity_log`;
/*!50001 DROP VIEW IF EXISTS `current_activity_log`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_activity_log` AS SELECT 
 1 AS `USER_ID`,
 1 AS `ACTIVITY_ID`,
 1 AS `ACTI_LOG_ID`,
 1 AS `ACT_NAME`,
 1 AS `START_TIME`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `current_activity_output`
--

DROP TABLE IF EXISTS `current_activity_output`;
/*!50001 DROP VIEW IF EXISTS `current_activity_output`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_activity_output` AS SELECT 
 1 AS `USER_ID`,
 1 AS `AO_ID`,
 1 AS `ACT_NAME`,
 1 AS `START_TIME`,
 1 AS `FINISH_TIME`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `eating_log`
--

DROP TABLE IF EXISTS `eating_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eating_log` (
  `EATING_LOG_ID` int NOT NULL AUTO_INCREMENT,
  `USER_ID` int NOT NULL,
  `EAT_TIME` datetime NOT NULL,
  `EAT_TYPE` enum('breakfast','lunch','dinner','snack','supper','midnight_snack','drinking') DEFAULT NULL,
  `FOOD` enum('main_dish','fast_food','junk_food','soup','snack','side_dish','dessert','beverage','fruit','vegetable','other') DEFAULT NULL,
  `EAT_AMOUNT` enum('very_small','small','medium','large','very_large') DEFAULT NULL,
  `FOOD_SOURCE` enum('self_cooked','ordered','takeaway','packaged','prepackaged','home_made','canteen','outside','restaurant','convenient_store','other') DEFAULT NULL,
  `HEALTHINESS` enum('very_unhealthy','unhealthy','neutral','healthy','super_healthy') DEFAULT NULL,
  `FLAVOUR` enum('terrible','poor','average','delicious','very_delicious') DEFAULT NULL,
  `EAT_FILL` enum('still_hungry','not_full','neutral','full','very_full') DEFAULT NULL,
  PRIMARY KEY (`EATING_LOG_ID`),
  KEY `EATING_LOG_ibfk_1` (`USER_ID`),
  CONSTRAINT `EATING_LOG_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=511 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fitness_log`
--

DROP TABLE IF EXISTS `fitness_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fitness_log` (
  `USER_ID` int NOT NULL,
  `FITNESS_START` datetime NOT NULL,
  `FITNESS_TYPE` enum('walking','running','cycling','swimming','yoga','stretching','strength_training','bodyweight_training','sports','aerobic_dance','hiking','other') DEFAULT NULL,
  `FITNESS_DURATION_MINUTES` int DEFAULT NULL,
  `FITNESS_INTENSITY` enum('very_low','low','moderate','high','very_high') DEFAULT NULL,
  PRIMARY KEY (`USER_ID`,`FITNESS_START`),
  CONSTRAINT `FITNESS_LOG_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `hf_reading_performance`
--

DROP TABLE IF EXISTS `hf_reading_performance`;
/*!50001 DROP VIEW IF EXISTS `hf_reading_performance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `hf_reading_performance` AS SELECT 
 1 AS `AGE_CATEGORY`,
 1 AS `GENDER`,
 1 AS `MAJOR`,
 1 AS `MINUTES_READING`,
 1 AS `MINUTES_BREAK`,
 1 AS `FOCUS_LEVEL`,
 1 AS `PAGES`,
 1 AS `CONTENT_LEVEL_ENUM`,
 1 AS `READING_GENRE`,
 1 AS `SOUND_VOLUME`,
 1 AS `DEVICE`,
 1 AS `LOCATION`,
 1 AS `WEATHER`,
 1 AS `MOOD`,
 1 AS `HUNGER`,
 1 AS `AROUSAL`,
 1 AS `MENTAL_IN_BREAK`,
 1 AS `COMPREHENSION_DEPTH`,
 1 AS `LINKING_TO_PREVIOUS_KNOWLEDGE`,
 1 AS `MENTAL_FATIGUE`,
 1 AS `INTERESTING_LEVEL`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `kit_count`
--

DROP TABLE IF EXISTS `kit_count`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_count` (
  `KIT_COUNT_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `TOTAL_COUNT` float DEFAULT NULL,
  `UNIT_COUNT` enum('points','percentage','stars','grade','level','second','minutes','hours','rank','scale-10','scale-5','boolean','count','words','tasks','steps','calories','bpm','score_band','xp','coins','none','pages','problems','questions','exercises','problems_solved','questions_answered','exercises_completed','tasks_completed','items_collected','reaped','concepts','cards','commits','is_acceptable','sections') DEFAULT NULL,
  PRIMARY KEY (`KIT_COUNT_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_COUNT` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=372 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_exercises`
--

DROP TABLE IF EXISTS `kit_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_exercises` (
  `KIT_EXERCISES_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `TOTAL_QUESTION` float DEFAULT NULL,
  `TRUE_TOTAL` float DEFAULT NULL,
  `TIME_FINISH` enum('no_time_recorded','too_slow','a_bit_slow','acceptable','a_bit_fast','fast_and_confident') DEFAULT NULL,
  PRIMARY KEY (`KIT_EXERCISES_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_EXERCISES` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_housework`
--

DROP TABLE IF EXISTS `kit_housework`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_housework` (
  `KIT_HOUSEWORK_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `HOUSEWORK_AMOUNT` enum('none','barely_any','very_light','light','moderate','intensive','very_intensive','exhausting') NOT NULL,
  PRIMARY KEY (`KIT_HOUSEWORK_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_HOUSEWORK` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_ielts_listening`
--

DROP TABLE IF EXISTS `kit_ielts_listening`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_ielts_listening` (
  `KIT_IELTS_LISTENING_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `SCORE_BAND` float DEFAULT NULL,
  `COMPREHENSION_TYPE` enum('multiple_choice','form_completion','map_diagram','matching','sentence_completion','summary_completion','short_answer') DEFAULT NULL,
  `TOPIC_FAMILIARITY` enum('very_unfamiliar','unfamiliar','neutral','familiar','very_familiar') DEFAULT NULL,
  `SPEED_HANDLING` enum('lost','struggled','managed_okay','comfortable','fluent_response') DEFAULT NULL,
  `SPELLING_ACCURACY` enum('poor','needs_improvement','adequate','good','perfect') DEFAULT NULL,
  `ANSWER_COMPLETION` enum('mostly_blank','partially_filled','mostly_filled','fully_filled_but_incorrect','fully_correct') DEFAULT NULL,
  `AUDIO_RECOGNITION` enum('missed_info','some_misheard','understood_main_ideas','understood_details','complete_understanding') DEFAULT NULL,
  PRIMARY KEY (`KIT_IELTS_LISTENING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_LISTENING` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_ielts_reading`
--

DROP TABLE IF EXISTS `kit_ielts_reading`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_ielts_reading` (
  `KIT_IELTS_READING_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `SCORE_BAND` float DEFAULT NULL,
  `COMPREHENSION_TYPE` enum('matching_headings','multiple_choice','true_false_not_given','yes_no_not_given','summary_completion','sentence_completion','note_table_flowchart_completion','short_answer') DEFAULT NULL,
  `TIME_MANAGEMENT` enum('ran_out_of_time','barely_finished','just_in_time','finished_early','finished_with_review') DEFAULT NULL,
  `READING_SPEED` enum('very_slow','slow','average','fast','very_fast') DEFAULT NULL,
  `COMPREHENSION_DEPTH` enum('missed_main_ideas','got_main_ideas','understood_details','inferred_meanings','mastered_all_levels') DEFAULT NULL,
  `TEXT_COMPLEXITY_HANDLING` enum('too_difficult','challenging','just_right','easy','too_easy') DEFAULT NULL,
  `VOCABULARY_RECOGNITION` enum('very_limited','limited','moderate','strong','expert') DEFAULT NULL,
  `ANSWER_ACCURACY` enum('mostly_wrong','some_correct','about_half_correct','mostly_correct','all_correct') DEFAULT NULL,
  PRIMARY KEY (`KIT_IELTS_READING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_READING` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_ielts_speaking`
--

DROP TABLE IF EXISTS `kit_ielts_speaking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_ielts_speaking` (
  `KIT_IELTS_SPEAKING_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `FLUENCY_COHESION` enum('frequent_pauses','hesitant','some_disfluency','mostly_fluent','naturally_fluent') DEFAULT NULL,
  `LEXICAL_RESOURCE` enum('very_basic_words','repetitive','some_range','wide_range','rich_and_precise') DEFAULT NULL,
  `GRAMMATICAL_RANGE_ACCURACY` enum('frequent_errors','simple_only','moderate_range','accurate_with_complex','wide_and_consistent_accuracy') DEFAULT NULL,
  `PRONUNCIATION` enum('unclear','hard_to_understand','mostly_clear','clear_and_natural','native_like') DEFAULT NULL,
  `IDEA_ORGANIZATION` enum('no_structure','jumpy','basic_sequence','clear_flow','well_structured') DEFAULT NULL,
  `TOPIC_HANDLING` enum('off_topic','barely_on_topic','partially_developed','developed','insightful_response') DEFAULT NULL,
  `INTERACTIVE_COMMUNICATION` enum('minimal','reluctant','adequate','responsive','engaging_and_natural') DEFAULT NULL,
  `CONFIDENCE_LEVEL` enum('very_nervous','nervous','neutral','confident','very_confident') DEFAULT NULL,
  PRIMARY KEY (`KIT_IELTS_SPEAKING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_SPEAKING` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_ielts_writing_task1`
--

DROP TABLE IF EXISTS `kit_ielts_writing_task1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_ielts_writing_task1` (
  `KIT_IELTS_WRITING_TASK1_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `TASK_ACHIEVEMENT` enum('off_topic','insufficient_data_coverage','partial_summary','clear_summary','fully_meets_requirements') DEFAULT NULL,
  `COHERENCE_COHESION` enum('no_logical_flow','some_linking','adequate_organization','logical_and_effective','seamless_and_engaging') DEFAULT NULL,
  `LEXICAL_RESOURCE` enum('basic_words_only','repetitive','moderate_range','varied_and_precise','advanced_and_natural') DEFAULT NULL,
  `GRAMMATICAL_RANGE_ACCURACY` enum('many_errors','basic_structures_only','mostly_correct','some_complex_structures','complex_and_accurate') DEFAULT NULL,
  `TONE_FORMALITY` enum('too_informal','slightly_informal','appropriate','formal','perfectly_matched') DEFAULT NULL,
  `VISUAL_DESCRIPTION_SKILL` enum('missing_comparison','basic_reporting','some_comparison','well_analyzed','insightful_and_concise') DEFAULT NULL,
  PRIMARY KEY (`KIT_IELTS_WRITING_TASK1_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_WRITING_TASK1` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_ielts_writing_task2`
--

DROP TABLE IF EXISTS `kit_ielts_writing_task2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_ielts_writing_task2` (
  `KIT_IELTS_WRITING_TASK2_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `TASK_RESPONSE` enum('off_topic','weak_argument','partially_addressed','clearly_addressed','fully_developed') DEFAULT NULL,
  `COHERENCE_COHESION` enum('no_logical_flow','some_linking','adequate_organization','logical_and_effective','seamless_and_engaging') DEFAULT NULL,
  `LEXICAL_RESOURCE` enum('basic_words_only','repetitive','moderate_range','varied_and_precise','advanced_and_natural') DEFAULT NULL,
  `GRAMMATICAL_RANGE_ACCURACY` enum('many_errors','basic_structures_only','mostly_correct','some_complex_structures','complex_and_accurate') DEFAULT NULL,
  `ARGUMENT_QUALITY` enum('no_argument','weak_claims','some_support','well_supported','convincing_and_logical') DEFAULT NULL,
  `IDEAS_ORIGINALITY` enum('very_common','somewhat_generic','some_freshness','original_and_thoughtful','highly_creative') DEFAULT NULL,
  `COUNTERARGUMENT_HANDLING` enum('none','weak_or_forced','acknowledged','refuted_effectively','masterfully_addressed') DEFAULT NULL,
  PRIMARY KEY (`KIT_IELTS_WRITING_TASK2_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_IELTS_WRITING_TASK2` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_reading`
--

DROP TABLE IF EXISTS `kit_reading`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_reading` (
  `KIT_ACADEMIC_READING_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `TRANSLATION` enum('none','minimal','partial','full') DEFAULT NULL,
  `TRANSLATION_TYPE` enum('none','dictionary','google_lens','speech','macbook_translation') DEFAULT NULL,
  `COMPREHENSION_DEPTH` enum('no_understanding','minimal','basic','moderate','good','strong','mastery') DEFAULT NULL,
  `PROOF_TRACE_ABILITY` enum('non_proof','lost_immediately','followed_some_steps','mostly_followed','fully_followed','followed_and_critiqued') DEFAULT NULL,
  `LINKING_TO_PREVIOUS_KNOWLEDGE` enum('no_connection_made','forced_linking','some_connections','natural_linking','integrated_into_framework') DEFAULT NULL,
  `MENTAL_FATIGUE` enum('very_fatigued','fatigued','slightly_fatigued','normal','fresh','very_fresh','extremely_fresh') DEFAULT NULL,
  `READING_SPEED_FOR_PROOF` enum('non_proof','extremely_slow','slow','average','fast','very_fast_with_understanding') DEFAULT NULL,
  `CONTENT_LEVEL` enum('very_easy','easy','moderate','hard','very_hard') DEFAULT NULL,
  `INTERESTING_LEVEL` enum('extremely_boring','very_boring','boring','neutral','somewhat_interesting','interesting','extremely_interesting') DEFAULT NULL,
  PRIMARY KEY (`KIT_ACADEMIC_READING_ID`),
  KEY `AO_ID` (`AO_ID`),
  CONSTRAINT `fk_KIT_ACADEMIC_READING` FOREIGN KEY (`AO_ID`) REFERENCES `activity_output` (`AO_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kit_writing`
--

DROP TABLE IF EXISTS `kit_writing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kit_writing` (
  `KIT_ACADEMIC_WRITING_ID` int NOT NULL AUTO_INCREMENT,
  `AO_ID` int NOT NULL,
  `CURRENT_WORDS` int DEFAULT NULL,
  `MENTAL_FATIGUE` enum('very_fatigued','fatigued','neutral','energized','very_energized') DEFAULT NULL,
  `CONTENT_LEVEL` enum('very_easy','easy','moderate','difficult','very_difficult') DEFAULT NULL,
  `INTERESTING_LEVEL` enum('extremely_boring','very_boring','neutral','interesting','very_interesting') DEFAULT NULL,
  `AI_CHATBOT_USAGE_LEVEL` enum('none','light','moderate','heavy') DEFAULT NULL,
  PRIMARY KEY (`KIT_ACADEMIC_WRITING_ID`),
  KEY `AO_ID_idx` (`AO_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `minutes_per_day_second_ver`
--

DROP TABLE IF EXISTS `minutes_per_day_second_ver`;
/*!50001 DROP VIEW IF EXISTS `minutes_per_day_second_ver`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `minutes_per_day_second_ver` AS SELECT 
 1 AS `DAY`,
 1 AS `minutes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `ml_for_sleep`
--

DROP TABLE IF EXISTS `ml_for_sleep`;
/*!50001 DROP VIEW IF EXISTS `ml_for_sleep`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `ml_for_sleep` AS SELECT 
 1 AS `SLEEP_START_CATEGORY`,
 1 AS `SLEEP_END_CATEGORY`,
 1 AS `WAKE_FEELING_CATEGORY`,
 1 AS `MINUTES_PER_DAY_CATEGORY`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `ml_reading`
--

DROP TABLE IF EXISTS `ml_reading`;
/*!50001 DROP VIEW IF EXISTS `ml_reading`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `ml_reading` AS SELECT 
 1 AS `ACT_NAME`,
 1 AS `TOTAL_COUNT`,
 1 AS `minutes`,
 1 AS `BREAK_TIME`,
 1 AS `MENTAL_IN_BREAK`,
 1 AS `COMPREHENSION_DEPTH`,
 1 AS `PROOF_TRACE_ABILITY`,
 1 AS `READING_SPEED_FOR_PROOF`,
 1 AS `LINKING_TO_PREVIOUS_KNOWLEDGE`,
 1 AS `MENTAL_FATIGUE`,
 1 AS `CONTENT_LEVEL`,
 1 AS `INTERESTING_LEVEL`,
 1 AS `ACTIVITY_TAGS`,
 1 AS `ACTIVITY_CATEGORY`,
 1 AS `IS_RESEARCH`,
 1 AS `DEVICE`,
 1 AS `TRANSLATION`,
 1 AS `TRANSLATION_TYPE`,
 1 AS `ACTLOG_LOCATION`,
 1 AS `AROUSAL`,
 1 AS `FOCUS_LEVEL`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `screen_time`
--

DROP TABLE IF EXISTS `screen_time`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `screen_time` (
  `SCREEN_TIME_ID` int NOT NULL AUTO_INCREMENT,
  `USER_ID` int NOT NULL,
  `DAY` date NOT NULL,
  `DEVICE` enum('smartphone','tablet','laptop','desktop','smartwatch','tv','other') DEFAULT NULL,
  `SCREEN_TIME` float DEFAULT NULL,
  `SOCIAL` float DEFAULT NULL,
  PRIMARY KEY (`SCREEN_TIME_ID`),
  KEY `SCREEN_TIME_ibfk_1` (`USER_ID`),
  CONSTRAINT `SCREEN_TIME_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sexual_log`
--

DROP TABLE IF EXISTS `sexual_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sexual_log` (
  `USER_ID` int NOT NULL,
  `SEXLOG_TIME` datetime NOT NULL,
  `SEXLOG_DURING` enum('very_short','short','medium','long','very_long') DEFAULT NULL,
  `PARTNERED` tinyint(1) DEFAULT NULL,
  `SATISFACTION` enum('very_unsatisfied','unsatisfied','neutral','satisfied','very_satisfied') DEFAULT NULL,
  `SEXLOG_LOCATION` enum('room','bedroom','bathroom','hotel','car','public place','living room','partner home','other') DEFAULT NULL,
  `SEXLOG_SHOOT` enum('none','very_weak','weak','moderate','strong','explosive') DEFAULT NULL,
  PRIMARY KEY (`USER_ID`,`SEXLOG_TIME`),
  CONSTRAINT `SEXUAL_LOG_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shower_log`
--

DROP TABLE IF EXISTS `shower_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shower_log` (
  `USER_ID` int NOT NULL,
  `SHOWER_START` datetime NOT NULL,
  `SHOWER_DURING` enum('very_short','short','medium','long','very_long') DEFAULT NULL,
  `SHOWER_TEMP` enum('freezing','cold','cool','mild','warm','hot','very_hot','scorching') DEFAULT NULL,
  PRIMARY KEY (`USER_ID`,`SHOWER_START`),
  CONSTRAINT `SHOWER_LOG_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sleep_log`
--

DROP TABLE IF EXISTS `sleep_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sleep_log` (
  `USER_ID` int NOT NULL,
  `SLEEP_START` datetime NOT NULL,
  `SLEEP_END` datetime DEFAULT NULL,
  `SLEEP_ALONE` tinyint(1) DEFAULT NULL,
  `SLEEP_TYPE` enum('night','nap','recovery','fragmented','other') DEFAULT NULL,
  `SLEEP_QUALITY` enum('extremely_poor','very_poor','poor','fair','good','very_good','excellent') DEFAULT NULL,
  `DREAM` enum('none','very_vague','vague','detailed','vivid') DEFAULT NULL,
  `IS_AWAKE` tinyint(1) DEFAULT NULL,
  `FELL_ASLEEP` enum('very_easy','easy','normal','difficult','very_difficult') DEFAULT NULL,
  `WAKE_FEELING` enum('very_groggy','groggy','neutral','refreshed','energized') DEFAULT NULL,
  `SLEEP_ENVIRONMENT` enum('terrible','poor','fair','good','excellent') DEFAULT NULL,
  `WAKE_UP_BY_ALARM` tinyint(1) DEFAULT NULL,
  `ALARM_VOLUME` enum('none','silent','very_low','low','medium','loud','very_loud') DEFAULT NULL,
  `IS_VIBRATE_ALARM` tinyint(1) DEFAULT NULL,
  `PHONE_BF_SLEEP` enum('none','very_short','short','moderate','long','very_long') DEFAULT NULL,
  `PRE_SLEEP_THOUGHT` enum('none','very_low','low','medium','high','very_high') DEFAULT NULL,
  PRIMARY KEY (`USER_ID`,`SLEEP_START`),
  CONSTRAINT `SLEEP_LOG_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `users` (`USER_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_auth`
--

DROP TABLE IF EXISTS `user_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_auth` (
  `USER_ID` int NOT NULL,
  `USERNAME` varchar(120) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `PASSWORD_SALT` varchar(255) NOT NULL,
  `PASSWORD_HASH` varchar(255) NOT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UPDATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`USER_ID`),
  UNIQUE KEY `USERNAME` (`USERNAME`),
  UNIQUE KEY `EMAIL` (`EMAIL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_chat_preference`
--

DROP TABLE IF EXISTS `user_chat_preference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_chat_preference` (
  `USER_ID` int NOT NULL,
  `PROVIDER` varchar(64) NOT NULL,
  `MODEL` varchar(128) NOT NULL,
  `UPDATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`USER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_import_wizard_draft`
--

DROP TABLE IF EXISTS `user_import_wizard_draft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_import_wizard_draft` (
  `USER_ID` int NOT NULL,
  `DRAFT_JSON` longtext NOT NULL,
  `UPDATED_AT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`USER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `USER_ID` int NOT NULL AUTO_INCREMENT,
  `FULLNAME` varchar(100) NOT NULL,
  `BIRTH` date NOT NULL,
  `GENDER` enum('male','female','other') NOT NULL,
  `MAJOR` varchar(100) NOT NULL,
  `USER_LOCATION` varchar(100) NOT NULL,
  PRIMARY KEY (`USER_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'bancie'
--

--
-- Final view structure for view `baitap_toan`
--

/*!50001 DROP VIEW IF EXISTS `baitap_toan`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `baitap_toan` AS select `activity`.`ACT_NAME` AS `ACT_NAME`,`kit_count`.`TOTAL_COUNT` AS `TOTAL_COUNT`,(timestampdiff(MINUTE,`activity_log`.`ACTLOG_START`,`activity_output`.`AO_FINISH`) - `activity_output`.`BREAK_TIME`) AS `minutes`,`activity_output`.`MENTAL_IN_BREAK` AS `MENTAL_IN_BREAK`,`activity_output`.`FOCUS_LEVEL` AS `FOCUS_LEVEL`,`activity_log`.`ACTLOG_LOCATION` AS `ACTLOG_LOCATION`,`activity_log`.`CLEAN_LEVEL` AS `CLEAN_LEVEL`,`activity_log`.`MOOD` AS `MOOD`,`activity_log`.`HUNGER` AS `HUNGER`,`activity_log`.`AROUSAL` AS `AROUSAL` from (((`kit_count` join `activity_output` on((`kit_count`.`AO_ID` = `activity_output`.`AO_ID`))) join `activity_log` on((`activity_output`.`ACTI_LOG_ID` = `activity_log`.`ACTI_LOG_ID`))) join `activity` on(((`activity_log`.`USER_ID` = `activity`.`USER_ID`) and (`activity_log`.`ACTIVITY_ID` = `activity`.`ACTIVITY_ID`)))) where (`kit_count`.`UNIT_COUNT` like 'exercises') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `bayes_act`
--

/*!50001 DROP VIEW IF EXISTS `bayes_act`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `bayes_act` AS select `activity`.`USER_ID` AS `USER_ID`,`activity`.`ACTIVITY_ID` AS `ACTIVITY_ID`,`activity`.`ACT_NAME` AS `ACT_NAME`,`activity`.`PRIOR_PROB` AS `PRIOR_PROB`,`activity`.`POSTERIOR_PROB_LEARNING` AS `POSTERIOR_PROB_LEARNING`,`activity`.`POSTERIOR_PROB_OVERVIEW` AS `POSTERIOR_PROB_OVERVIEW`,`activity`.`POSTERIOR_PROB_PRACTICE` AS `POSTERIOR_PROB_PRACTICE` from `activity` where (`activity`.`ACT_STATUS` = 'in_progress') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_activity_log`
--

/*!50001 DROP VIEW IF EXISTS `current_activity_log`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `current_activity_log` AS select `activity_log`.`USER_ID` AS `USER_ID`,`activity_log`.`ACTIVITY_ID` AS `ACTIVITY_ID`,`activity_log`.`ACTI_LOG_ID` AS `ACTI_LOG_ID`,`activity`.`ACT_NAME` AS `ACT_NAME`,cast(`activity_log`.`ACTLOG_START` as time) AS `START_TIME` from (`activity_log` join `activity` on(((`activity_log`.`USER_ID` = `activity`.`USER_ID`) and (`activity_log`.`ACTIVITY_ID` = `activity`.`ACTIVITY_ID`)))) where (cast(`activity_log`.`ACTLOG_START` as date) = curdate()) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_activity_output`
--

/*!50001 DROP VIEW IF EXISTS `current_activity_output`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `current_activity_output` AS select `current_activity_log`.`USER_ID` AS `USER_ID`,`activity_output`.`AO_ID` AS `AO_ID`,`current_activity_log`.`ACT_NAME` AS `ACT_NAME`,`current_activity_log`.`START_TIME` AS `START_TIME`,cast(`activity_output`.`AO_FINISH` as time) AS `FINISH_TIME` from (`activity_output` join `current_activity_log` on((`activity_output`.`ACTI_LOG_ID` = `current_activity_log`.`ACTI_LOG_ID`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `hf_reading_performance`
--

/*!50001 DROP VIEW IF EXISTS `hf_reading_performance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `hf_reading_performance` AS select (case when (timestampdiff(YEAR,`users`.`BIRTH`,curdate()) < 18) then 'child' when ((timestampdiff(YEAR,`users`.`BIRTH`,curdate()) >= 18) and (timestampdiff(YEAR,`users`.`BIRTH`,curdate()) < 30)) then 'young_adult' when ((timestampdiff(YEAR,`users`.`BIRTH`,curdate()) >= 30) and (timestampdiff(YEAR,`users`.`BIRTH`,curdate()) < 60)) then 'adult' when (timestampdiff(YEAR,`users`.`BIRTH`,curdate()) >= 60) then 'senior' else 'unknown' end) AS `AGE_CATEGORY`,`users`.`GENDER` AS `GENDER`,`users`.`MAJOR` AS `MAJOR`,timestampdiff(MINUTE,`activity_log`.`ACTLOG_START`,`activity_output`.`AO_FINISH`) AS `MINUTES_READING`,`activity_output`.`BREAK_TIME` AS `MINUTES_BREAK`,(case when (`activity_output`.`FOCUS_LEVEL` in ('very_low','low')) then 1 when (`activity_output`.`FOCUS_LEVEL` = 'medium') then 2 when (`activity_output`.`FOCUS_LEVEL` in ('high','very_high')) then 3 else NULL end) AS `FOCUS_LEVEL`,`kit_count`.`TOTAL_COUNT` AS `PAGES`,(case when (`kit_reading`.`CONTENT_LEVEL` in ('very_easy','easy')) then 1 when (`kit_reading`.`CONTENT_LEVEL` = 'moderate') then 2 when (`kit_reading`.`CONTENT_LEVEL` in ('hard','very_hard')) then 3 else NULL end) AS `CONTENT_LEVEL_ENUM`,`activity`.`ACTIVITY_CATEGORY` AS `READING_GENRE`,`activity_log`.`SOUND_VOLUME` AS `SOUND_VOLUME`,`activity_log`.`DEVICE` AS `DEVICE`,`activity_log`.`ACTLOG_LOCATION` AS `LOCATION`,`activity_log`.`WEATHER` AS `WEATHER`,`activity_log`.`MOOD` AS `MOOD`,`activity_log`.`HUNGER` AS `HUNGER`,`activity_log`.`AROUSAL` AS `AROUSAL`,`activity_output`.`MENTAL_IN_BREAK` AS `MENTAL_IN_BREAK`,`kit_reading`.`COMPREHENSION_DEPTH` AS `COMPREHENSION_DEPTH`,`kit_reading`.`LINKING_TO_PREVIOUS_KNOWLEDGE` AS `LINKING_TO_PREVIOUS_KNOWLEDGE`,`kit_reading`.`MENTAL_FATIGUE` AS `MENTAL_FATIGUE`,`kit_reading`.`INTERESTING_LEVEL` AS `INTERESTING_LEVEL` from (((((`users` join `activity` on((`users`.`USER_ID` = `activity`.`USER_ID`))) join `activity_log` on(((`users`.`USER_ID` = `activity_log`.`USER_ID`) and (`activity`.`ACTIVITY_ID` = `activity_log`.`ACTIVITY_ID`)))) join `activity_output` on((`activity_log`.`ACTI_LOG_ID` = `activity_output`.`ACTI_LOG_ID`))) join `kit_count` on((`activity_output`.`AO_ID` = `kit_count`.`AO_ID`))) join `kit_reading` on((`activity_output`.`AO_ID` = `kit_reading`.`AO_ID`))) where (`kit_count`.`UNIT_COUNT` like 'pages') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `minutes_per_day_second_ver`
--

/*!50001 DROP VIEW IF EXISTS `minutes_per_day_second_ver`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `minutes_per_day_second_ver` AS select cast(`activity_log`.`ACTLOG_START` as date) AS `DAY`,sum((timestampdiff(MINUTE,`activity_log`.`ACTLOG_START`,`activity_output`.`AO_FINISH`) - `activity_output`.`BREAK_TIME`)) AS `minutes` from (`activity_log` join `activity_output` on((`activity_log`.`ACTI_LOG_ID` = `activity_output`.`ACTI_LOG_ID`))) group by `DAY` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `ml_for_sleep`
--

/*!50001 DROP VIEW IF EXISTS `ml_for_sleep`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `ml_for_sleep` AS select (case when (cast(`sleep_log`.`SLEEP_START` as time) between cast('18:00:00' as time(6)) and cast('23:00:00' as time(6))) then 'Early' when ((cast(`sleep_log`.`SLEEP_START` as time) >= cast('23:00:00' as time(6))) or (cast(`sleep_log`.`SLEEP_START` as time) < cast('06:00:00' as time(6)))) then 'Late' else 'Other' end) AS `SLEEP_START_CATEGORY`,(case when (cast(`sleep_log`.`SLEEP_END` as time) between cast('04:00:00' as time(6)) and cast('07:00:00' as time(6))) then 'Early' when ((cast(`sleep_log`.`SLEEP_END` as time) >= cast('07:00:00' as time(6))) or (cast(`sleep_log`.`SLEEP_END` as time) < cast('18:00:00' as time(6)))) then 'Late' else 'Other' end) AS `SLEEP_END_CATEGORY`,(case when (`sleep_log`.`WAKE_FEELING` in ('very_groggy','groggy')) then 'Bad' else 'Good' end) AS `WAKE_FEELING_CATEGORY`,(case when (`minutes_per_day_second_ver`.`minutes` is null) then 'None' when ((`minutes_per_day_second_ver`.`minutes` > 0) and (`minutes_per_day_second_ver`.`minutes` < 130)) then 'Acceptable' when (`minutes_per_day_second_ver`.`minutes` >= 130) then 'Good' else 'Unknown' end) AS `MINUTES_PER_DAY_CATEGORY` from (`sleep_log` left join `minutes_per_day_second_ver` on((cast(`sleep_log`.`SLEEP_END` as date) = `minutes_per_day_second_ver`.`DAY`))) where (`sleep_log`.`SLEEP_TYPE` = 'night') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `ml_reading`
--

/*!50001 DROP VIEW IF EXISTS `ml_reading`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `ml_reading` AS select `activity`.`ACT_NAME` AS `ACT_NAME`,`kit_count`.`TOTAL_COUNT` AS `TOTAL_COUNT`,(timestampdiff(MINUTE,`activity_log`.`ACTLOG_START`,`activity_output`.`AO_FINISH`) - `activity_output`.`BREAK_TIME`) AS `minutes`,`activity_output`.`BREAK_TIME` AS `BREAK_TIME`,`activity_output`.`MENTAL_IN_BREAK` AS `MENTAL_IN_BREAK`,`kit_reading`.`COMPREHENSION_DEPTH` AS `COMPREHENSION_DEPTH`,`kit_reading`.`PROOF_TRACE_ABILITY` AS `PROOF_TRACE_ABILITY`,`kit_reading`.`READING_SPEED_FOR_PROOF` AS `READING_SPEED_FOR_PROOF`,`kit_reading`.`LINKING_TO_PREVIOUS_KNOWLEDGE` AS `LINKING_TO_PREVIOUS_KNOWLEDGE`,`kit_reading`.`MENTAL_FATIGUE` AS `MENTAL_FATIGUE`,`kit_reading`.`CONTENT_LEVEL` AS `CONTENT_LEVEL`,`kit_reading`.`INTERESTING_LEVEL` AS `INTERESTING_LEVEL`,`activity`.`ACTIVITY_TAGS` AS `ACTIVITY_TAGS`,`activity`.`ACTIVITY_CATEGORY` AS `ACTIVITY_CATEGORY`,`activity`.`IS_RESEARCH` AS `IS_RESEARCH`,`activity_log`.`DEVICE` AS `DEVICE`,`kit_reading`.`TRANSLATION` AS `TRANSLATION`,`kit_reading`.`TRANSLATION_TYPE` AS `TRANSLATION_TYPE`,`activity_log`.`ACTLOG_LOCATION` AS `ACTLOG_LOCATION`,`activity_log`.`AROUSAL` AS `AROUSAL`,`activity_output`.`FOCUS_LEVEL` AS `FOCUS_LEVEL` from ((((`kit_count` join `activity_output` on((`kit_count`.`AO_ID` = `activity_output`.`AO_ID`))) join `activity_log` on((`activity_output`.`ACTI_LOG_ID` = `activity_log`.`ACTI_LOG_ID`))) join `activity` on(((`activity_log`.`USER_ID` = `activity`.`USER_ID`) and (`activity_log`.`ACTIVITY_ID` = `activity`.`ACTIVITY_ID`)))) join `kit_reading` on((`kit_count`.`AO_ID` = `kit_reading`.`AO_ID`))) where ((`kit_count`.`UNIT_COUNT` like 'pages') and (`kit_reading`.`TRANSLATION` is not null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-03  9:36:07
