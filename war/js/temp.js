
var fawn=[];
var nws=[];
var chart1;
var forecastDate;
var effDate;
function getFawnStation(){
	$.getJSON('http://test.fawn.ifas.ufl.edu/controller.php/stationsJson/',
			function(data) { 
			var stnObj=data;
			  var keys = [];
			  var i=0;
			  /*
    for(var key in stnObj)
    {
        if(stnObj.hasOwnProperty(key))
        {
        alert(key);
            keys.push(key);
 
        }
    }*/
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
getFawnStation();
function choose(){
            $("#forecast tr").click(function() {
                $.each($("#forecast tr"), function(i, n) {
                    $(n).removeClass("selected");
                });
                $(this).addClass("selected");
                 var index = $("#forecast tr").index($(this));
                var table=document.getElementById("forecast");
                var col=table.rows[index].cells[4].innerHTML;
                var dataIndex=col.split(" ");  
                if(index>=1){
               chart1.tooltip.refresh([chart1.series[0].data[parseInt(dataIndex[0])],chart1.series[1].data[parseInt(dataIndex[1])]]);
         
               }       
            });
        };

var options = "";
options += "<option value="+0+">Critical Temperature</option>"
for(var i = 100; i>=0; i-- ) {
    options += "<option value="+i+">"+i+"</option>";
}
document.getElementById('critical').innerHTML = options;
$(document).ready(function() {
       chart1 = new Highcharts.Chart({
       chart: {
         renderTo: 'container',
         defaultSeriesType: 'line'
      },
      title: {
         text: 'Please Select a FAWN Station to see the temperature chart'
      },
        tooltip: {
            shared: true
        },
      xAxis: {
        
             labels: {
        formatter: function() {
            return this.value + ' p';
        }
    },
      },

      yAxis: {
         title: {
            text: 'F'
         }
      }
      });
})
var signal=0;
function getData(){
var fawnurl='http://test.fawn.ifas.ufl.edu/controller.php/fawnByStn/json/'+$("#county").val();
var nwsurl='http://test.fawn.ifas.ufl.edu/controller.php/forecastByStn/json/'+$("#county").val();
fetchfawnData(fawnurl);
fechforecastData(nwsurl);

}
//"2013-07-18 10:00:00 EDT"
function formatIEDate(dateStr){
            var a=dateStr.split(" ");
            var d=a[0].split("-");
            var t=a[1].split(":");
            var date = new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);
            return date;
}
//get fawn temperature
function fetchfawnData(fawnurl){
    if ($.browser.msie && window.XDomainRequest) {
        // Use Microsoft XDR
        var xdr = new XDomainRequest();
        xdr.open("get",fawnurl);
        xdr.onload = function () {
            var JSON = $.parseJSON(xdr.responseText);
            if (JSON == null || typeof (JSON) == 'undefined') {
                JSON = $.parseJSON(data.firstChild.textContent);
            }           
            var stnData=JSON;
			for(var i=0;i<stnData.length;i++){
			var temp=[];
			var dateStr=stnData[i].local_time; //"2013-07-18 10:00:00 EDT"
			/*
            var a=dateStr.split(" ");
            var d=a[0].split("-");
            var t=a[1].split(":");
            var date = new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);*/
            var date=formatIEDate(dateStr);
			temp[0]=date.getTime();
			temp[1]=parseInt(stnData[i].obz_temp);
			fawn[i]=temp;
			}
			signal++;
			if(signal==2){
			fillTable();
            displayChart();	
            signal=0;	
			}
        };
        xdr.onprogress=function(){ };
        xdr.ontimeout=function(){ };
        xdr.onerror=function(){ };
        setTimeout(function(){
        xdr.send();
        },0);

    }
else{
	$.getJSON(fawnurl,
			function(data) { 
			var stnData=data;
			for(var i=0;i<stnData.length;i++){
			var temp=[];
			temp[0]=(new Date(stnData[i].local_time)).getTime();
			temp[1]=parseInt(stnData[i].obz_temp);
			fawn[i]=temp;
			}
			signal++;
			if(signal==2){
			fillTable();
            displayChart();	
            signal=0;	
			}
			}); 
			}
 
}
function fechforecastData(nwsurl){
    if ($.browser.msie && window.XDomainRequest) {
        // Use Microsoft XDR
        var xdr = new XDomainRequest();
        xdr.open("get",nwsurl);
        xdr.onload = function () {
            var JSON = $.parseJSON(xdr.responseText);
            if (JSON == null || typeof (JSON) == 'undefined') {
                JSON = $.parseJSON(data.firstChild.textContent);
            }           
            var stnData=JSON;
            forecastDate=stnData[0].local_fcst_time;
            effDate=stnData[0].local_eff_time;
            //alert(effDate);
            var forecast=stnData[0].local_fcst_time;
			var a=forecast.split(" ");
			var d=a[0].split("-");
            var t=a[1].split(":");
            var effforecast=new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);
			for(var i=0;i<stnData.length;i++){
			var fore=stnData[i].local_fcst_time;
			 a=forecast.split(" ");
			 d=a[0].split("-");
             t=a[1].split(":");	
            var effcttime=new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);
			if(effforecast.getTime()==effcttime.getTime()){	
			var temp=[];
			var dateStr=stnData[i].local_eff_time; //"2013-07-18 10:00:00 EDT"
            var a=dateStr.split(" ");
            var d=a[0].split("-");
            var t=a[1].split(":");
            var date = new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);
			temp[0]=date.getTime();
			temp[1]=parseInt(stnData[i].fcst_temp);
			nws[i]=temp;
			}
			}
			signal++;
			if(signal==2){
			fillTable();
            displayChart();	
            signal=0;	
			}
        };
        xdr.onprogress=function(){ };
        xdr.ontimeout=function(){ };
        xdr.onerror=function(){ };
        setTimeout(function(){
        xdr.send();
        },0);

    }
