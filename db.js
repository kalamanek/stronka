var debugLog = true;

var dbName = 'communicationSystem';

var merge = require('merge');
var mongojs = require('mongojs');
var querystring = require('querystring');

var db = mongojs(dbName);
db.dropDatabase();
module.exports = {
	checkCredentials:
		function(cred, callback) {
			db.collection('persons')
				.find({ email: cred.login,
					password: cred.password })
				.toArray(function(err, docs) {
					callback(err || docs.length == 0 ? {} : docs[0]
				);
			});
		},

	checkForUsedLogin:
		function(cred, callback) {
			db.collection('persons')
				.find({ email: cred.email })
				.toArray(function(err, docs) {
					callback(err || docs.length == 0 ? {} : docs[0]);
				});
		},

	insertUser:
		function(cred) {
			db.collection('persons')
				.insert({ firstName: cred.firstName,
					lastName: cred.lastName,
					email: cred.email,
					password: cred.password ,
					groups: [] });
		},

	selectUser:
		function(person_id, callback) {
			db.collection('persons')
				.find({_id: person_id})
				.toArray(function(err, docs) {
					callback(err ||docs[0].lenght == 0 ? {} :  docs[0]);
				});
		},

	personRemoveGroup:
        function (person_id, group_id) {
            db.collection('persons')
				.update({_id: person_id},
					{$pull: {'groups': {'_id' : group_id}}});
			
            db.collection(group_id + 'users')
				.remove({'user': person_id});
        },

    personAddGroup:
        function (person_id, group_id, group_name) {
            db.collection('persons')
				.update({_id: person_id}, {$push: {'groups': {_id : group_id , name : group_name }}});
		
            db.collection(group_id + 'users')
				.insert({'user': person_id});
			
        },
		
	selectGroups:
		function(callback) {
			db.collection('groups').find({}).toArray(function(err, docs) {
				callback(err || docs);
			});
		},

    selectMessagesOfGroup:
        function (group_id, callback) {
            db.collection(group_id+ 'msg')
			.find({})
			.toArray(function (err, docs) {
                callback(err || docs.length == 0 ? {} : docs);
            });
        },
    insertMessagesOfGroup:
		function (person_id, group_id, text, name) {
			db.collection(group_id + 'msg')
				.insert({_idperson: person_id,
					text: text,
						name: name});
		}
			
}
