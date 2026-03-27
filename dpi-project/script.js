let chart = null;
let map = null;
let marker = null;

// Sidebar / tab navigation
function showSection(section){

document.querySelectorAll(".section").forEach(function(sec){
sec.classList.add("hidden");
});

let selected = document.getElementById(section);
if(selected){
selected.classList.remove("hidden");
}

if(section === "mapSection"){
setTimeout(initMap,300);
}

}


// DPI Calculation
function calculateDPI(){

let infra = parseFloat(document.getElementById("infrastructure").value);
let health = parseFloat(document.getElementById("healthcare").value);
let emergency = parseFloat(document.getElementById("emergency").value);
let awareness = parseFloat(document.getElementById("awareness").value);
let resources = parseFloat(document.getElementById("resources").value);

let city = document.getElementById("cityName").value;

if(!city){
alert("Please enter City Name");
return;
}

if(isNaN(infra) || isNaN(health) || isNaN(emergency) || isNaN(awareness) || isNaN(resources)){
alert("Please enter all preparedness values");
return;
}

let scenario = document.getElementById("scenario").value;


// Scenario based weights
let weights = {

Flood: [0.30,0.15,0.20,0.15,0.20],
Earthquake: [0.35,0.15,0.20,0.10,0.20],
Cyclone: [0.25,0.15,0.25,0.15,0.20]

};

let w = weights[scenario];

// DPI formula
let dpi =
(infra * w[0]) +
(health * w[1]) +
(emergency * w[2]) +
(awareness * w[3]) +
(resources * w[4]);

dpi = Math.round(dpi);


// Display Result
document.getElementById("dpiScore").innerText = "DPI Score: " + dpi;

let category = "";

if(dpi >= 80) category = "Highly Prepared";
else if(dpi >= 60) category = "Moderate Preparedness";
else if(dpi >= 40) category = "Low Preparedness";
else category = "Critical Risk";

document.getElementById("dpiCategory").innerText = "Category: " + category;


// Create graph
createChart(infra,health,emergency,awareness,resources);


// Add map marker
addMapMarker(city,dpi);


// Move to result section
showSection("result");

}


// Radar Chart
function createChart(i,h,e,a,r){

let ctx = document.getElementById("radarChart");

if(!ctx) return;

if(chart){
chart.destroy();
}

chart = new Chart(ctx,{
type:"radar",

data:{
labels:[
"Infrastructure",
"Healthcare",
"Emergency Response",
"Public Awareness",
"Resources"
],

datasets:[{
label:"Preparedness Indicators",

data:[i,h,e,a,r],

backgroundColor:"rgba(54,162,235,0.2)",
borderColor:"rgb(54,162,235)",
borderWidth:2

}]
},

options:{
responsive:true,
scales:{
r:{
beginAtZero:true,
max:100
}
}
}

});

}


// Initialize Map
function initMap(){

if(map) return;

map = L.map("map").setView([7.8731,80.7718],7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
maxZoom:18
}).addTo(map);

}


// Add marker to map
function addMapMarker(city,dpi){

if(!map){
initMap();
}

if(marker){
map.removeLayer(marker);
}

marker = L.marker([7.8731,80.7718]).addTo(map);

marker.bindPopup(
"<b>" + city + "</b><br>DPI Score: " + dpi
).openPopup();

}