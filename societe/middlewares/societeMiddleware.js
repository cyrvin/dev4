var SocieteModel = require('../models/Societe').Societe;

exports.aggregateCompagnies = function(req, res, next) {
	var params = req.body || {};

	SocieteModel.aggregateWithParams(params, function(err, societes) {
		console.log(societes.length);
		res.send(200, societes);
	});

};