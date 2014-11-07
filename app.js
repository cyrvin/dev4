var express = require("express");
var KompassNomenclature = require('./kompass2/scrap-nomenc-page');
var CompanyPageScraper 	= require('./kompass2/scrap-company-page');
var ActivityScrapperIterator = require('./queries/activity-pages-iterator-no-worker');
var SocieteScraper = require('./societe2/scrapSocieteBySiren');
var app = express();

var data 	= require('fs').readFileSync('./societe2/useragentswitcher.xml');

var port = Number(process.env.PORT || 5000);
//var port = 5002;

app.listen(port, function() {
	console.log("Listening on " + port);
});

/*------------------- FICHIER INDEX ------------------*/

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.render('index.html');
});

app.get('/kompass/scrapnomenclature/', function(req, res) {
	if (req.query.country == undefined) {
		console.log('Code pays manquant !');
		return;}	

	var kompass = new KompassNomenclature();
	kompass.nomenclaturePage(req.query.country);
});

app.get('/kompass/scrapactivity/', function(req, res) {
	var activityScrapper = new ActivityScrapperIterator();
	activityScrapper.batchActivities();
	setInterval(activityScrapper.batchActivities, 60000);
});

app.get('/kompass/scrapcompany/', function(req, res) {
	console.log('ok scrapcompany');
	var companyPageScrapper = new CompanyPageScraper();
	companyPageScrapper.batchActivities();
	setInterval(companyPageScrapper.batchActivities, 60000);
});

app.get('/societe/', function(req, res) {
	var societeScraper = new SocieteScraper();
	societeScraper.testXml();
	//setInterval(societeScraper.batchActivities, 1000);
});

console.log(data); 