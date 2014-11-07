var request = require('request');
var cheerio = require('cheerio');
var mysql   = require('mysql');
var data 	= require('fs').readFileSync('./useragentswitcher.xml');
var xml2js	= require('xml2js');
var config 	= require('../config/config');

var db = mysql.createConnection({
	host     : config.local_db.host,
	user     : config.local_db.user,
	password : config.local_db.password,
	port 	 : config.local_db.port,
	database : config.local_db.database
});

var SocieteScraper = function(){};

SocieteScraper.prototype.testXml = function() {
	console.log(data);   
};

SocieteScraper.prototype.batchActivities = function() {
	var query = db.query('SELECT siren FROM companySiren'
		+ ' WHERE scrapped IS NULL'
		+ ' LIMIT 2');
	query.on('error', function(err) { console.log('QUERY ERROR : ' + JSON.stringify(err))});
    query.on('result', function(result) {
		scrapeCompanyPage(result.siren);
		db.query('UPDATE companySiren SET scrapped = 1 WHERE siren = ?', [result.siren]);
	});
    query.on('end', function() {});
};

var scrapeCompanyPage = function(siren) {
	var queryUrl = 'http://www.societe.com/cgi-bin/mainsrch?champ=' + siren + '&imageField2.x=0&imageField2.y=0';

	request(queryUrl, function(error, response, html) {
		var $ = cheerio.load(html);
		var pathChiffresClefs = '.TitleBlack > b';
		$(pathChiffresClefs).each(function() {
			if ($(this).text().substring(0,8) == 'Chiffres') {
				var tableau  = cheerio.load($(this).parent().parent().parent().parent().parent().parent().next('tr')
					.children('td').children('table').children('tr').children('td').children('table').html());
				
				var rows = processTableau(siren, tableau);
				console.log('Insert rows for company ' + siren);
				db.query('INSERT IGNORE INTO societeChiffresClefs (siren, solde, periode, periode2, valeur) VALUES ? ', [rows], function(err, result) {
					if (err) console.log('ERREUR : ', err);
				});
			}
		});
	});
}

module.exports = SocieteScraper;

var processTableau = function(siren, tableau) {
	var tab = [];

	var ligneTitre;
	var ligneSousTitre;
	var rows = [];

	tableau('tr').each(function(i, elem){
		if(tableau(this).attr('align') !== undefined) {
			var ligne = cheerio.load(tableau(this).html());
			if (i == 0){
				ligneTitre = processPremiereTitre(ligne);
				ligneSousTitre = processPremiereSousTitre(ligne);
			}
			else {
				var lig = processLigne(ligne);
				var newRows = unPivotLigne(siren, ligneTitre, ligneSousTitre, lig);
				rows = rows.concat(newRows);
			};

			tab.push(lig);
		}
	})
	return rows;
}

var unPivotLigne = function(siren, ligneTitre, ligneSousTitre, ligne) {
	var solde;
	var rowArray = [];
	for (var i in ligne) {
		if (i == 0) solde = ligne[i];
		else {
			var row2 = [];
			row2.push(siren);
			row2.push(solde);
			row2.push(ligneTitre[i-1]);
			row2.push(ligneSousTitre[i-1]);
			row2.push(ligne[i]);
			rowArray.push(row2);
		}
	}
	return rowArray;
}

var processPremiereTitre = function(ligne) {
	var ligneTitre = [];

	ligne('td').each(function(j, elem2){
		if ((j == 2) || (j == 5) || (j == 8) || (j == 11))
			ligneTitre.push(ligne(this).text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim());
	})
	
	return ligneTitre;
}

var processPremiereSousTitre = function(ligne) {
	var ligneSousTitre = [];

	ligne('td').each(function(j, elem2){
		if ((j == 3) || (j == 6) || (j == 9) || (j == 12))
			ligneSousTitre.push(ligne(this).text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim());
	})
	
	return ligneSousTitre;
}

var processLigne = function(ligne) {
	var lig = [];

	ligne('td').each(function(j, elem){
		var cell = ligne(this).text().replace(/(?:(?:\r\n|\r|\n\'')\s*){2,}/ig, "").trim().replace('\'', '');
		if (cell.lastIndexOf('EBE',0) === 0)
			lig.push(cell.substring(0,3))
		else
			lig.push(cell);			
	})	
	return lig;
}
