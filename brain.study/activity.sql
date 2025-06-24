USE study;

ALTER TABLE ACTIVITY
RENAME COLUMN ACT_DES TO ACT_NAME;

USE study;

ALTER TABLE ACTIVITY
MODIFY ACT_NAME varchar(100) AFTER KIT_ID;

ALTER TABLE ACTIVITY
MODIFY ACTIVITY_CATEGORY enum('academic','language','self-development','technical & vocational','creative arts','well-being & lifestyle') AFTER ACTIVITY_TAGS;

DESC ACTIVITY;