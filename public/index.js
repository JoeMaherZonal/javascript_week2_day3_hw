var Map = function(latLng, zoom){
  this.googleMap = new google.maps.Map(document.getElementById('map'), {
    center: latLng, 
    zoom: zoom 
  })

  this.addMarker = function(latLng, title){
    var marker = new google.maps.Marker({
      position: latLng,
      map: this.googleMap,
      title: title
    })
    return marker;
  }

  this.bindclick = function(){
    google.maps.event.addListener(this.googleMap, 'click', function(event){
      latLng = {lat: event.latLng.lat(), lng: event.latLng.lng()}
      console.log("MAP CLICKED!", latLng )
      findClickedLocation(latLng)
    }.bind(this) )
  }

  this.addInfoWindow = function(latLng, title){
    var marker = this.addMarker(latLng, title)
    marker.addListener('click', function(){
      var infoWindow = new google.maps.InfoWindow({
        content: this.title,
        maxWidth: 400
      })
      infoWindow.open(this.map, marker);
      state.infoWindows.push(infoWindow)
    })
  }
}

var GeoLocator = function(map, pos){
  this.map = map,
  this.pos = pos,
  this.setNewCenter = function(pos, country){
  infoLabel = createInfoBox(country)
  this.map.googleMap.panTo(pos)
  this.map.addMarker(pos, "1")
  this.map.addInfoWindow(pos, infoLabel)
  }
}

function createInfoBox(country){
  var neighboors = findNeighbours(country)
  string = '<div id="popupinfo"><h3 id="country-info-name">'+ country.name +'</h3>' + '<p>'+'Population: '+ country.population + '</p>'+'<p>'+'Capital: '+country.capital+'</p>'+'<div>'

  if(neighboors.length > 0){
    // console.log(neighboors.length)
    string = string +'<h5>Borders with:</h5>'+'<ul class = "neighboor-info-list">'
    for(var i = 0; i < neighboors.length; i++){
      string = string + '<li id="neighboor-li" onClick=renderCountry(findCountryByName(event.target.innerText));>'+neighboors[i].name+'</li>'
      }
    string = string + '</ul>'
  }

  string = string + '<button type="button" id="save-country" onClick=saveCountry(country);>'+'Save Country'+'</button></div></div>'
  
  return string
}

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
}

var state = {
  countries: [],
  regions: [],
  infoWindows: [],
  clickedCountry: null,
  map: null,
  geoLocator: null
}

window.onload = function(){
  console.log("Window loaded")
  setCountries();
  setUpMap();
  main();
}

function setUpMap(){
  var center = { lat:55.948578, lng:-3.199988 }
  var map = new Map(center, 5)
  var geoLocator = new GeoLocator(map);
  state.map = map;
  state.geoLocator = geoLocator;
}

function main(){
  var selectClick = document.getElementById('country-list')
  selectClick.onchange = displayCountry;

  var searchBoxUpdate = document.getElementById('search-box')
  searchBoxUpdate.onkeyup = dynamicSearch;

  var regionChange = document.getElementById('region-select')
  regionChange.onchange = regionMenuHandle;

  var cleaLocalBtn = document.getElementById('clear-saved-data')
  cleaLocalBtn.onclick = clearLocalStoage;

  var currentLocationBtn = document.getElementById('current-location')
  currentLocationBtn.onclick = moveToCurrentLocation;

  setAtLastSavedCountry();
  state.map.bindclick();
}

function setAtLastSavedCountry(){
  jsonString = localStorage.getItem('selected_countries')
  savedCountries = JSON.parse(jsonString)
  if(savedCountries){
    renderCountry(savedCountries)
  }else{
    navigator.geolocation.getCurrentPosition( function(response){
      var lat = response.coords.latitude;
      var lng = response.coords.longitude;
      moveToCurrentLocation({lat: lat, lng: lng})
    })
  }
}

function dynamicSearch(){
  searchTerm = document.getElementById('search-box').value
  if(searchTerm.length > 2){
    for(country of state.countries){
      // console.log("country:", country.name)
      var re = new RegExp(searchTerm, "i");
      if (country.name.match(re)) {
        renderCountry(country)
      }
    }
  }
}

function setCountries(){
  var url = 'https://restcountries.eu/rest/v1';
  var request = new XMLHttpRequest();
  request.open("GET", url);
  var countries = {}
  request.onload = function(){
    if(request.status === 200) {
      var jsonString = request.responseText;
      state.countries = JSON.parse(jsonString)
      setRegions();
      renderAllCountriesSelect();
      renderRegionsSelect();
      console.log("Data loaded!")
    }
  }
  request.send( null );
}

function renderAllCountriesSelect(id){
  var select = document.getElementById('country-list')
  for(country of state.countries){
    option = document.createElement("option")
    option.innerText = country.name
    option.value = country.name
    select.appendChild(option)
  }
}

function renderRegionsSelect(){
  var select = document.getElementById('region-select')
  select.innerHTML = "";
  for(region of state.regions){
    option = document.createElement("option")
    option.innerText = region.name
    option.value = region.name
    select.appendChild(option)
  }
}

function setRegions(){
  regionInfo = {};
  for(country of state.countries){
    if(!regionInfo[country.region]){
      regionInfo[country.region] = {name: country.region, subregions: []}
      regionInfo[country.region].subregions.push(country.subregion)
    }
  }

  for(country of state.countries){
    regionInfo[country.region].subregions.push(country.subregion)
  }

  for(region in regionInfo){
    distinctRegions = regionInfo[region].subregions.unique();
    regionInfo[region].subregions = distinctRegions;
    state.regions.push(regionInfo[region])
  }
  var index = state.regions.length -1
  state.regions.splice(index, 1)

}

