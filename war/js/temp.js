function forecastTracker(){
	var graphchart;
	var xStart;
	var xEnd;
	this.graphobj=new graphicChart();
	this.data=new dataControl();
	this.table=new compareTable();
}
function dataControl(){
	  var fawn = [];
	  var nws = [];
	  var chart=new graphicChart();
	  var table=new compareTable();
	  var signal=0;
	  var formatIEDate = function (dateStr) {
	    	//alert(dateStr);
	        var Date = dateStr.split(" ");
	        var d = a[0].split("-");
	        var t = a[1].split(":");
	        var date = new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]);
	        return date;
	    }
	// request fawn data to the certain station the user choose
	  this.fetchTempData=function(dataType,url){
	      if ($.browser.msie && window.XDomainRequest) {
	            // Use Microsoft XDR
	            var xdr = new XDomainRequest();
	            xdr.open("get", url);
	            xdr.onload = function () {
	                var JSON = $.parseJSON(xdr.responseText);
	                if (JSON == null || typeof (JSON) == 'undefined') {
	                    JSON = $.parseJSON(data.firstChild.textContent);
	                }
	                var stnData = JSON;
	                if(dataType=="fawn"){
	                for (var i = 0; i < stnData.length; i++) {
	                    var tempPoint = [];
	                    var dateStr = stnData[i].local_time; //"2013-07-18 10:00:00 EDT"
	                    var date = formatIEDate(dateStr);
	                    tempPoint[0] = date.getTime();
	                    tempPoint[1] = parseInt(stnData[i].obz_temp);
	                    fawn[i] = tempPoint;
	                }
	                }
	                else{
	                	   forecastDate = stnData[0].local_fcst_time;
	                       effDate = stnData[0].local_eff_time;
	                       var forecast = stnData[0].local_fcst_time;
	                       var effforecast=formatIEDate(forecast);
	                       for (var i = 0; i < stnData.length; i++) {
	                           var fore = stnData[i].local_fcst_time;
	                           var effcttime=formatIEDate(fore);
	                           if (effforecast.getTime() == effcttime.getTime()) {
	                               var temp = [];
	                               var dateStr = stnData[i].local_eff_time; //"2013-07-18 10:00:00 EDT"
	                               var date=formatIEDate(dateStr);
	                               temp[0] = date.getTime();
	                               temp[1] = parseInt(stnData[i].fcst_temp);
	                               nws[i] = temp;
	                               xStart=nws[0][0];
	                               xEnd=nws[nws.length-1][0];
	                           }
	                       }
	                }
	                signal++;
	                if (signal == 2) {
	                	 table.fillTable(fawn,nws);
	                     chart.displayChart(fawn,nws);
	                    signal = 0;
	                }
	            
	            };
	            xdr.onprogress = function () {
	            };
	            xdr.ontimeout = function () {
	            };
	            xdr.onerror = function () {
	            };
	            setTimeout(function () {
	                xdr.send();
	            }, 0);

	        }
	      else{
	    	     $.getJSON(url,
	    	                function (data) {
	    	                    var stnData = data;
	    	                    if(dataType=="fawn"){
	    	                    for (var i = 0; i < stnData.length; i++) {
	    	                        var tempPoint = [];
	    	                        tempPoint[0] = (new Date(stnData[i].local_time)).getTime();
	    	                        tempPoint[1] = parseInt(stnData[i].obz_temp);
	    	                        fawn[i] = tempPoint;
	    	                    }}
	    	                    else{
	    	                        forecastDate = stnData[0].local_fcst_time;
	    	                        effDate = stnData[0].local_eff_time;
	    	                        var effforecast = new Date(stnData[0].local_fcst_time).getTime();
	    	                        for (var i = 0; i < stnData.length; i++) {
	    	                            if (effforecast == (new Date(stnData[i].local_fcst_time).getTime())) {
	    	                                var temp = [];
	    	                                var tempnws = [];
	    	                                temp[0] = (new Date(stnData[i].local_eff_time)).getTime();
	    	                                temp[1] = parseInt(stnData[i].fcst_temp);
	    	                                nws[i] = temp;
	    	                            }
	    	                        }
	    	                        xStart=nws[0][0];
	    	                        xEnd=nws[nws.length-1][0]; 	
	    	                    }
	    	                    signal = signal + 1;
	    	                    if (signal == 2) {
	    	                        table.fillTable(fawn,nws);
	    	                        chart.displayChart(fawn,nws);
	    	                        signal = 0;
	    	                    }
	    	                });	    	  
	      }	  
	  }
}
function graphicChart(){
	var count=0;
	var criticalTemp;
	this.intialChart = function () {
        $(document).ready(function () {
            graphchart = new Highcharts.Chart({
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
                    tickInterval: 4 * 3600 * 1000, // one week
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
	this.updateChart=function (data,id){
		  graphchart.get(id).update({
              data: fawn
          });
	}
	this.displayChart = function (fawn,nws) {
        newTitle = "Forecast Date:" + forecastDate + ", " + "Eff Date:" + effDate;
        graphchart.setTitle({text: newTitle});
        var stnSeries = [
            {
                id: 2,
                name: 'FAWN Observation',
                data: fawn
            },
            {
                id: 3,
                name: 'NWS Forecast',
                data: nws}
        ];
        var length = graphchart.series.length;
        var ct = [];
        var cpoint1 = [];
        var cpoint2 = [];
        cpoint1[0] = xStart;
        cpoint1[1] = parseInt(criticalTemp);
        cpoint2[0] = xEnd;
        cpoint2[1] = parseInt(critical);
        ct[0] = cpoint1;
        ct[1] = cpoint2;
        var series = {
            id: 1,
            name: 'Critical Temperature',
            data: ct};
        if (count == 0) {
            for (var i = 0; i < stnSeries.length; i++) {
                graphchart.addSeries(stnSeries[i]);
                count++;
            }
            if (!criticalTemp == 0) {
                graphchart.addSeries(series);
            }
        }
        else {
            graphchart.get(2).update({
                data: fawn
            });

            graphchart.get(3).update({
                data: nws
            });

        }
    }
	this.displayCritical = function () {
        criticalTemp = $("#critical").val();
        if ($("#county").val()!="") {
            var ct = [];
            var cpoint1 = [];
            var cpoint2 = [];
            cpoint1[0] = xStart;          
            cpoint1[1] = parseInt(criticalTemp);
            cpoint2[0] = xEnd;
            cpoint2[1] = parseInt(criticalTemp);
            ct[0] = cpoint1;
            ct[1] = cpoint2;
            var flag = graphchart.get(1);
            var series = {
                id: 1,
                name: 'Critical Temperature',
                data: ct};
            if (flag != null) {
                graphchart.get(1).update({
                    data: ct
                });
            }
            else {
                graphchart.addSeries(series);
            }
        }
	}  
}
function compareTable(){
	//private member function, display and compare the forecast temperature and station temperature
	this.findSameTimePoint=function(fawn,nws){	
	}
    this.fillTable = function (fawn,nws) {
        var row = "";
        var length = nws.length;
        var table = document.getElementById("forecast");
        var count = 0;
        var flag = 0;
        var rownum = 1;
        for (var i = 0; i < length; i++) {
            if (nws[i][0] > fawn[fawn.length - 1][0])
                break;
            for (var j = count; j < fawn.length; j++) {
                if (fawn[j][0] == nws[i][0]) {
                    count = j;
                    flag = 1;
                    break;
                }
            }
            if (flag == 1) {
                flag = 0;
                var row = table.insertRow(rownum);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                var cell5 = row.insertCell(4);
                var date = new Date(fawn[count][0]).toString();
                var time = date.split(" ");
                var timestr = time[1] + " " + time[2] + " " + time[3] + " " + time[4];
                cell1.innerHTML = timestr;
                cell2.innerHTML = fawn[count][1];
                cell3.innerHTML = nws[i][1];
                cell4.innerHTML = fawn[count][1] - nws[i][1];
                cell5.innerHTML = count + " " + i;
                cell5.style.display = "none";
                rownum++;
            }
        }
        var div = document.getElementById("forecastdiv");
        div.style.display = "";
    }
	
}
