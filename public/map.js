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
    this.counter = 1;
    google.maps.event.addListener(this.googleMap, 'click', function(event){
      latLng = {lat: event.latLng.lat(), lng: event.latLng.lng()}
      this.addMarker(latLng, this.counter.toString())
      this.counter++
    }.bind(this) )
  }

  this.addInfoWindow = function(latLng, title){
    var marker = this.addMarker(latLng, title)
    marker.addListener('click', function(){
      var infoWindow = new google.maps.InfoWindow({
        content: this.title
      })
      infoWindow.open(this.map, marker);
    })
  }
}

var GeoLocator = function(map){
  this.map = map,
  this.setNewCenter = function(){
    navigator.geolocation.getCurrentPosition( function(response){
      var pos = {lat: response.coords.latitude, lng: response.coords.longitude}
      this.map.googleMap.panTo(pos)
      this.map.addMarker(pos, "x")
    }.bind(this))
  }
}