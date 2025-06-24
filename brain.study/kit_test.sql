USE study;

CREATE TABLE KIT_ACADEMIC_READING (
    AO_ID INT NOT NULL,
    COMPREHENSION_DEPTH ENUM('surface_level', 'partial_understanding', 'understood_core_ideas', 'grasped_all_arguments', 'deep_and_connected_insight'),
    PROOF_TRACE_ABILITY ENUM('non-proof', 'lost_immediately', 'followed_some_steps', 'mostly_followed', 'fully_followed', 'followed_and_critiqued'),
    LINKING_TO_PREVIOUS_KNOWLEDGE ENUM('no_connection_made', 'forced_linking', 'some_connections', 'natural_linking', 'integrated_into_framework'),
    MENTAL_FATIGUE ENUM('exhausted_quickly', 'tired_early', 'moderately_fatigued', 'sustained_attention', 'deep_focus_maintained'),
    READING_SPEED_FOR_PROOF ENUM('non-proof', 'extremely_slow', 'slow', 'average', 'fast', 'very_fast_with_understanding'),
    READING_AMOUNT ENUM('none', 'barely_any', 'light', 'moderate', 'substantial', 'intensive', 'extensive'),
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (AO_ID) REFERENCES ACTIVITY_OUTPUT(AO_ID) ON DELETE CASCADE
);

-- IELTS KIT_TESTS

CREATE TABLE KIT_IELTS_LISTENING (
    AO_ID INT NOT NULL,
    SCORE_BAND FLOAT CHECK (SCORE_BAND BETWEEN 0 AND 9),
    COMPREHENSION_TYPE ENUM('multiple_choice', 'form_completion', 'map_diagram', 'matching', 'sentence_completion', 'summary_completion', 'short_answer'),
    TOPIC_FAMILIARITY ENUM('very_unfamiliar', 'unfamiliar', 'neutral', 'familiar', 'very_familiar'),
    SPEED_HANDLING ENUM('lost', 'struggled', 'managed_okay', 'comfortable', 'fluent_response'),
    SPELLING_ACCURACY ENUM('poor', 'needs_improvement', 'adequate', 'good', 'perfect'),
    ANSWER_COMPLETION ENUM('mostly_blank', 'partially_filled', 'mostly_filled', 'fully_filled_but_incorrect', 'fully_correct'),
    AUDIO_RECOGNITION ENUM('missed_info', 'some_misheard', 'understood_main_ideas', 'understood_details', 'complete_understanding'),
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (AO_ID) REFERENCES ACTIVITY_OUTPUT(AO_ID) ON DELETE CASCADE
);

CREATE TABLE KIT_IELTS_READING (
    AO_ID INT NOT NULL,
    SCORE_BAND FLOAT CHECK (SCORE_BAND BETWEEN 0 AND 9),
    COMPREHENSION_TYPE ENUM('matching_headings', 'multiple_choice', 'true_false_not_given', 'yes_no_not_given', 'summary_completion', 'sentence_completion', 'note_table_flowchart_completion', 'short_answer'),
    TIME_MANAGEMENT ENUM('ran_out_of_time', 'barely_finished', 'just_in_time', 'finished_early', 'finished_with_review'),
    READING_SPEED ENUM('very_slow', 'slow', 'average', 'fast', 'very_fast'),
    COMPREHENSION_DEPTH ENUM('missed_main_ideas', 'got_main_ideas', 'understood_details', 'inferred_meanings', 'mastered_all_levels'),
    TEXT_COMPLEXITY_HANDLING ENUM('too_difficult', 'challenging', 'just_right', 'easy', 'too_easy'),
    VOCABULARY_RECOGNITION ENUM('very_limited', 'limited', 'moderate', 'strong', 'expert'),
    ANSWER_ACCURACY ENUM('mostly_wrong', 'some_correct', 'about_half_correct', 'mostly_correct', 'all_correct'),
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (AO_ID) REFERENCES ACTIVITY_OUTPUT(AO_ID) ON DELETE CASCADE
);

CREATE TABLE KIT_IELTS_WRITING_TASK1 (
    AO_ID INT NOT NULL,
    TASK_ACHIEVEMENT ENUM('off_topic', 'insufficient_data_coverage', 'partial_summary', 'clear_summary', 'fully_meets_requirements'),
    COHERENCE_COHESION ENUM('no_logical_flow', 'some_linking', 'adequate_organization', 'logical_and_effective', 'seamless_and_engaging'),
    LEXICAL_RESOURCE ENUM('basic_words_only', 'repetitive', 'moderate_range', 'varied_and_precise', 'advanced_and_natural'),
    GRAMMATICAL_RANGE_ACCURACY ENUM('many_errors', 'basic_structures_only', 'mostly_correct', 'some_complex_structures', 'complex_and_accurate'),
    TONE_FORMALITY ENUM('too_informal', 'slightly_informal', 'appropriate', 'formal', 'perfectly_matched'),
    VISUAL_DESCRIPTION_SKILL ENUM('missing_comparison', 'basic_reporting', 'some_comparison', 'well_analyzed', 'insightful_and_concise'),
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (AO_ID) REFERENCES ACTIVITY_OUTPUT(AO_ID) ON DELETE CASCADE
);

