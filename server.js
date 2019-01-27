var fs = require('fs');
var http = require('http');
var path = require('path');
var mime = require('mime');
var Cookies = require('cookies');
var uu_id = require('uuid');
var WebSocket = require('ws');
   
require('./initialize.js');

var debugLog = true;
var initDB = true; // set to false to suppress DB initialization
var listeningPort = 8888;
var sessions = {};

function serveFile(rep, fileName, errorCode, message) {

    if (debugLog) console.log('Serving file ' + fileName + (message ? ' with message \'' + message + '\'' : ''));

    fs.readFile(fileName, function (err, data) {
        if (err) {
            serveError(rep, 404, 'Document ' + fileName + ' not found');
        } else {
            rep.writeHead(errorCode, message, {'Content-Type': mime.getType(path.basename(fileName))});
            if (message) {
                data = data.toString().replace('{errMsg}', rep.statusMessage).replace('{errCode}', rep.statusCode);
            }
            rep.end(data);
        }
    });
}

if (!debugLog) process.on('uncaughtException', function (err) {
    console.log('\nRUNTIME ERROR\n\n' + err + '\n\nexiting...');
    process.exit(1);
});

function serveError(rep, error, message) {
    serveFile(rep, 'html/error.html', error, message);
}

var db = require('./db.js');

function isEmptyObject(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function isLoggedIn(session) {
    if (session) {
        if (!isEmpty(sessions[session]._id)) {
            return true;
        }
    }
    return false;
}


function register(req, rep) {
    var item = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        item += chunk;
    }).on('end', function () {
        try {
            var cred = JSON.parse(item);

            if (debugLog) console.log('register ' + JSON.stringify(cred));
            if (!isEmptyObject(cred)) {

                if (cred.firstName.length < 2) throw 'Too short FirstName';
                if (cred.firstName.length > 20) throw 'Too long FirstName';
                if (cred.lastName.length < 2) throw 'Too short LastName';
                if (cred.lastName.length > 20) throw 'Too long LastName';
                if (cred.email.length < 2) throw 'Too short Email';
                if (cred.email.length > 20) throw 'Too long Email';
                if (cred.password.length < 2) throw 'Too short Password';
                if (cred.password.length > 20) throw 'Too long Password';
				
				db.checkForUsedLogin(cred, function (user) {
					if (isEmptyObject(user)) {
						db.insertUser(cred);
						rep.writeHead(200, 'Register successful', {'Content-Type': 'application/json'});
						rep.end(JSON.stringify({email: cred.email}));
						if (debugLog) console.log('New account ' + JSON.stringify(cred));
					} else {
						rep.writeHead(401, 'Register failed', {'Content-Type': 'application/json'});
						rep.end(JSON.stringify({registerMsg: 'email is already taken'}));
						if (debugLog) console.log(JSON.stringify(cred) + ' are not val_id credentials');
					}
				});

            } else {
                throw 'obj is empty'
            }
        } catch (e) {
            rep.writeHead(401, 'Register failed', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({registerMsg: 'Something goes wrong.'}));
            if (debugLog) console.log(JSON.stringify(cred) + e);
        }

    });
}

function logIn(req, rep, session) {
    var item = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        item += chunk;
    }).on('end', function () {
        try {
            var cred = JSON.parse(item);
            if (debugLog) console.log('log in ' + JSON.stringify(cred));
            db.checkCredentials(cred, function (user) {
                if (!isEmptyObject(user)) {
                    console.log(user);
                    if (session) {
                        sessions[session]._id = user._id;
                        sessions[session].login = cred.login;
                        sessions[session].firstName = user.firstName;
                        sessions[session].lastName = user.lastName;
                    }
                    rep.writeHead(200, 'Login successful', {'Content-Type': 'application/json'});
                    rep.end(JSON.stringify(user));
                    if (debugLog) console.log('User ' + JSON.stringify(user) + ' logged in');
				} else {
					rep.writeHead(401, 'Register failed', {'Content-Type': 'application/json'});
					rep.end(JSON.stringify({registerMsg: 'not val_id input'}));
					if (debugLog) console.log(JSON.stringify(cred) + ' are not val_id credentials');
				}
                
            });
        } catch (e) {
            rep.writeHead(401, 'Login failed', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({}));
            if (debugLog) console.log(JSON.stringify(cred) + ' are not val_id credentials' + e);
        }

    });
}

