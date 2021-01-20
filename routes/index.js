var express = require('express');
var router = express.Router();
var geo = require('mapbox-geocoding');
const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require("MongoDB").ObjectID;
const url = 'mongodb://localhost:27017/webappproject';
let contact = null;
let location = null;
const startup = async()=>{
    try {
          const connection = await MongoClient.connect(url);
          const db = connection.db('webproject');
          contact = await db.collection("contact");
          console.log("this is startup");
    } catch (e) {
        console.error(e);
    } 
}

startup();



var ACCESS_TOKEN = 'pk.eyJ1Ijoic2liaWthc2lsd2FsIiwiYSI6ImNraGphanZseTFrNGoyc3BmZmQ4eDQ2dWMifQ.tWpQGfzwxcW_9I-X5vlK5Q'; 
//Geocoding using a module called "request", makes a request from the server to the url and gets lat lng
//this function is called upon request to /mailer, req objject is being passed to the function
const forwardGeocoding =  (req, address)=> { 
	data = req.body;
	var url =  'https://api.mapbox.com/geocoding/v5/mapbox.places/'
			+ encodeURIComponent(address) + '.json?access_token='
			+ ACCESS_TOKEN + '&limit=1'; 
	console.log("url: ", url)
	request({ url: url, json: true },async function (error, response) { 
		if (error) { 
			callback('Unable to connect to Geocode API', undefined); 
		} else if (response.body.features.length == 0) { 
			callback('Unable to find location. Try to '
					+ 'search another location.'); 
		} else { 
			console.log("awaiting??");
			longitude = response.body.features[0].center[0]; 
			latitude = response.body.features[0].center[1] ;
			data.lat = latitude;
			data.lng = longitude;
			console.log("data: ",data);
			await addContactToDb(req, data); // after generating the lat lng, all the information is added to db
			
		} 
	})
} 

//this function is called upon request to update an already existing contact info
const forwardGeocoding_update =  (req, address, res)=> { 
	var updates = req.body;
	var url =  'https://api.mapbox.com/geocoding/v5/mapbox.places/'
			+ encodeURIComponent(address) + '.json?access_token='
			+ ACCESS_TOKEN + '&limit=1'; 
	console.log("url: ", url)
	request({ url: url, json: true },async function (error, response) { 
		if (error) { 
			callback('Unable to connect to Geocode API', undefined); 
		} else if (response.body.features.length == 0) { 
			callback('Unable to find location. Try to '
					+ 'search another location.'); 
		} else { 
			console.log("awaiting??");
			longitude = response.body.features[0].center[0]; 
			latitude = response.body.features[0].center[1] ;
			//var location = response.body.features[0].place_name 
			
			updates.lat = latitude;
			updates.lng = longitude;
			console.log("data: ",updates);
			var newvalues = { $set: updates };
			await contact.updateOne({ _id: ObjectID(updates.myid) }, newvalues, function(err, res) {
								    if (err) throw err;
								    console.log(res.result.nModified + " document(s) updated");
								    //db.close();
  									});
			const result1 = await contact.find().toArray();
			res.render('contact', {'contacts':result1});
			return result1;
		} 
	})
}

//this function is called to add new contact from the /contact page
const forwardGeocodingnew =  (data, address, res)=> { 
	//data = req.body;
	var url =  'https://api.mapbox.com/geocoding/v5/mapbox.places/'
			+ encodeURIComponent(address) + '.json?access_token='
			+ ACCESS_TOKEN + '&limit=1'; 
	console.log("url: ", url)
	request({ url: url, json: true },async function (error, response) { 
		if (error) { 
			callback('Unable to connect to Geocode API', undefined); 
		} else if (response.body.features.length == 0) { 
			callback('Unable to find location. Try to '
					+ 'search another location.'); 
		} else { 
			console.log("awaiting??");
			longitude = response.body.features[0].center[0]; 
			latitude = response.body.features[0].center[1] ;
			//var location = response.body.features[0].place_name 
			data.lat = latitude;
			data.lng = longitude;
			console.log("data: ",data);
			var latlng={'lat':latitude, 'lng':longitude};
			await addContactToDb(data, data);
			res.end(JSON.stringify({lat:latitude, lng:longitude}));
			
		} 
	})
} 

//authentication functionality
var ensureLoggedIn = function(req, res, next) {
	if ( req.user ) {
		next();
	}
	else {
		res.redirect("/login");
	}
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Final Project' });
});
//get mailer page
router.get('/mailer', function(req, res, next) {
  res.render('mailer', { title: 'Final Project' });
});

/* POST request to mailer page*/
router.post('/mailer', async(req, res, next)=> {
	post_data = req.body;
	location = post_data.street + " " + post_data.city + " " + post_data.zip;
	console.log(post_data);
	console.log(location, "location is:")
	let val = await forwardGeocoding(req, location);
	res.render('thankyou', {"data": post_data});
});
//post to mailer2 to make the crud application single page
router.post('/mailer2', async(req, res, next)=> {
	post_data = req.body.entries;
	location = post_data.street + " " + post_data.city + " " + post_data.zip;
	console.log(post_data);
	console.log(location, "location is:")
	let val = await forwardGeocodingnew(post_data, location, res);
});

/*Get request to Contact table page*/
router.get('/contact',ensureLoggedIn, async(req,res)=>{
	const result1 = await contact.find().toArray();
	console.log("result", result1);
	res.render('contact', {'contacts':result1});
})

/*Post request to contact page on contact updates*/
router.post('/contact',ensureLoggedIn, async(req,res)=>{
	var post1_data=req.body;
	var location1 = post1_data.street + " " + post1_data.city + " " + post1_data.zip;
	result = await forwardGeocoding_update(req, location1, res );
})

//post request to updatecontact is made when a user clicks on the "update" button
router.post('/updatecontact',ensureLoggedIn, async(req, res)=>{
	var id = req.body.cid;
	//console.log("id: ",id);
	var contactid = { "_id": ObjectID(id) };
        await contact.findOne(contactid, function(err, obj) {
          if (err) throw err;
          //obj.myid = id;
          console.log("obj; ",obj);
          res.render('updatecontact',{"object": obj});
        });
	//res.render('updatecontact',{});
} )

//delete contact, delete button, ajax request is sent for delete
router.post('/deletecontact',ensureLoggedIn, async(req, res)=>{
	delid = req.body.cid;
	console.log(delid);
	await contact.deleteOne({ "_id": ObjectID(delid) }, function(err, obj) {
			    if (err) throw err;
			    console.log("1 document deleted");
			   // db.close();
			  });
	//res.redirect("/contact");
	res.end("Contact deleted: ", delid);
})

/* an asysnc function to add contact info to database*/
const addContactToDb = async(req, info)=>{
	result = await contact.insertOne(info);
}
module.exports = router;
