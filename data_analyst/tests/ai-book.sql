SELECT timestampdiff(MINUTE, ACTLOG_START, AO_FINISH) as TIME_READING, BREAK_TIME, FOCUS_LEVEL, TOTAL_COUNT, UNIT_COUNT
FROM ACTIVITY
    natural join ACTIVITY_LOG
    natural join ACTIVITY_OUTPUT
    natural join KIT_COUNT
    natural join KIT_READING
where (TRANSLATION is not null)
    and (ACTIVITY_ID=12)
    and (unit_count like 'pages');