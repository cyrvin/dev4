var MongoManager = require('../managers/MongoManager.js');

var schemaSociete = new MongoManager.mongoose.Schema({
	// id: {
	// 	type: String,
	// 	unique: true
	// },
	// pubDate: {
	// 	type: Date,
	// 	index: true
	// },
	// params: {
	// 	id: {
	// 		type: String,
	// 		index: true
	// 	}
	// }
}, {
	strict: false
});

schemaSociete.statics.aggregateWithParams = function(params, cb) {
	var request = {};

	this
		.find(request)
		.exec(function(err, societes) {
			cb(err, societes);
		});

};

var SocieteModel = MongoManager.mongoose.model('societe', schemaSociete);

exports.Societe = SocieteModel;