function regionMenuHandle(){
  if(document.getElementById('country-select')){
    var country = findCountryByName(document.getElementById('country-select').value);
    renderCountry(country);
    document.getElementById('country-select').id = 'region-select'
    renderRegionsSelect();
    return
  }
  if(document.getElementById('subRegion-Select')){
    changeToCountries();
  }
  if(document.getElementById('region-select')){
    changeToSubRegions();
  }
}

function findCountryByName(name){
  for(country of state.countries){
    if(country.name === name){
      return country;
    }
  }
}

function changeToCountries(){
  document.getElementById('subRegion-Select').id = "country-select"
  var select = document.getElementById('country-select')
  var selectedSubRegion = document.getElementById('country-select').value;
  select.innerHTML = ""
  for(country of state.countries){
    if(country.subregion === selectedSubRegion){
      option = document.createElement("option")
      option.innerText = country.name
      option.value = country.name
      select.appendChild(option)
    }
  }
}

function changeToSubRegions(){
  document.getElementById('region-select').id = "subRegion-Select"
  var select = document.getElementById('subRegion-Select')
  var selectedRegion = document.getElementById('subRegion-Select').value;

  for(region of state.regions){
    if(region.name === selectedRegion){
      select.innerHTML = "";
      for(subRegion of region.subregions){
        option = document.createElement("option")
        option.innerText = subRegion
        option.value = subRegion
        select.appendChild(option)
      }
    }
  }
}

function displayCountry(){
  var selectClick = document.getElementById('country-list')
  var selectedOption = selectClick.options[selectClick.selectedIndex].value
  var country = findCountry(selectedOption, state.countries)
  renderCountry(country);
}

function renderCountry(country){
  closeAllInfoWindows();
  var lat = country.latlng[0];
  var lng = country.latlng[1];
  var latLng = {lat: country.latlng[0], lng: country.latlng[1]}
  state.geoLocator.setNewCenter(latLng, country)
}

function renderNeighboors(neighboors){
  outerDiv = document.getElementById('display-box');
  div = document.createElement('div')
  p = document.createElement('p')
  p.innerText = "Borders: "
  div.appendChild(p)
  outerDiv.appendChild(div)

  for(neighboor of neighboors){
    div = document.createElement('div')
    p = document.createElement('p')
    p.innerText = neighboor.name
    div.appendChild(p)
    outerDiv.appendChild(div)
  }
}

function findNeighbours(selectedCountry){
  var neighboors = []
    for(neighboor of selectedCountry.borders){
      for(country of state.countries){
        if(country.alpha3Code === neighboor){
          neighboors.push(country);
        }
      }
    }
    return neighboors;
}

function findCountry(name, countries){
  for(country of countries){
    if(name === country.name){
      return country
    }
  }
}

function countriesOfSubRegion(selectedCountry){
  result = []
  for(country of state.countries){
    if(selectedCountry === country.name){
      result.push(country);
    }
  }
  return result;
}

function clearLocalStoage(){
  localStorage.removeItem('selected_countries')
}

function saveCountry(){
  var countryName = document.getElementById('country-info-name').innerText
  var country = findCountryByName(countryName)
  console.log("Country:",country.name)
  localStorage.setItem('selected_countries', JSON.stringify(country))
}

function closeAllInfoWindows(){
  if(state.infoWindows.length > 0){
    for(infowindow of state.infoWindows){
      infowindow.close()
    }
  }
}


function moveToCurrentLocation(){
  //get current location info
  navigator.geolocation.getCurrentPosition( function(response){
    //extract long and lat
    var lat = response.coords.latitude;
    var lng = response.coords.longitude;
    //concatanate corrent url with long and lat 
    url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&sensor=true'
    //start a new request
    var request = new XMLHttpRequest();
    request.open("GET", url);
    request.onload = function(){
      if(request.status === 200) {
        var jsonString = request.responseText;
        var locationObject = JSON.parse(jsonString)

        //create function to filter through address_components to be mroe dynamic...
        var currentCountry = null
        for(compenent of locationObject.results[0].address_components){
          currentCountry = findCountryByName(compenent.long_name)
          if(currentCountry){
            console.log(currentCountry)
            renderCountry(currentCountry);
            break;
          }
        }
      }
    }
    //send request
    request.send( null );
  }.bind(this))
}

function findClickedLocation(latLng){
  //get current location info
  console.log("Finding country...")
  navigator.geolocation.getCurrentPosition( function(response){
    //extract long and lat
    var lat = latLng.lat;
    var lng = latLng.lng;
    //concatanate corrent url with long and lat 
    url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&sensor=true'
    //start a new request
    var request = new XMLHttpRequest();
    request.open("GET", url);
    request.onload = function(){
      if(request.status === 200) {
        var jsonString = request.responseText;
        var locationObject = JSON.parse(jsonString)
        //create function to filter through address_components to be mroe dynamic...
        var country = null
        if(locationObject.status != "ZERO_RESULTS"){
          for(compenent of locationObject.results[0].address_components){
            country = findCountryByName(compenent.long_name)
            if(country){
              console.log("Found country!: ", country.name)
              console.log("latLng", latLng)
              state.geoLocator.setNewCenter(latLng, country)
            }
          }
        }else{
          console.log("You probably selected the ocean... numpty!")
          return
        }
      }
    }
    request.send( null );
  }.bind(this))
}


