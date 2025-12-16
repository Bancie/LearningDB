SELECT timestampdiff(MINUTE, ACTLOG_START, AO_FINISH) as TIME_READING,
    BREAK_TIME,
    CASE
        WHEN FOCUS_LEVEL IN ('very_low', 'low') THEN 1
        WHEN FOCUS_LEVEL = 'medium' THEN 2
        WHEN FOCUS_LEVEL IN ('high', 'very_high') THEN 3
        ELSE NULL
    END AS FOCUS_LEVEL,
    TOTAL_COUNT as PAGES,
    CASE
        WHEN CONTENT_LEVEL IN ('very_easy', 'easy') THEN 1
        WHEN CONTENT_LEVEL = 'moderate' THEN 2
        WHEN CONTENT_LEVEL IN ('hard', 'very_hard') THEN 3
        ELSE NULL
    END AS CONTENT_LEVEL_ENUM,
    -- (TOTAL_COUNT / timestampdiff(MINUTE, ACTLOG_START, AO_FINISH))*60 as PAGES_PER_HOUR,
    CASE 
        WHEN (TOTAL_COUNT / timestampdiff(MINUTE, ACTLOG_START, AO_FINISH))*60 > 5 THEN 'good'
        WHEN (TOTAL_COUNT / timestampdiff(MINUTE, ACTLOG_START, AO_FINISH))*60 < 5 THEN 'bad'
        ELSE NULL
    END AS PAGES_PER_HOUR_RATING
FROM ACTIVITY
    natural join ACTIVITY_LOG
    natural join ACTIVITY_OUTPUT
    natural join KIT_COUNT
    natural join KIT_READING
where (TRANSLATION is not null)
    and (ACTIVITY_ID=12)
    and (unit_count like 'pages');


DESC ACTIVITY_OUTPUT;