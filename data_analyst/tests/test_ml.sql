select * from ACTIVITY_LOG;

select *
from ACTIVITY
    natural join ACTIVITY_LOG
    natural join ACTIVITY_OUTPUT
    natural join KIT_COUNT
    natural join KIT_READING
where (TRANSLATION is not null)
    and (UNIT_COUNT like 'pages')
    and (ACTIVITY_CATEGORY like 'academic');

select (case
            when (cast(`bancie`.`sleep_log`.`SLEEP_START` as time) between cast('18:00:00' as time(6)) and cast('23:00:00' as time(6)))
                then 'Early'
            when ((cast(`bancie`.`sleep_log`.`SLEEP_START` as time) >= cast('23:00:00' as time(6))) or
                  (cast(`bancie`.`sleep_log`.`SLEEP_START` as time) < cast('06:00:00' as time(6)))) then 'Late'
            else 'Other' end)                                                                                    AS `SLEEP_START_CATEGORY`,
       (case
            when (cast(`bancie`.`sleep_log`.`SLEEP_END` as time) between cast('04:00:00' as time(6)) and cast('07:00:00' as time(6)))
                then 'Early'
            when ((cast(`bancie`.`sleep_log`.`SLEEP_END` as time) >= cast('07:00:00' as time(6))) or
                  (cast(`bancie`.`sleep_log`.`SLEEP_END` as time) < cast('18:00:00' as time(6)))) then 'Late'
            else 'Other' end)                                                                                    AS `SLEEP_END_CATEGORY`,
    (timestampdiff(MINUTE, SLEEP_START, SLEEP_END)) as TIME_SLEEP_MINUTE,
    SLEEP_ALONE,
    SLEEP_QUALITY,
    DREAM,
    IS_AWAKE,
    FELL_ASLEEP,
    WAKE_FEELING,
    SLEEP_ENVIRONMENT,
    WAKE_UP_BY_ALARM,
    ALARM_VOLUME,
    IS_VIBRATE_ALARM,
    PHONE_BF_SLEEP,
    PRE_SLEEP_THOUGHT
from  SLEEP_LOG
where (PRE_SLEEP_THOUGHT is not null)
    and (SLEEP_TYPE not like 'nap')
;

desc SLEEP_LOG;

select * from SLEEP_LOG
where PRE_SLEEP_THOUGHT is not null;

