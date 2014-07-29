create table nomenclature (
	nomenclatureUrl	varchar(200) primary key,
	scraped 	boolean default FALSE
);

create table activities (
	activityUrl varchar(200) primary key,
	label 		varchar(200),
	scraped 	boolean default FALSE
);

create table companies (
	companyUrl 	varchar(200) primary key,
	scraped 	boolean default FALSE
);

create table companyDetails (
	companyUrl 	varchar(200) primary key,
	yearCreated integer,
	address 	varchar(200),
	website 	varchar(100),
	siret 		varchar(15),
	activity 	varchar(500),
	ca2011 		integer,
	ca2012 		integer,
	ca2013 		integer
);

create table companyActivities (
	companyUrl 	varchar(200),
	rank 		varchar(10),
	activityUrl varchar(200),
	parentUrl	varchar(200),
	role 		varchar(1)
);