var casper = require('casper').create({
	verbose: true,
	stepTimeout: 10000,
	waitTimeout: 1000,
	pageSettings: {
		loadImages: true,
		loadPlugins: true
	},
	onError: function() {
		this.captureSelector('error.png', 'html');
	},
	logLevel: "debug"
});

var siren = '522393511';

casper.start('http://www.societe.com');

casper.then(function() {
	if (this.exists('input#Search')) {
		console.log('search filed');

		this.fill('form#FormSearch', {
			champ: siren
		}, true);
	}
});

casper.then(function() {
	console.log('clicked ok, new location is ' + this.getCurrentUrl());
});

casper.run(function() {
	this.echo('DONE').exit();
});