function logOut(req, rep, session) {
    if (debugLog) console.log('Destroying session ' + session + ': ' + JSON.stringify(sessions[session]));
    if (session) {
        delete sessions[session];
    }
    rep.writeHead(301, {Location: '/'});
    rep.end;
}

function whoAmI(req, rep, session) {
    rep.writeHead(200, 'Session info', {'Content-Type': 'application/json'});
    if (!isEmptyObject(session)) {
        rep.end(JSON.stringify(sessions[session]));
    } else {
        rep.end(JSON.stringify({}));
    }
}

function groups(req, rep, session) {
    db.selectGroups(function (groups) {
        rep.writeHead(200, 'Groups', {'Content-Type': 'application/json'});
        rep.end(JSON.stringify(groups));
    });
}

function userGetGroups(req, rep, session) {
    db.selectUser(sessions[session]._id, function (user) {
        rep.writeHead(200, 'User groups found', {'Content-Type': 'application/json'});
        rep.end(JSON.stringify(user.groups));
    });
}

function userRemoveFromGroup(req, rep, session) {
    var item = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        console.log(chunk);
        item += chunk;
    }).on('end', function () {
        try {
            var groupToDelete = JSON.parse(item);
            if (debugLog) console.log('Trying to delete user group ' + JSON.stringify(groupToDelete._id));

            db.personRemoveGroup(sessions[session]._id, groupToDelete._id);
            rep.writeHead(200, 'Delete user group', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({message: 'You ale not longer in this group.'}));
        } catch (e) {
            if (debugLog) console.log(e);
            rep.writeHead(401, 'Cannot delete group', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({message: 'Cannot delete user group'}));
        }

    });
}

function userAddToGroup(req, rep, session) {
    var item = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        console.log(chunk);
        item += chunk;
    }).on('end', function () {
        try {
            var groupToAdd = JSON.parse(item);
            if (debugLog) console.log('Trying to add user to group ' + JSON.stringify(groupToAdd._id));
            db.personAddGroup(sessions[session]._id, groupToAdd._id , groupToAdd.name);
			
            rep.writeHead(200, 'Add user group', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({message: 'You are in new group.'}));
        } catch (e) {
            if (debugLog) console.log(e);
            rep.writeHead(401, 'Cannot delete group', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({message: 'Cannot add user to this group'}));
        }
    });
}


function getGroupMessages(req, rep, session) {
    var item = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        item += chunk;
    }).on('end', function () {
        try {
            var groupToShow = JSON.parse(item);
            if (debugLog) console.log('asked for messages of group ' + JSON.stringify(groupToShow._id));
            db.selectMessagesOfGroup(groupToShow._id, function (data) {
                rep.writeHead(200, 'Messages of group', {'Content-Type': 'application/json'});
                rep.end(JSON.stringify(data));
            });
        } catch (e) {
            if (debugLog) console.log(e);
            rep.writeHead(401, 'Cannot select messages', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({message: 'Cannot show this group messages'}));
        }
    });
}


function sendGroupMessage(req, rep, session) {
    var item = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        item += chunk;
    }).on('end', function () {
        try {
            var message = JSON.parse(item);
            if (debugLog) console.log('Trying to send message ' + JSON.stringify(message.text) + ' to group ' + JSON.stringify(message.group_id));
            if (message.text.length > 0 && message.group_id.length > 0 && message.text.length < 100 && message.group_id.length < 30) {
                db.insertMessagesOfGroup(sessions[session]._id, message.group_id, message.text, sessions[session].firstName + " " + sessions[session].lastName);
                rep.writeHead(200, 'Messages send', {'Content-Type': 'application/json'});
                rep.end(JSON.stringify({message: 'Message has been sent'}));
            } else {
                rep.writeHead(401, 'Cannot send message text or group blank ', {'Content-Type': 'application/json'});
                rep.end(JSON.stringify({message: 'Cannot send messages'}));
            }
        } catch (e) {
            if (debugLog) console.log(e);
            rep.writeHead(401, 'Cannot send message', {'Content-Type': 'application/json'});
            rep.end(JSON.stringify({message: 'Cannot send messages'}));
        }
    });

}

var httpServer = http.createServer();