else{
	$.getJSON(nwsurl,
			function(data) { 
			var stnData=data;
			forecastDate=stnData[0].local_fcst_time;
			effDate=stnData[0].local_eff_time;
			var effforecast=new Date(stnData[0].local_fcst_time).getTime();
			for(var i=0;i<stnData.length;i++){
			if(effforecast==(new Date(stnData[i].local_fcst_time).getTime())){	
			var temp=[];
			temp[0]=(new Date(stnData[i].local_eff_time)).getTime();
			temp[1]=parseInt(stnData[i].fcst_temp);
			nws[i]=temp;
			}
			}
			signal++;
			if(signal==2){
			fillTable();
            displayChart();	
            signal=0;	
			}
			}); 
			} 
		
}
function fillTable(){
var row="";
var length=nws.length;
var table=document.getElementById("forecast");
var count=0;
var flag=0;
var rownum=1;
for(var i=0;i<length;i++){
if(nws[i][0]>fawn[fawn.length-1][0])
break;
for(var j=count;j<fawn.length;j++){
if(fawn[j][0]==nws[i][0]){
count=j;
flag=1;
break;
}}
if(flag==1){
flag=0;
var row=table.insertRow(rownum);
var cell1=row.insertCell(0);
var cell2=row.insertCell(1);
var cell3=row.insertCell(2);
var cell4=row.insertCell(3);
var cell5=row.insertCell(4);
var date=new Date(fawn[count][0]).toString();
var time=date.split(" ");
var timestr=time[1]+" "+time[2]+" "+time[3]+" "+time[4];
//alert(time[0]);
cell1.innerHTML=timestr;
cell2.innerHTML=fawn[count][1];
cell3.innerHTML=nws[i][1];; 
cell4.innerHTML=fawn[count][1]-nws[i][1];
cell5.innerHTML=count+" "+i;
cell5.style.display="none";
rownum++;
}
}
  var div=document.getElementById("forecastdiv"); 
  div.style.display="";  
}

function displayChart(){
         Highcharts.setOptions({                                          
                global : {
                    useUTC : false
                }
            });
       chart1 = new Highcharts.Chart({
       chart: {
         renderTo: 'container',
         defaultSeriesType: 'line'
      },
      title: {
         text: 'Forecast Date:'+forecastDate+', '+'Eff Date:'+effDate
      },
       tooltip: {
            shared: true,
            crosshairs: true
        },
         xAxis: {
         type: 'datetime',
         tickInterval: 4*3600 * 1000, // one week
                //categories: timeCategories,
                title: {
                    text: null
                },
                startOnTick: false
            },

      yAxis: {
         title: {
            text: 'F'
         }
      }
      });
var series =[{
         name: 'FAWN Observation',
         data: fawn
      },
      {name: 'NWS Forecast',
         data: nws}];
       for(var i=0;i<series.length;i++){
         chart1.addSeries(series[i]);
         }      
}
function displayCritical(){
var critical=$("#critical").val();
var ct=[];;
if(nws.length==0){
for(var i=0;i<5;i++){
ct[i]=parseInt(critical);
}
}
else{
var cpoint1=[];
var cpoint2=[];
cpoint1[0]=nws[0][0];;
cpoint1[1]=parseInt(critical);
cpoint2[0]=nws[nws.length-1][0];
cpoint2[1]=parseInt(critical);
ct[0]=cpoint1;
ct[1]=cpoint2;
}

var flag=chart1.get(1);
var series={
id: 1,
name:'Critical Temperature',
data: ct};
if(flag!=null){
chart1.get(1).update({
data:ct
});
}
else{
chart1.addSeries(series);
}
}
