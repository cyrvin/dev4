var express = require('express');
var http = require('http');
var Q = require('q');

var Scrapper = require('./managers/Scrapper');

var App = function() {};

App.prototype.start = function(options) {
	var self = this;
	this.options = options;

	// this.initUncaughtExceptionCatcher();

	var mongoManager = require('./managers/MongoManager');
	mongoManager.init()
		.then(function() {
			self.scrapper = new Scrapper();
			self.initExpressServer();
			self.initAPI();
			self.initFront();
			self.run();
		})
		.done();
};

App.prototype.initExpressServer = function() {
	this.app = express();
	this.server = http.createServer(this.app);

	var morgan = require('morgan');
	var bodyParser = require('body-parser');
	var methodOverride = require('method-override');
	var compress = require('compression');

	this.app.use(bodyParser.urlencoded({
		extended: true,
		limit: '15mb'
	}));
	this.app.use(bodyParser.json({
		limit: '15mb'
	}));
	this.app.use(methodOverride());
	this.app.use(compress());
	if (this.options.mode != 'prod') {
		this.app.use(morgan('dev'));
	}
	this.app.set('options', this.options);
	this.app.enable('trust proxy');
	this.app.set('views', __dirname + '/views');
	console.log('Init Express...OK');
};

App.prototype.initFront = function() {
	this.app.set('views', __dirname + '/views');
	this.app.use(express.static(__dirname + '/public'));
	this.app.use('/', function(req, res) {
		res.render('index.jade');
	});
};

App.prototype.initAPI = function() {
	this.app.use('/api', require('./routers/apiRouter'));
	console.log('Init APIs... OK');
};

App.prototype.initUncaughtExceptionCatcher = function() {
	process.on('uncaughtException', function(exception) {
		console.log('Uncaught exception : ', exception);
	});
};

App.prototype.run = function() {
	if (this.options.scrapperInit) {
		console.log('Init scrap');
		this.scrapper.scrapNafCodes();
	}
	var port = this.options.port;
	this.server.listen(port);
};

module.exports = App;