var request = require('request');
var cheerio = require('cheerio');
var mysql   = require('mysql');

var workerFarm 	= require('worker-farm')
var genericInsertWorkers  = workerFarm(require.resolve('./insert-generic'));

var db = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	port 	 : '3306',
	database : 'kompass'
});

module.exports = function(companyUrl, callback) {
	console.log('Start companyPage : ' + companyUrl);
	var error = null;

	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);

		//Address
		var i = 1;
		$('#productDetailUpdateable .productDescription > p').each(function() {
			var value = {
				url: companyUrl, 
				line: i++,
				address: $(this).text().trim()
			};
			genericInsertWorkers('companyAddress', value, function(err, companyUrl){
				if (err) console.log('ERROR insert address on ' + companyUrl + ' : ' + err)
			});
		});

		//Telephone
		$('#productDetailUpdateable #phone').each(function() {
			var value = {
				url: companyUrl,
				tel: $(this).text().trim()
			};
			genericInsertWorkers('companyTel', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Presentation
		$('#content #tab-details .editorHtml p').each(function() {
			var value = {
				url: companyUrl,
				presentation: $(this).text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim()
			};
			genericInsertWorkers('companyPresentation', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Informations generales
		$('#content #tab-details .global p').each(function() {
			var typeInfo = $(this).children('strong').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			var valueInfo = $(this).children('span').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			if (valueInfo == undefined) valueInfo = $(this).children('span').attr('value').replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			var value = {
				url: companyUrl,
				infoType: typeInfo,
				infoValue: valueInfo
			};
			genericInsertWorkers('companyInformation', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Chiffres-clefs : effectifs et CA
		$('#tab-keynumbers .effectif-bloc').each(function() {
			var value = {
				url: companyUrl,
				infoType: $(this).children('header').text().trim(),
				infoValue: $(this).children('.number').text().trim()
			};
			genericInsertWorkers('companyInformation', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Main Activities - Niveau 1
		$('#tab-activities #mainActivitiesTree ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'P',
				role: parseRole($(this).children('ins').text().trim())
			};
			genericInsertWorkers('companyActivities', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Main Activities - Niveau 2
		$('#tab-activities #mainActivitiesTree ul > li > ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'P',
				role: parseRole($(this).children('ins').text().trim())
			};
			genericInsertWorkers('companyActivities', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Secondary Activities - Niveau 1
		$('#tab-activities #secondaryActivitiesTree ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'S',
				role: parseRole($(this).children('ins').text().trim())
			};
			genericInsertWorkers('companyActivities', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Secondary Activities - Niveau 2
		$('#tab-activities #secondaryActivitiesTree ul > li > ul > li > a').each(function() {
			var value = {
				url: companyUrl,
				activity: $(this).attr('id').trim(),
				rank: 'S',
				role: parseRole($(this).children('ins').text().trim())
			};
			genericInsertWorkers('companyActivities', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});

		//Dirigeants et collaborateurs
		$('#tab-dirigeants .bloc').each(function() {
			var value = {
				url: companyUrl,
				firstName: $(this).children('.name').children('.firstName').text().trim(),
				lastName: $(this).children('.name').children('.lastName').text().trim(),
				role: $(this).children('.fonction').text().trim()
			};
			genericInsertWorkers('companyContacts', value, function(err, companyUrl){
				if (err) console.log('ERROR insert tel on ' + companyUrl + ' : ' + err)
			});
		});
	});
	
	callback(null, companyUrl);
}

/*------------------- Internal functions ----------------------------*/

function parseRole(label) {
	if (label.lastIndexOf('(P)') > 0) 	return 'P';
	if (label.lastIndexOf('(D)') > 0) 	return 'D';
	if (label.lastIndexOf('(S)') > 0) 	return 'S';
	return '';
}
