var request = require('request');
var cheerio = require('cheerio');
var fs 		= require('fs');
var readline= require('readline');
var stream 	= require('stream');
var Europages = require('./rds');

var nbEntriesPerPage = 80;

var streamCompanies 	= undefined;
var streamAddress 		= undefined;
var streamPresentation 	= undefined;
var streamGeneral	 	= undefined;
var streamFigures	 	= undefined;
var streamTel 			= undefined;
var streamActivities 	= undefined;
var streamContacts	 	= undefined;

/*------------------- CLASSE KOMPASS ----------------------------*/

var Kompass = function(){};

Kompass.prototype.iterateOnCompanyPages = function(countryCode) {

	var streamAddress 		= fs.createWriteStream('_address_' + countryCode + '.txt');
	var streamPresentation 	= fs.createWriteStream('_presentation_' + countryCode + '.txt');
	var streamGeneral	 	= fs.createWriteStream('_general_' + countryCode + '.txt');
	var streamFigures	 	= fs.createWriteStream('_figures_' + countryCode + '.txt');
	var streamTel 			= fs.createWriteStream('_telephone_' + countryCode + '.txt');
	var streamActivities 	= fs.createWriteStream('_activities_' + countryCode + '.txt');
	var streamContacts	 	= fs.createWriteStream('_contacts_' + countryCode + '.txt');

	var instream = fs.createReadStream('_companies_' + countryCode + '.txt');
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);

	rl.on('line', function(line) {
  		companyPage(line);
	});
}

Kompass.prototype.pageNomenclature = function(countryCode) {

	streamCompanies 	= fs.createWriteStream('_companies_' + countryCode + '.txt');
	var nomPage = 'http://' + countryCode + '.kompass.com/showNomenclature/';

	request(nomPage, function(error, response, html) {
		var $ = cheerio.load(html);
		$('#content > div > div > ul.categorie > li.span6 > a').each(function() {
			pageNomenclatureN2('http://' + countryCode + '.kompass.com' + $(this).attr('href'));
		});
	});
}

module.exports = Kompass;

/*------------------- FONCTIONS INTERNES ----------------------------*/

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
		var db = new DatabaseConnection();
		$('#content .row .prod_list a').each(function() {
			//streamCompanies.write($(this).attr('href') + '\n');
			db.writeCompanyUrl($(this).attr('href'));
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
		var db = new DatabaseConnection();
		$('#content .row .prod_list a').each(function() {
			//streamCompanies.write($(this).attr('href') + '\n');
			db.writeCompanyUrl($(this).attr('href'));
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
	if (label.lastIndexOf('(P)') > 0) 	return 'P';
	if (label.lastIndexOf('(D)') > 0) 	return 'D';
	if (label.lastIndexOf('(S)') > 0) 	return 'S';
	return '';
}

