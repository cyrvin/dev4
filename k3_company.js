var request = require('request');
var cheerio = require('cheerio');

module.exports = function(companyUrl, callback) {
	console.log('Start companyPage : ' + companyUrl);
	request(companyUrl, function(error, response, html) {
		var $ = cheerio.load(html);

		//Address
		var i = 1;
		$('#productDetailUpdateable .productDescription > p').each(function() {
			//streamAddress.write(companyUrl + ';' + (i++) + ';' + $(this).text().trim() + '\n');
		});

		//Telephone
		$('#productDetailUpdateable #phone').each(function() {
			//streamTel.write(companyUrl + ';' + $(this).text().trim() + '\n');
		});

		//Presentation
		$('#content #tab-details .presentation p').each(function() {
			//streamPresentation.write(companyUrl + ';' + $(this).text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim() + '\n');
		});

		//Informations generales
		$('#content #tab-details .global p').each(function() {
			var key = $(this).children('strong').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			var value = $(this).children('span').text().replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			if (value == undefined) value = $(this).children('input').attr('value').replace(/(?:(?:\r\n|\r|\n)\s*){2,}/ig, "").trim();
			//streamGeneral.write(companyUrl + ';' + key + ';' + value + '\n');
		});

		//Chiffres-clefs : effectifs et CA
		$('#tab-keynumbers .effectif-bloc').each(function() {
			var key = $(this).children('header').text().trim();
			var value = $(this).children('.number').text().trim();
			//streamFigures.write(companyUrl + ';' + key + ';' + value + '\n');
		});

		//Main Activities - Niveau 1
		$('#tab-activities #mainActivitiesTree ul > li > a').each(function() {
			//streamActivities.write(companyUrl + ';'  + 'Primary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Main Activities - Niveau 2
		$('#tab-activities #mainActivitiesTree ul > li > ul > li > a').each(function() {
			//streamActivities.write(companyUrl + ';'  + 'Primary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Secondary Activities - Niveau 1
		$('#tab-activities #secondaryActivitiesTree ul > li > a').each(function() {
			//streamActivities.write(companyUrl + ';'  + 'Secondary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Secondary Activities - Niveau 2
		$('#tab-activities #secondaryActivitiesTree ul > li > ul > li > a').each(function() {
			//streamActivities.write(companyUrl + ';'  + 'Secondary' + ';' + $(this).attr('id').trim() + ';' + parseRole($(this).children('ins').text().trim()) + '\n');
		});

		//Dirigeants et collaborateurs
		$('#tab-dirigeants .bloc').each(function() {
			var firstName = $(this).children('.name').children('.firstName').text().trim();
			var lastName  = $(this).children('.name').children('.lastName').text().trim();
			var fonction  = $(this).children('.fonction').text().trim();
			//streamContacts.write(companyUrl + ';' + firstName + ';' + lastName + ';' + fonction + '\n');
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
