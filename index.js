var express = require('express');
var mongo = require('mongodb').MongoClient;
var Bing = require('node-bing-api')({ accKey: process.env.BING_KEY });
var app = express();
var dbUrl = process.env.MONGODB_URI ;

app.set('port', (process.env.PORT || 8000));

app.use(express.static(__dirname + '/public'));



app.get('/latest', function (req, res) {
  mongo.connect(dbUrl, function(err, db) {
    if (err) throw err;
    var collection = db.collection('searches');
    collection.find({

    }, {
        _id: 0
      }
    ).sort({
      _id : -1
    }).limit(10).toArray(function(err, data) {
      if (err) throw err;
      if (data.length) {
        res.send(data);
      }
      else res.json({error: 'Database empty'});

      db.close();
    });
  });

});

app.get('/search/:id', function (req, res) {
  var date = new Date();
  mongo.connect(dbUrl, function(err, db) {
    if (err) throw err;
    var collection = db.collection('searches');
    collection.insert({
      term: req.params.id,
      when: date.toISOString()
    }, function(err, data) {
      if (err) throw err;
      db.close();
    });
  });

  Bing.images(req.params.id, {
    top: 10,  // Number of results (max 50)
    skip: req.query.offset?+req.query.offset:0,   // Skip first 3 results

  }, function(err, res2, body){
    if (err) throw err;

    var newBody = [];
    body.d.results.forEach(function(val) {
      newBody.push({
        url: val.MediaUrl,
        snippet: val.Title,
        thumbnail: val.Thumbnail.MediaUrl,
        context: val.SourceUrl
      });
    });
    console.log(body.d.results[0]);

    res.send(newBody);

  });



});



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
