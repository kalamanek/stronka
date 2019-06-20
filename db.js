var debugLog = true;

var dbName = 'communicationSystem';

var merge = require('merge');
var mongojs = require('mongojs');
var querystring = require('querystring');

var crypto = require('crypto');

function genRandomString (length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};
function sha512(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

var db = mongojs(dbName);
db.dropDatabase();
module.exports = {
	checkCredentials:
		function(cred, callback) {
			db.collection('persons')
				.find({ email: cred.login})
				.toArray(function(err, docs) {
					//console.log("compare password: "+docs[0].password+" with " +sha512(cred.password,docs[0].salt).passwordHash);
					callback(((err || docs.length == 0 ) ? {} : 
						(docs[0].password !== sha512(cred.password,docs[0].salt).passwordHash ) ? {} : docs[0]) 
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
		cred.salt = genRandomString(15);
			db.collection('persons')
				.insert({ firstName: cred.firstName,
					lastName: cred.lastName,
					email: cred.email,
					password: sha512(cred.password, cred.salt).passwordHash,
					salt: cred.salt,
					groups: [] });
		},

	selectUser:
		function(person_id, callback) {
			db.collection('persons')
				.find({_id: person_id})
				.toArray(function(err, docs) {
					callback(err || docs.lenght == 0 ? {} :  docs[0]);
				});
		},
				
	selectAllUsers:
		function(callback) {
			db.collection('persons')
				.find()
				.toArray(function(err, docs) {
					callback(err ||docs.lenght == 0 ? {} :  docs);
				});
		},
		
	updateUser:
		function(user){
		var ObjectId = require('mongodb').ObjectID;
		if(user.password){
			user.salt = genRandomString(15);
			db.collection('persons')
				.update({_id: ObjectId(user._id)}, {$set: {
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					password: sha512(user.password, user.salt).passwordHash ,
					groups: user.groups ,
					role: user.role,
					salt: user.salt
				}})
		}else{
			db.collection('persons')
				.update({_id: ObjectId(user._id)}, {$set: {
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					groups: user.groups ,
					role: user.role
				}})
		}
		
		},


	personRemoveGroup:
        function (person_id, group_id) {
			var ObjectId = require('mongodb').ObjectID;
            db.collection('persons')
				.update({_id: ObjectId(person_id)},
					{$pull: {'groups': {'_id' : group_id}}});
			
            db.collection(group_id + 'users')
				.remove({'_id': ObjectId(person_id)});
        },
	removeUser:
        function (person_id) {
			var ObjectId = require('mongodb').ObjectID;

            db.collection('persons')
				.remove({'_id': ObjectId(person_id)});
        },

    personAddGroup:
        function (person, group_id, group_name) {
            db.collection('persons')
				.update({_id: person._id}, {$push: {'groups': {
					_id : group_id ,
					name : group_name ,
					color: 'black'
					}}});
		
            db.collection(group_id + 'users')
				.insert({
					'_id':person._id ,
					firstName : person.firstName ,
					lastName : person.lastName
					});
			
        },
	getGroupPersons:
		function (group_id,callback) {

            db.collection(group_id + 'users')
				.find({})
				.toArray(function (err, docs) {
					callback(err || docs.length == 0 ? {} : docs);
				});
			
        },
	selectGroups:
		function(callback) {
			db.collection('groups')
				.find({})
				.toArray(function(err, docs) {
					callback(err || docs);
				});
		},	
	addGroup:
		function(group_name , group_info , callback) {
			db.collection('groups')
				.insert({name : group_name , info : group_info});
			db.collection('groups')
				.find({name : group_name , info : group_info})
				.toArray(function(err, docs) {
					callback(err || docs.length == 0 ? {} : docs[0]);
				});
			
		},
	removeGroup:
		function(group_id) {
			var ObjectId = require('mongodb').ObjectID;
			
			db.collection(group_id + 'users')
				.drop();
			
			//leaving msg! like facebook :)
			
			db.collection('groups')
				.remove({_id : ObjectId(group_id)})
				
			 db.collection('persons')
				.update({},
					{$pull: {'groups': {'_id' : group_id}}});
			
			
		},

    selectMessagesOfGroup:
        function (group_id,N, callback) {
            db.collection(group_id+ 'msg')
			.find({})
			.sort({ $natural: -1 })
			.skip(N)
			.limit(11)
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
			
			 db.collection(group_id + 'users')
				.update({},{$set:{ seen :false}},{multi:true})
		}
			
}
