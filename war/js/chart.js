function forecast(){
	this.fawn=[];
	this.nws=[];
	//this.chart1=null;
	//this.orecastDate=null;
	//this.effDate=null;
}
forecast.prototype.getFawnStation=function(){
	$.getJSON('http://test.fawn.ifas.ufl.edu/controller.php/stationsJson/',
			function(data) { 
			var stnObj=data;
			  var keys = [];
			  var i=0;
    keys=Object.keys(stnObj); // ['key1', 'key2', 'key3', 'key4']
    var station=[];
    for(var i=0;i<keys.length;i++){
    var temp=[];
    var key1=keys[i];
    temp[0]=stnObj[key1].display_name;
    temp[1]=key1;
    station[i]=temp;}
    station.sort(function(a, b) { return (a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0)); });
   var stations ="";
   stations += "<option value="+""+">Select Station</option>";
   for(var i=0;i<station.length;i++){
    stations += "<option value="+station[i][1]+">"+station[i][0]+"</option>";
    }
    document.getElementById('county').innerHTML = stations;
			}); 	
}

