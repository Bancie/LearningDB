USE bancie;

insert into `USERS`(`FULLNAME`,`BIRTH`,`GENDER`,`MAJOR`,`USER_LOCATION`)
values ('Nguyễn Chí Bằng','2003-09-03','male','student','district 5, Ho Chi Minh city');

create view `bayes_act` as
select `USER_ID`, `ACTIVITY_ID`, `ACT_NAME`, `PRIOR_PROB`, `POSTERIOR_PROB_LEARNING`, `POSTERIOR_PROB_OVERVIEW`, `POSTERIOR_PROB_PRACTICE`
from `ACTIVITY`
where `ACT_STATUS`='in_progress';

create view `minutes_per_day_second_ver` as
select `DAY_ID`, sum(timestampdiff(minute, `ACTLOG_START`, `AO_FINISH`)) as `minutes`
from `ACTIVITY_LOG`
natural join `ACTIVITY_OUTPUT`
natural join `DAY`
group by `DAY_ID`;

create view `current_activity_log` as
select `USER_ID`, `DAY_ID`, `ACTIVITY_ID`, `ACT_NAME`, `ACTLOG_START`
from `ACTIVITY_LOG`
natural join `ACTIVITY`
natural join `DAY`
where date(`DAY`)=curdate();

create view `current_activity_output` as
select `USER_ID`, `AO_ID`, `ACT_NAME`, `ACTLOG_START`, `AO_FINISH` from `ACTIVITY_OUTPUT` natural join `current_activity_log`;