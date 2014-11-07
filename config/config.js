var config = {};

config.local_db = {};
config.local_db.host  		= '127.0.0.1';
config.local_db.user		= 'root';
config.local_db.password	= '';
config.local_db.port		= '3306';
config.local_db.database 	= 'kompass';

config.rds = {};
config.rds.host  	= 'kompassinstance.c4lm73gtthy1.eu-west-1.rds.amazonaws.com';
config.rds.user		= 'cyrille';
config.rds.password	= 'moimoimoi';
config.rds.port		= '3306';
config.rds.database = 'kompass';

config.kompass = {};
config.kompass.nbEntriesPerPage = 80;

module.exports = config;