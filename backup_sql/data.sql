USE bancie;

insert into `USERS`(`FULLNAME`,`BIRTH`,`GENDER`,`MAJOR`,`USER_LOCATION`)
values ('Nguyễn Chí Bằng','2003-09-03','male','student','district 5, Ho Chi Minh city');


USE bancie;

insert into `ACTIVITY`(`USER_ID`,`ACT_NAME`,`ACTIVITY_TAGS`,`ACTIVITY_CATEGORY`,`IS_RESEARCH`,`ACT_STATUS`,`PRIOR_PROB`,`POSTERIOR_PROB_LEARNING`,`POSTERIOR_PROB_OVERVIEW`,`POSTERIOR_PROB_PRACTICE`)
values
(1,'Statistics for Business & Economics','mental','academic',0,'not_started',0,0,0,0),
(1,'[RESEARCH] Location-Scheduling Problem','productive','academic',1,'not_started',0,0,0,0),
(1,'Tư tưởng Hồ Chí Minh','social','academic',0,'not_started',0,0,0,0),
(1,'Lịch sử Đảng','social','academic',0,'not_started',0,0,0,0),
(1,'THE KEY TO IELTS SUCCESS - Pauline Cullen','productive','language',0,'not_started',0,0,0,0),
(1,'[CAM] GRAMMAR FOR IELTS WITH ANSWERS','productive','language',0,'not_started',0,0,0,0),
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