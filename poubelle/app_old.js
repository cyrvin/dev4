var express = require("express");
var db = require('./kompass/rdsdb');

// var KompassNomenclature = require('./kompass/scrap-nomenc-page');
// var KompassNomenclature2 = require('./kompass/scrap-nomenc-page-2');

// var workerFarm = require('worker-farm')
// var kompassActivityworkers 	= workerFarm(require.resolve('./kompass/scrap-activity-page'));
// var kompassCompanyworkers 	= workerFarm(require.resolve('./kompass/scrap-company-page'));

/*------------------- CONFIG EXPRESS ------------------*/

var app = express();

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
});

/*------------------- FICHIER INDEX ------------------*/

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.render('index.html');
});

/*--------------- SCRAP KOMPASS ---------------------------*/

app.get('/kompass/scrapnomenclature/', function(req, res) {
	if (req.query.country == undefined) {
		console.log('Code pays manquant !');
		return;}

	var kompass = new KompassNomenclature();
	kompass.nomenclaturePage(req.query.country);
});

app.get('/kompass/scrapnomenclature2/', function(req, res) {
	if (req.query.country == undefined) {
		console.log('Code pays manquant !');
		return;}

	var kompass = new KompassNomenclature2();
	kompass.nomenclaturePage2(req.query.country);
});

app.get('/kompass/scrapcompanies/', function(req, res) {
	if (req.query.country == undefined) {
		console.log('Code pays manquant !');
		return;}

	var kompass = new Kompass();
	kompass.iterateOnCompanyPages(req.query.country);
});

app.get('/kompass/activitypages', function(req, res) {
	var query = db.query('SELECT url FROM activityURls WHERE url NOT IN (SELECT DISTINCT activityUrl From companyUrls)');
	query.on('error', function(err) { console.log('There was an error with MySQL'); });
    query.on('result', function(result) {
    	kompassActivityworkers(result.url, function(err, outp) {
			if (err) console.log(err)
			var bidon = outp;
		});
    });
    query.on('end', function() { console.log('fini !!'); });
});

app.get('/kompass/companypages', function(req, res) {
	var query = db.query('SELECT url FROM companyUrls WHERE url NOT IN (SELECT url FROM companyPresentation)');
	query.on('error', function(err) { console.log('There was an error with MySQL'); });
    query.on('result', function(result) {
    	kompassCompanyworkers(result.url, function(err, outp) {
			if (err) console.log(err)
			var bidon = outp;
		});
    });
    query.on('end', function() { console.log('fini !!'); });
});
