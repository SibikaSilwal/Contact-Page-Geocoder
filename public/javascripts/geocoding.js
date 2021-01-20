const createmap=()=>{
	mymap = L.map('mapid').setView([40.712, 70.0060], 8);
	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1,
		accessToken: 'pk.eyJ1Ijoic2liaWthc2lsd2FsIiwiYSI6ImNraGphanZseTFrNGoyc3BmZmQ4eDQ2dWMifQ.tWpQGfzwxcW_9I-X5vlK5Q'
		}).addTo(mymap);
	var element = document.getElementsByClassName("inforow");
	var i;
	//creating marker as well as popup for all the locations on the table
	for (i = 0; i < element.length; i++) {
		createmarker(element[i].getAttribute("data-lat"), element[i].getAttribute("data-lng"), element[i], i+1);	  
	}
}

const createmarker= (lat, lng, element, index)=>{ //latitue, longitute, table row, index for creating pop content
	mymap.setView([lat, lng], 8);
	var marker = L.marker([lat, lng]).addTo(mymap);
	element.addEventListener("click", ()=>{
				centerOnClick(element.getAttribute("data-lat"), element.getAttribute("data-lng"));
			}) ;
	var mycontent = popupContent(index); //mycontent has the popup contents to be shown
	//adding on click functionality to marker
	marker.on('click', function onMapClick(e) {
					    popup
					        .setLatLng(e.latlng)
					        .setContent(mycontent)
					        .openOn(mymap);
					    });
}

//this is called inside create marker, to add an event listener to table rows
const centerOnClick = (lat, lng)=>{
	mymap.setView([lat, lng], 10);
}

var popup = L.popup(); //this will be passed to the marker while creating marker.on("click") event handler


//creates the popup content for the given index of a row
function popupContent(i) {
	//gets the table element of the /contact page
    var myTab = document.getElementById('infotable');
    //gets each row
    var objCells = myTab.rows.item(i).cells;
        var content="";
        //LOOP THROUGH EACH CELL OF THE CURENT ROW TO READ CELL VALUES until the email address cell because rest is lat long etc.
        for (var j = 0; j < objCells.length-5; j++) {
            content = content + '<br/>' + objCells.item(j).innerHTML;
        }
    return content; //returns the content we need for the popup
       
}

//Create new contact button on /contact page
async function createContact(){
	await axios.get('mailer', {});
	mask(true, true, true);
}
/*
async function deleteContact(objid){
	axios.post('delete', {'id': objid}).then(function(res){
		console.log(res);
	});
}*/

const mask = (c_form, c_table, mmap) => {
    document.getElementById("contactform").style.display = c_form ? "block" : "none";
    document.getElementById("contacttable").style.display = c_table ? "block" : "none";
    document.getElementById("mapid").style.display = mmap ? "block" : "none";
}

//search by name
function searchname() {
  //variables declaration
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("infotable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 1; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[1];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

//add new contact from contact page, 50% ajax, updates the database and table(by ajax) but not the map until full request.
async function addnew(){
  //new contact is the add new contact form id.
  var inputs = document.getElementById("newcontact").elements;
  var entries={};
  var radios = document.getElementsByName('prefix');

  	//for loop to get only the checked value for the Prefix
	for (var k = 0; k < 4; k++) {
	  if (radios[k].checked) {	    
	    entries["prefix"] = radios[k].value;
		break;
	  }
	}
	//for loop to store all the namue:value pairs of form entries to a json object
	for (var i = 4; i < 12; i++) {
	  if (inputs[i].nodeName === "INPUT" ) {
	    entries[inputs[i].name]=inputs[i].value;	    
	  }
	}
	// Find a <table> element with id="infotable":
	var table = document.getElementById("infotable");

	// Create an empty <tr> element and add it to the last position of the table:
	var row = table.insertRow(-1);
	var j,l;
	row.insertCell(0).innerHTML = entries["prefix"]; //row(0) prefix
	row.insertCell(1).innerHTML = entries["first"] + " " + entries["last"]; //concatenate first and last name add to row(1)
	for(j= 2,l=6; j < 8,l<12; j++,l++){
		row.insertCell(j).innerHTML= entries[inputs[l].name]; //rest rows filled here 
	}
	var response = await axios.post('mailer2', {entries}); //mailer2 works just like mailer but its the ajax form
	var data = response.data;
	row.insertCell(8).innerHTML = data.lat; //to add lat and lng to the table
	row.insertCell(8).innerHTML = data.lng;
	await axios.get('contact',{}); //get request to contact to save the new contact to db
	mask(false, true, true);
}

//function to delete contacts 
function deleteRow(rowid)  
{   
	console.log(rowid);
    var row = document.getElementById(rowid);
    var table = row.parentNode;
    while ( table && table.tagName != 'TABLE' )
        table = table.parentNode;
    if ( !table )
        return;
    table.deleteRow(row.rowIndex);
    axios.post('deletecontact',{cid: rowid});
}