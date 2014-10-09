var express = require("express");
var request = require('request');
var cheerio = require('cheerio');
var fs 		= require('fs');
var readline = require('readline');
var stream2 = require('stream');

var app = express();

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
});

var nbEntriesPerPage = 80;

var stream 				= fs.createWriteStream('1companies.txt');
var streamAddress 		= fs.createWriteStream('1address.txt');
var streamPresentation 	= fs.createWriteStream('1presentation.txt');
var streamGeneral	 	= fs.createWriteStream('1general.txt');
var streamFigures	 	= fs.createWriteStream('1figures.txt');
var streamTel 			= fs.createWriteStream('1telephone.txt');
var streamActivities 	= fs.createWriteStream('1activities.txt');
var streamContacts	 	= fs.createWriteStream('1contacts.txt');

// var countries =[
// 	'dz', 'ar', 'am', 'at', 'az', 'bd', 'by', 'be', 'br', 'bg', 'ca', 'cn', 'co', 'hr', 'cz', 'dk', 
// 	'eg', 'fi', 'ge', 'de', 'gr', 'hk', 'hu', 'in', 'ir', 'ie', 'it', 'jp', 'kz', 'kg', 'lv',
// 	'lb', 'lu', 'mx', 'md', 'mc', 'ma', 'nl', 'nz', 'no', 'pe', 'pl', 'pt', 'ro', 'ru', 'sm', 'rs',
// 	'sg', 'sk', 'si', 'za', 'kr', 'es', 'lk', 'se', 'ch', 'tw', 'th', 'tn', 'tr', 'ua', 'ae', 'gb',
// 	'us', 'vn'];

/*------------------- FICHIER INDEX ------------------*/

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.render('index.html');
});

/*--------------------------- ROUTES ------------------*/

// app.get('/kompass/test/', function(req, res) {
// 	companyPage('http://de.kompass.com/c/roi-management-consulting-ag/de602116/');
// });

iterateOnCompanyPages();

/*------------------- SCRAPING FUNCTIONS ------------------*/

function iterateOnCompanyPages() {
	var instream = fs.createReadStream('companies_fr.csv');
	var outstream = new stream2;
	var rl = readline.createInterface(instream, outstream);

	rl.on('line', function(line) {
  		companyPage(line);
	});
}

function pageNomenclature(countryCode) {
	var nomPage = 'http://' + countryCode + '.kompass.com/showNomenclature/';

	request(nomPage, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > ul.categorie > li.span6 > a').each(function() {
			pageNomenclatureN2('http://' + countryCode + '.kompass.com' + $(this).attr('href'));
		});
	});
}

function pageNomenclatureN2(nomenclatureUrl) {
	console.log('Nom2 : ' + nomenclatureUrl);
	request(nomenclatureUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > div > div.tab-content.pull-right > div.tab-pane > ul > li > a').each(function() {
			pageResultat($(this).attr('href'));
		});
	});
}

function pageResultat(activityUrl) {
	console.log('  -> Activity : ' + activityUrl);
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			stream.write(activityUrl  + ';' + $(this).attr('href') + '\n');
		});

		$('#result-count > strong').each(function() {
			nbResultat = parseInt($(this).text());
			if (nbResultat <= nbEntriesPerPage) return;

			nbPages = Math.min(Math.ceil(nbResultat / nbEntriesPerPage), 5); //Paging limité à 5 pages sur le search

			for (var i = 2 ; i <= nbPages ; i++) {
				pageResultatNext(activityUrl, activityUrl + 'page-' + i + '/');
			}
		});
	});
}

function pageResultatNext(activityRootUrl, activityUrl) {
	console.log('  -> Activity : ' + activityUrl);
	request(activityUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content .row .prod_list a').each(function() {
			stream.write(activityRootUrl  + ';' + $(this).attr('href') + '\n');
		});
	});
}

function companyPage(companyUrl) {
	console.log('Company : ' + companyUrl);
	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);

		//Address
		var i = 1;
		$('#productDetailUpdateable .productDescription > p').each(function() {
			streamAddress.write(companyUrl + ';' + (i++) + ';' + $(this).text().trim() + '\n');
		});

		//Telephone
		$('#productDetailUpdateable #phone').each(function() {
			streamTel.write(companyUrl + ';' + $(this).text().trim() + '\n');
		});

		//Presentation
		$('#content #tab-details .presentation p').each(function() {
			streamPresentation.write(companyUrl + ';' + $(this).text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim() + '\n');
		});

		//Informations generales
		$('#content #tab-details .global p').each(function() {
			var key = $(this).children('strong').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			var value = $(this).children('span').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			if (value == undefined) value = $(this).children('input').attr('value').replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			streamGeneral.write(companyUrl + ';' + key + ';' + value + '\n');
		});

		//Chiffres-clefs : effectifs et CA
		$('#tab-keynumbers .effectif-bloc').each(function() {
			var key = $(this).children('header').text().trim();
			var value = $(this).children('.number').text().trim();
			streamFigures.write(companyUrl + ';' + key + ';' + value + '\n');
		});

		//Main Activities - Niveau 1
		$('#tab-activities #mainActivitiesTree ul > li > a').each(function() {
			streamActivities.write(companyUrl + ';'  + 'Primary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Main Activities - Niveau 2
		$('#tab-activities #mainActivitiesTree ul > li > ul > li > a').each(function() {
			streamActivities.write(companyUrl + ';'  + 'Primary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Secondary Activities - Niveau 1
		$('#tab-activities #secondaryActivitiesTree ul > li > a').each(function() {
			streamActivities.write(companyUrl + ';'  + 'Secondary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Secondary Activities - Niveau 2
		$('#tab-activities #secondaryActivitiesTree ul > li > ul > li > a').each(function() {
			streamActivities.write(companyUrl + ';'  + 'Secondary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Dirigeants et collaborateurs
		$('#tab-dirigeants .bloc').each(function() {
			var firstName = $(this).children('.name').children('.firstName').text().trim();
			var lastName  = $(this).children('.name').children('.lastName').text().trim();
			var fonction  = $(this).children('.fonction').text().trim();
			streamContacts.write(companyUrl + ';' + firstName + ';' + lastName + ';' + fonction + '\n');
		});
	});
}

function parseRole(label) {
	var role = "";

	if 		(label.lastIndexOf('(P)') > 0) 	{role = 'P';}
	else if (label.lastIndexOf('(D)') > 0) 	{role = 'D';}
	else if (label.lastIndexOf('(S)') > 0) 	{role = 'S';}

	return role;
}