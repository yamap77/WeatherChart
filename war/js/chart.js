/*In this file. I defined a forecast function. When the page load, it will initial a chart. After the user choose a FAWN station, it will fetch temperature data and store them in fawn and nws.
 * Then, add series in to the chart and show it in the page. In the meanwhile, the page will also display a table compare the forecast temperature and station temperature.*/


function forecast(){
	var fawn=[];
	var nws=[];
	var signal=0;
	var chart1;
	var forecastDate;
	var effDate;
	var count=0;
	var critical;
	var formatIEDate=function(dateStr){
        var a=dateStr.split(" ");
        var d=a[0].split("-");
        var t=a[1].split(":");
        var date = new Date(d[0],(d[1]-1),d[2],t[0],t[1],t[2]);
        return date;
	}
	//Private member function. After user choose one station, update the chart1 with fawn and nws.
var displayChart=function(){
		newTitle="Forecast Date:"+forecastDate+", "+"Eff Date:"+effDate;
		chart1.setTitle({text: newTitle});
		var stnSeries =[{
			id:2,
		    name: 'FAWN Observation',
		    data: fawn
		 },
		 {
			 id:3,
			 name: 'NWS Forecast',
		    data: nws}];
		var length=chart1.series.length;
		var ct=[];;
		var cpoint1=[];
		var cpoint2=[];
		cpoint1[0]=nws[0][0];;
		cpoint1[1]=parseInt(critical);
		cpoint2[0]=nws[nws.length-1][0];
		cpoint2[1]=parseInt(critical);
		ct[0]=cpoint1;
		ct[1]=cpoint2;
		var series={
				id: 1,
				name:'Critical Temperature',
				data: ct};
		if(count==0){
		  for(var i=0;i<stnSeries.length;i++){
		    chart1.addSeries(stnSeries[i]);
		    count++;
		    }
		  if(!critical==0){
		  chart1.addSeries(series);
		  }
		}
		else{
			chart1.get(2).update({
				data:fawn
				});
			
			chart1.get(3).update({
				data:nws
				});
			
		}
	}
//private member function, display and compare the forecast temperature and station temperature 
var fillTable=function(){
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
// initial a chart when page loading	
this.intialChart=function()
{
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
 })
}	
// request fawn data to the certain station the user choose
this.fetchfawnData=function(){
	var fawnurl='http://test.fawn.ifas.ufl.edu/controller.php/fawnByStn/json/'+$("#county").val();
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
			var tempfawn=[];
			temp[0]=(new Date(stnData[i].local_time)).getTime();
			temp[1]=parseInt(stnData[i].obz_temp);
			fawn[i]=temp;			
			}
			signal=signal+1;
			if(signal==2){
			fillTable();
            displayChart();
            signal=0;	
			}
			}); 
			}
   
}

//request nws data
this.fetchforecastData=function(){
	var nwsurl='http://test.fawn.ifas.ufl.edu/controller.php/forecastByStn/json/'+$("#county").val();
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
			 a=fore.split(" ");
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
			var tempnws=[];
			temp[0]=(new Date(stnData[i].local_eff_time)).getTime();
			temp[1]=parseInt(stnData[i].fcst_temp);
			nws[i]=temp;
			}
			}
			//alert(typeof(signal));
			signal=signal+1;
			if(signal==2){
			fillTable();
            displayChart();	
            signal=0;	
			}
			}); 
			} 
		
}
//After the user choose a critical data, add it to the chart
this.displayCritical=function(){
	critical=$("#critical").val();
	if(nws.length!=0){
	var ct=[];;
	var cpoint1=[];
	var cpoint2=[];
	cpoint1[0]=nws[0][0];;
	cpoint1[1]=parseInt(critical);
	cpoint2[0]=nws[nws.length-1][0];
	cpoint2[1]=parseInt(critical);
	ct[0]=cpoint1;
	ct[1]=cpoint2;
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
}
//after the user click a certain entry in the table, target the point in the chart.
this.choose=function(){
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
}
}