CREATE TABLE KIT_IELTS_WRITING_TASK2 (
    AO_ID INT NOT NULL,
    TASK_RESPONSE ENUM('off_topic', 'weak_argument', 'partially_addressed', 'clearly_addressed', 'fully_developed'),
    COHERENCE_COHESION ENUM ('no_logical_flow', 'some_linking', 'adequate_organization', 'logical_and_effective', 'seamless_and_engaging'),
    LEXICAL_RESOURCE ENUM('basic_words_only', 'repetitive', 'moderate_range', 'varied_and_precise', 'advanced_and_natural'),
    GRAMMATICAL_RANGE_ACCURACY ENUM('many_errors', 'basic_structures_only', 'mostly_correct', 'some_complex_structures', 'complex_and_accurate'),
    ARGUMENT_QUALITY ENUM('no_argument', 'weak_claims', 'some_support', 'well_supported', 'convincing_and_logical'),
    IDEAS_ORIGINALITY ENUM('very_common', 'somewhat_generic', 'some_freshness', 'original_and_thoughtful', 'highly_creative'),
    COUNTERARGUMENT_HANDLING ENUM('none', 'weak_or_forced', 'acknowledged', 'refuted_effectively', 'masterfully_addressed'),
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (AO_ID) REFERENCES ACTIVITY_OUTPUT(AO_ID) ON DELETE CASCADE
);

CREATE TABLE KIT_IELTS_SPEAKING (
    AO_ID INT NOT NULL,
    FLUENCY_COHESION ENUM('frequent_pauses', 'hesitant', 'some_disfluency', 'mostly_fluent', 'naturally_fluent'),
    LEXICAL_RESOURCE ENUM('very_basic_words', 'repetitive', 'some_range', 'wide_range', 'rich_and_precise'),
    GRAMMATICAL_RANGE_ACCURACY ENUM('frequent_errors', 'simple_only', 'moderate_range', 'accurate_with_complex', 'wide_and_consistent_accuracy'),
    PRONUNCIATION ENUM('unclear', 'hard_to_understand', 'mostly_clear', 'clear_and_natural', 'native_like'),
    IDEA_ORGANIZATION ENUM('no_structure', 'jumpy', 'basic_sequence', 'clear_flow', 'well_structured'),
    TOPIC_HANDLING ENUM('off_topic', 'barely_on_topic', 'partially_developed', 'developed', 'insightful_response'),
    INTERACTIVE_COMMUNICATION ENUM('minimal', 'reluctant', 'adequate', 'responsive', 'engaging_and_natural'),
    CONFIDENCE_LEVEL ENUM('very_nervous', 'nervous', 'neutral', 'confident', 'very_confident'),
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (AO_ID) REFERENCES ACTIVITY_OUTPUT(AO_ID) ON DELETE CASCADE
);

-- INSERT KIT_TAB

USE study;

INSERT INTO `KIT_TESTS`(`KIT_TAB`)
VALUES
('KIT_ACADEMIC_READING'),
('KIT_IELTS_LISTENING'),
('KIT_IELTS_READING'),
('KIT_IELTS_WRITING_TASK1'),
('KIT_IELTS_WRITING_TASK2'),
('KIT_IELTS_SPEAKING');

-- UPDATE KIT_TEST

USE study;

ALTER TABLE KIT_ACADEMIC_READING
ADD BOOK_LEVEL ENUM('introductory', 'elementary', 'intermediate', 'advanced', 'expert');

USE study;

ALTER TABLE KIT_ACADEMIC_READING
RENAME COLUMN BOOK_LEVEL TO CONTENT_LEVEL

-- RESEARCH WRITING

USE study;

CREATE TABLE KIT_RESEARCH_WRITING (
    AO_ID INT NOT NULL,
    AMOUNT_WRITTEN ENUM('tiny', 'short', 'moderate', 'substantial', 'intensive'),
    ORIGINALITY ENUM('descriptive', 'emergent', 'creative', 'original_rigorous'),
    STRUCTURE ENUM('fragmented', 'loose', 'mostly_structured', 'clear', 'excellent'),
    PRIMARY KEY (AO_ID),
    FOREIGN KEY (AO_ID) REFERENCES ACTIVITY_OUTPUT(AO_ID) ON DELETE CASCADE
);
