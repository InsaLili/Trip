$(document).ready(function() {
var db = new PouchDB('http://localhost:5984/trip');

// db.put({
//         group: 5,
//         location:8,
//         Light: "Lux",
//         PH: "mg/L",
//         Temperature: "°C",
//         Wind: "km/h"
// });

//
//db.allDocs({
//    include_docs: true,
//    attachements: true,
//    startkey: 'note',
//    endkey: 'note\uffff'
//}).then(function(notes){
//    for(var i=0; i < notes.rows.length; i++){
//        db.remove(notes.rows[i].doc);
//    }
//});
//db.allDocs({
//    include_docs: true,
//    attachements: true,
//    startkey: 'vote',
//    endkey: 'vote\uffff'
//}).then(function(notes){
//    for(var i=0; i < notes.rows.length; i++){
//        db.remove(notes.rows[i].doc);
//    }
//});


});