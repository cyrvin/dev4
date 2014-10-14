var config = {};

config.db = {};
config.db.host  	= 'kompassinstance.c4lm73gtthy1.eu-west-1.rds.amazonaws.com';
config.db.user		= 'cyrille';
config.db.password	= 'moimoimoi';
config.db.port		= '3306';
config.db.database 	= 'kompass';

config.kompass = {};
config.kompass.nbEntriesPerPage = 80;

module.exports = config;