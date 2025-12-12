-- Query to count study time in a day
-- This query calculates total study time per day by:
-- 1. Computing duration between activity start and finish
-- 2. Subtracting break time
-- 3. Grouping by date

SELECT 
    DATE(al.ACTLOG_START) AS study_date,
    SUM(
        TIMESTAMPDIFF(MINUTE, al.ACTLOG_START, ao.AO_FINISH) - 
        COALESCE(ao.BREAK_TIME, 0)
    ) AS total_study_minutes,
    SUM(
        TIMESTAMPDIFF(MINUTE, al.ACTLOG_START, ao.AO_FINISH) - 
        COALESCE(ao.BREAK_TIME, 0)
    ) / 60.0 AS total_study_hours,
    COUNT(DISTINCT al.ACTI_LOG_ID) AS number_of_sessions
FROM 
    ACTIVITY_LOG al
INNER JOIN 
    ACTIVITY_OUTPUT ao ON al.ACTI_LOG_ID = ao.ACTI_LOG_ID
INNER JOIN 
    ACTIVITY a ON al.ACTIVITY_ID = a.ACTIVITY_ID
WHERE 
    -- Optional: Filter for study-related activities only
    -- Uncomment the following line if you want to include only academic/study activities
    -- a.ACTIVITY_CATEGORY IN ('academic', 'language', 'self-development', 'technical_&_vocational')
    -- AND
    ao.AO_FINISH IS NOT NULL
    AND al.ACTLOG_START IS NOT NULL
GROUP BY 
    DATE(al.ACTLOG_START)
ORDER BY 
    study_date DESC;
