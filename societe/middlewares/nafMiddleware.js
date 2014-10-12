var NafCodeModel = require('../models/NafCode').NafCode;

exports.getAll = function(req, res, next) {
	var params = req.body || {};

	NafCodeModel.getAll(params, function(err, nafCodes) {
		console.log(nafCodes.length);
		res.send(200, nafCodes);
	});

};