httpServer.on('request', function (req, rep) {

        if (debugLog) console.log('HTTP request URL: ' + req.method + ' ' + req.url);

        var cookies = new Cookies(req, rep);
        var session = cookies.get('session');
        var now = Date.now();
        if (!session || !sessions[session]) {
            session = uu_id();
            sessions[session] = {created: now, touched: now, login: ''};
            cookies.set("session", session, {httpOnly: false});
        } else {
            sessions[session].touched = now;
            cookies.set("session", session, {httpOnly: false});
        }

        if (isLoggedIn(session)) {
			switch (req.url) {
				case '/':
					serveFile(rep, 'html/index.html', 200, '');
					break;
				case '/favicon.ico':
					serveFile(rep, 'img/favicon.ico', 200, '');
					break;
				case '/auth':
					switch (req.method) {
						case 'GET':
							whoAmI(req, rep, session);
							break;
						case 'POST':
							logIn(req, rep, session);
							break;
						case 'DELETE':
							logOut(req, rep, session);
							break;
						case 'PUT':
							if (!isLoggedIn(session)) {
								register(req, rep, session);
								break;
							}
						default:
							serveError(rep, 405, 'Method not allowed');
					}
					break;
				case '/groups':
					switch (req.method) {
						case 'GET':
							groups(req, rep, session);
							break;
						case 'PUT':
							getGroupMessages(req, rep, session);
							break;
						default:
							serveError(rep, 405, 'Method not allowed');
					}
					break;
				case '/group/messages':
					switch (req.method) {
						case 'POST':
							sendGroupMessage(req, rep, session); 
							break;
						default:
							serveError(rep, 405, 'Method not allowed');
					}
					break;
				case '/user/groups':
					switch (req.method) {
						case 'GET':
							userGetGroups(req, rep, session);
							break;
						case 'POST':
							userRemoveFromGroup(req, rep, session);
							break;
						case 'DELETE':
							userRemoveFromGroup(req, rep, session);
							break;
						case 'PUT':
							userAddToGroup(req, rep, session); 
							break;
						default:
							serveError(rep, 405, 'Method not allowed');
					}
					break;
				default:
					if (/^\/(html|css|js|fonts|img)\//.test(req.url)) {
						var fileName = path.normalize('./' + req.url)
						serveFile(rep, fileName, 200, '');
					} else {
						serveError(rep, 403, 'Access denied');
					}
			}
		}else{
			switch (req.url) {
				case '/':
					serveFile(rep, 'html/index.html', 200, '');
					break;
				case '/favicon.ico':
					serveFile(rep, 'img/favicon.ico', 200, '');
					break;
				case '/auth':
					switch (req.method) {
						case 'GET':
							whoAmI(req, rep, session);
							break;
						case 'POST':
							logIn(req, rep, session);
							break;
						case 'DELETE':
							logOut(req, rep, session);
							break;
						case 'PUT':
							if (!isLoggedIn(session)) {
								register(req, rep, session);
								break;
							}
						default:
							serveError(rep, 405, 'Method not allowed');
					}
					break;
				default:
					if (/^\/(html|css|js|fonts|img)\//.test(req.url)) {
						var fileName = path.normalize('./' + req.url)
						serveFile(rep, fileName, 200, '');
					} else {
						serveError(rep, 403, 'Access denied');
					}
			}
		}
	}
);

var wsServer = new WebSocket.Server({ server: httpServer });

wsServer.on('connection', function connection(conn) {
	
	if(debugLog) console.log('WebSocket connection initialized');
  
	conn.on('message', function(message) {
		
		var rep = { error: 'OK' };
		try {
			
			msg = JSON.parse(message);
			if(debugLog) console.log('Frontend sent by ws: ' + JSON.stringify(msg));
			
			if(msg.session && !conn.session) {
				conn.session = msg.session;
				if(debugLog) console.log('WebSocket session set to ' + conn.session);
			}
			
		} catch(err) {
			rep.error = err;
		}
		conn.send(JSON.stringify(rep));
		if(debugLog) console.log('My answer sent by ws: ' + JSON.stringify(rep));
	
	}).on('error', function(err) {});
});

function broadcast(session, msg) {
	if(debugLog) console.log('Broadcasting: ' + session + ' -> ' + msg);
	wsServer.clients.forEach(function(client) {
		if(client.readyState === WebSocket.OPEN && client.session != session) {
			if(debugLog) console.log("Sending an event message to client " + client.session + " with data " + msg);
			client.send(JSON.stringify({ from: session, message: msg }));
		}
	});
}
httpServer.listen(listeningPort);

if (debugLog) console.log('Listening on port ' + listeningPort);