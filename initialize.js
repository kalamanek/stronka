var debugLog = false;

var dbName = 'communicationSystem';

if (debugLog) console.log('Initialization of \'' + dbName + '\'');

var mongojs = require('mongojs');
var db = mongojs(dbName);

var persons = db.collection('persons');
var groups = db.collection('groups');

if (debugLog) console.log('Delete collections');

persons.drop();
groups.drop();

personsExample = [
    {firstName: 'Piotr', lastName: 'Kluska', email: 'q', password: '5cf55c6ec29363115f8c29ba4888bb7f902ec8d0492273cc0828e2631bf9bf4c3c7032ffcecd4ec281ac22595c375e7ee43c6ca5f9f6df6109a6f49ba4f5d785', groups: [] , role: 'Admin',salt:"q"},
    {firstName: 'Bartek', lastName: 'Kluska', email: 'a', password: 'fc8c80e6b943cd07eccecf01bc6038bae68ebb6fa2e1e62b44753d7c177af7a46b089df349a19f7622a22312c76906ca9c984e1446d3ab86a98fdfa1425341c5', groups: [] , salt:"a"}
];

groupsExample = [
    {name: 'Informatyka', info: 'Grupa o informatyce'},
    {name: 'Muzyka', info: 'Grupa o muzyce'},
    {name: 'Gry', info: 'Grupa o grach'},
    {name: 'Boks', info: 'Grupa o boksie'},
    {name: 'Anonimowi Alkoholicy', info: 'Grupa o ...'},
];


if (debugLog) console.log('Creating new collections');

for (var i in personsExample) {
    if (debugLog) {
        console.log(JSON.stringify(personsExample[i]));
    }
    persons.insert(personsExample[i]);
}

for (var i in groupsExample) {
    if (debugLog) {
        console.log(JSON.stringify(groupsExample[i]));
    }
    groups.insert(groupsExample[i]);
}
