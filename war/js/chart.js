/* Author: Tiejia Zhao Email:tiejiazhao@gmail.com
 * There are  three main functions in this file. forecastTracker is the main controller. In datacontrol, 
 * formatDate formats the date suitable for different browser. ParseData parses the JSON into array
 * for chart. fetchTempData requests the data from sever. In graphicChart, initcalChart creates a chart 
 * for late use. There are also addSeries and updateSeries to update the series data when user chooses a
 * station. setCritical and displayCritical are for drawing the critical temperature. In compareTable, 
 * findComparePoint calculates the point fo nws and fawn have the save x value. InserTable inserts these
 * point into a compare table. targetPoint refresh the tooltip after the user clicks a certain row in the
 * table 
 */

function forecastTracker() {
	var graphchart;
	var xStart;
	var xEnd;
	var forecastDate;
	var effDate;
	this.graphobj = new graphicChart();
	this.data = new dataControl();
	this.table = new compareTable();
}
function dataControl() {
	//chart series data fawn and nws, format:[[1375902000000,81],[1375905600000,83]....]
	var fawn = [];
	var nws = [];
	var chart = new graphicChart();
	var table = new compareTable();
	//series data
	var seriesData;
	//series id
	var id;
	/*
	 * In IE, the data format should be normalize because IE is very restricted about the format.
	 *
	 */
	var formatDate = function(dateStr, browerType) {
		if (browerType == "IE") {
			//2013-08-07 14:00:00 EDT
			var dateString = dateStr.split(" ");//[2013-08-07,14:00:00,EDT]
			var d = dateString[0].split("-");//[2013,08,07]
			var t = dateString[1].split(":");//[14,0,0]
			var dateStr = new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]).toString();
			var dateTime=dateStr.split(" ");
			var dateTemp=dateTime[0]+" "+dateTime[1]+" "+dateTime[2]+" "+dateTime[5]+" "+dateTime[3]+" "+dateString[2];// Wed Aug 7 2013 17:00:00 EDT
			var date=new Date(dateTemp);
			//alert(date);
		} else {
			var date = new Date(dateStr);
		}
		return date;
	}
	// parse Json into temperature series array
	var parseData = function(browserTyper, dataType, stnData) {
		if (dataType == "fawn") {
			for ( var i = 0; i < stnData.length; i++) {
				//parse JSON style:{"obz_temp":"82","local_time":"2013-08-07 17:00:00 EDT"} to highcart style: [1375902000000,82]
				var temperPoint = [];
				var dateStr = stnData[i].local_time; //"2013-07-18 10:00:00 EDT"
				var date = formatDate(dateStr, browserTyper);// format date for IE
				temperPoint[0] = date.getTime();
				temperPoint[1] = parseInt(stnData[i].obz_temp);
				fawn[i] = temperPoint;
			}
			seriesData = fawn;
			id = "fawn";
		} else {
		    //forecastDate =new Date(stnData[0].local_fcst_time).toString;
			//effDate = new Date(stnData[0].local_eff_time).toString(); //forecastDate,effDate is used in chart title
			var time  =formatDate(stnData[0].local_fcst_time, browserTyper).toString().split(" ");
			forecastDate = time[1] + " " + time[2] + " " + time[3] + " "
			+ time[4];
			time=formatDate(stnData[0].local_eff_time, browserTyper).toString().split(" ");
		    effDate = time[1] + " " + time[2] + " " + time[3] + " "
			+ time[4]; //forecastDate,effDate is used in chart titl
			var forecastStr = stnData[0].local_fcst_time;
			var latestForecastDate = formatDate(forecastStr, browserTyper);
			/*parse JSON style:{"fcst_temp":"90.1","local_fcst_time":"2013-08-07 12:00:00 EDT","local_eff_time":"2013-08-07 14:00:00 EDT"}
			 * to highchart style:[1375902000000,90]
			 * */
			for ( var i = 0; i < stnData.length; i++) {
				var forecastStr = stnData[i].local_fcst_time;//display nws temperature in the latest forecast time
				var dateForecast = formatDate(forecastStr, browserTyper);//make the first forecast date as eff forecast date
				if (latestForecastDate.getTime() == dateForecast.getTime())//Since there can be out of date forecast data, ignore these data
				{
					var temperPoint = [];
					var dateStr = stnData[i].local_eff_time; //format: "2013-07-18 10:00:00 EDT"
					var date = formatDate(dateStr, browserTyper);
					temperPoint[0] = date.getTime();
					temperPoint[1] = parseInt(stnData[i].fcst_temp);
					nws[i] = temperPoint;
				}
			}
			//xStart and xEnd is used for the critical temperature since the nws is longer than fawn
			xStart = nws[0][0];
			xEnd = nws[nws.length - 1][0];
			seriesData = nws;
			id = "nws";
		}
	}
	/*request temperature data to the certain station the user choose
	 * dataType can be fawn, nws
	 * IE and other browsers should be dealt with seperately
	 */
	this.fetchTempData = function(dataType, url) {
		// if in IE browser
		if ($.browser.msie && window.XDomainRequest) {
			// Use Microsoft XDR
			var xdr = new XDomainRequest();
			xdr.open("get", url);
			xdr.onload = function() {
				var JSON = $.parseJSON(xdr.responseText);
				if (JSON == null || typeof (JSON) == 'undefined') {
					JSON = $.parseJSON(data.firstChild.textContent);
				}
				var stnData = JSON;
				//parseData
				parseData("IE", dataType, stnData)
				//if series is already exist in the chart, update it, else add a new one       
				if (graphchart.get(id))
					chart.updateSeries(seriesData, id);
				else
					chart.addSeries(seriesData, id);
				//if nws and fawn are both requested successfully, update the compare table
				if (nws.length != 0 && fawn.length != 0)
					table.inserTable(fawn, nws);
			};
			xdr.onprogress = function() {
			};
			xdr.ontimeout = function() {
			};
			xdr.onerror = function() {
			};
			setTimeout(function() {
				xdr.send();
			}, 0);

		} else {
			$.getJSON(url, function(data) {
				var stnData = data;
				//alert(id+" "+dataType);
				parseData("Other", dataType, stnData);
				if (graphchart.get(id)){
					chart.updateSeries(seriesData, id);
				}
				else{
					chart.addSeries(seriesData, id);
				}
				if (nws.length != 0 && fawn.length != 0){
					table.inserTable(fawn, nws);
					fawn = [];
					nws = [];
				}
			});
		}
	}
}
function graphicChart() {
	var criticalTemp = 0;
	this.intialChart = function() {
		$(document)
				.ready(
						function() {
						    Highcharts.setOptions({  // This is for all plots, change Date axis to local timezone
				                global : {
				                    useUTC : false
				                }
				            });
							graphchart = new Highcharts.Chart(
									{
										chart : {
											renderTo : 'container',
											defaultSeriesType : 'line'
										},
										title : {
											text : 'Please Select a FAWN Station to see the temperature chart'
										},
										tooltip : {
											shared : true,
											crosshairs : true
										},
										xAxis : {
											type : 'datetime',
											tickInterval : 4 * 3600 * 1000, // the interval is 4 hours
											title : {
												text : null
											},
											startOnTick : false
										},

										yAxis : {
											title : {
												text : 'F'
											}
										}
									});
						})
	}
	/*
	 * If the user choose a different station, update the already existed series
	 */
	this.updateSeries = function(data, id) {
		if (id == "nws") {
			newTitle = "Forecast Date:" + forecastDate + ", " + "Eff Date:"
					+ effDate;
			graphchart.setTitle({
				text : newTitle
			});
		}
		graphchart.get(id).update({
			data : data
		});
	}
	/*
	 * If it's the first time choosing a station, add new series to the chart
	 * data type can be critical, fawn, nws, id is 1,2,3
	 */
	this.addSeries = function(data, id) {
		var stnSeries;
		//update fawn
		if (id == "fawn") {
			var name = 'FAWN Observation';
			var stnSeries = {
				id : id,
				color : '#000000',
				name : name,
				data : data
			}
		}
		//update nws
		else if (id == "nws") {
			//when update nws, also update the title of the chart to display the forecast date and effect date
			newTitle = "Forecast Date:" + forecastDate + ", " + "Eff Date:"
					+ effDate;
			graphchart.setTitle({
				text : newTitle
			});
			var name = 'NWS Forecast';
			var stnSeries = {
				id : id,
				color : '#0066FF',
				name : name,
				data : data
			}
			if ($("#critical").val() != 0) {
				var critical = setCritical();
				var series = {
					id : "critical",
					color : '#FF0000',
					name : 'Critical Temperature',
					data : critical
				};
				graphchart.addSeries(series);
			}
		}
		graphchart.addSeries(stnSeries);
	}
	var setCritical = function() {
		var criticalTemp = $("#critical").val();
		var critical = [];//critical data, start from nws start time and end with nws end time
		var criticalStart = [];
		var criticalEnd = [];
		criticalStart[0] = xStart;//series start
		criticalStart[1] = parseInt(criticalTemp);
		criticalEnd[0] = xEnd;//series end
		criticalEnd[1] = parseInt(criticalTemp);
		critical[0] = criticalStart;
		critical[1] = criticalEnd;//two points
		return critical;

	}
	this.displayCritical = function() {
		var id = "critical";
		if ($("#county").val() != "") {
			var critical = setCritical();
			var series = {
				id : id,
				color : '#FF0000',
				name : 'Critical Temperature',
				data : critical
			};
			if (graphchart.get(id) != null) {
				graphchart.get(id).update({
					data : critical
				});
			} else {
				graphchart.addSeries(series);
			}
		}
	}
}
function compareTable() {
	//display and compare the forecast temperature and station temperature
	
	var findComparePoint = function(fawn, nws) {
		var seriesIndex = [];
		var fawnindex = 0;
		var flag = 0;// dicide if the compare point is found
		var length = nws.length;
		//nws has more point than fawn, so start from nws and find if there is a match point in fawn
		for ( var i = 0; i < length; i++) {
			if (nws[i][0] > fawn[fawn.length - 1][0])// if nws is beyoud the time range of fawn, there is no way to find a compare point,break
				break;
			for ( var j = fawnindex; j < fawn.length; j++)//start search from the last compare point 
			{
				//find the equeal time point and set flad to 1, break the loop
				if (fawn[j][0] == nws[i][0]) {
					fawnindex = j;
					flag = 1;
					break;
				}
			}
			//If the compare point is found, store the index into seriesIndex
			if (flag == 1) {
				flag = 0;
				var index = [];
				index['fawnindex'] = fawnindex;
				index['nwsindex'] = i;
				seriesIndex[seriesIndex.length] = index;
			}
		}
		return seriesIndex;
	}
	this.inserTable = function(fawn, nws) {		
		//alert(new Date());
		var table = document.getElementById("forecast")
		while(table.rows.length>1){
			table.deleteRow(1);
		}
		var index = findComparePoint(fawn, nws);
		var rownum = 1;
		//Each row has 5 cells, date cell,fawn temper cell, nws temper cell, diff cell and a hidden cell which store the index of each temper.
		for ( var i = 0; i < index.length; i++) {
			var row = table.insertRow(rownum);
			var timeCell = row.insertCell(0);
			var fawnCell = row.insertCell(1);
			var nwsCell = row.insertCell(2);
			var diffCell = row.insertCell(3);
			var positionCell = row.insertCell(4);
			var localDate = new Date(fawn[index[i].fawnindex][0]).toString();//date format is Wed Aug 07 2013 17:00:00 GMT-0400 (EDT), to make it short, just keep date and time.
			//alert(localDate);
			
			var time = localDate.split(" ");// format the date string
			var timestr = time[1] + " " + time[2] + " " + time[3] + " "
					+ time[4];//Aug 07 2013 17:00:00
			timeCell.innerHTML = timestr;
			//alert(timestr);
			fawnCell.innerHTML = fawn[index[i].fawnindex][1]; //fawn temperature
			nwsCell.innerHTML = nws[index[i].nwsindex][1]; //nws temperature
			diffCell.innerHTML = fawn[index[i].fawnindex][1]
					- nws[index[i].nwsindex][1];// calculate the difference of fawn and nws
			positionCell.innerHTML = index[i].fawnindex + " "
					+ index[i].nwsindex; //store the index of the point in fawn and nws which is used to target the point in chart when the user click a certain row
			positionCell.style.display = "none"; //make it hidden
			rownum++;
		}
		var div = document.getElementById("forecastdiv");
	    div.style.display = ""; //after insert, make the table visible.	    
	}
	//After the user click a certain row in the table. It get the index of two compare point and refresh the tooltip.
	this.targetPoint = function() {
		var fawn="fawn";
		var nws="nws";
		$("#forecast tr")
				.click(
						function() {
							$.each($("#forecast tr"), function(i, n) {
								$(n).removeClass("selected");
							});
							$(this).addClass("selected");
							var index = $("#forecast tr").index($(this));
							var table = document.getElementById("forecast");
							//get the fawn index and nws index hidden in the table
							var col = table.rows[index].cells[4].innerHTML;
							var dataIndex = col.split(" ");
							if (index >= 1) {
								graphchart.tooltip
										.refresh([
												graphchart.get(fawn).data[parseInt(dataIndex[0])],
												graphchart.get(nws).data[parseInt(dataIndex[1])] ]);

							}
						});
	}

}
