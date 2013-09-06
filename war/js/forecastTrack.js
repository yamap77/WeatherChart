/* Author: Tiejia Zhao Email:tiejiazhao@gmail.com
 * There are  three main functions in this file. 
 * ForecastTracker is the main controller to deal with the user's request
 * 
 * In datacontrol, formatDate formats the date suitable for different browser. ParseData parses the JSON into array
 * for chart. TempData requests the data from sever. 
 * 
 * In graphicChart, initcalChart creates a chart 
 * for late use. There are also addSeries and updateSeries to update the series data when user chooses a
 * station. setCritical and displayCritical are for drawing the critical temperature. 
 * 
 * In compareTable, findComparePoint calculates the point fo nws and fawn have the save x value. 
 * FillTable inserts these points into a compare table. targetPoint refresh the tooltip after the user clicks a certain row in the table. 
 */

function forecastTracker() {
    //Graphic Chart
	var graphChart;
    //the start point of critical temperature (The date of the first nws forecast date)
	var xStart;
    //the end point of critical temperature (The date of the last nws forecast date)
    var xEnd;
	var forecastDateTime;
	var effDateTime;
	this.graphObj = new graphicChart();
	this.dataRequestObj = new dataControl();
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
			var dateArr = dateString[0].split("-");//[2013,08,07]
			var timeArr = dateString[1].split(":");//[14,0,0]
			var dateStr = new Date(dateArr[0], (dateArr[1] - 1), dateArr[2],
					timeArr[0], timeArr[1], timeArr[2]).toString();
			var dateTime = dateStr.split(" ");
			var dateTemp = dateTime[0] + " " + dateTime[1] + " " + dateTime[2]
					+ " " + dateTime[5] + " " + dateTime[3] + " "
					+ dateString[2];// Wed Aug 7 2013 17:00:00 EDT
			var date = new Date(dateTemp);
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
			//forecastDateTime,effDateTime is used in chart title
			var time = formatDate(stnData[0].local_fcst_time, browserTyper)
					.toString().split(" ");
			forecastDateTime = time[1] + " " + time[2] + " " + time[3] + " "
					+ time[4];
			time = formatDate(stnData[0].local_eff_time, browserTyper)
					.toString().split(" ");
			effDateTime = time[1] + " " + time[2] + " " + time[3] + " " + time[4];
			var forecastStr = stnData[0].local_fcst_time;
			var latestforecastDateTime = formatDate(forecastStr, browserTyper);
			/*parse JSON style:{"fcst_temp":"90.1","local_fcst_time":"2013-08-07 12:00:00 EDT","local_eff_time":"2013-08-07 14:00:00 EDT"}
			 * to highchart style:[1375902000000,90]
			 * */
			for ( var i = 0; i < stnData.length; i++) {
				//display nws temperature in the latest forecast time
				var forecastStr = stnData[i].local_fcst_time;
				var dateForecast = formatDate(forecastStr, browserTyper);
				//Since there can be out of date forecast data, ignore these data, make the first forecast date as eff forecast date
				if (latestforecastDateTime.getTime() == dateForecast.getTime()) {
					var temperPoint = [];
					//format: "2013-07-18 10:00:00 EDT"
					var dateStr = stnData[i].local_eff_time;
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
				if (!JSON) {
					alert("Currently has no data!")
				}
				if(JSON.hasOwnProperty('data')){
				var stnData = JSON.data;
				//parseData
				parseData("IE", dataType, stnData)
				//if series is already exist in the chart, update it, else add a new one       
				if (graphChart.get(id))
					chart.updateSeries(seriesData, id);
				else
					chart.addSeries(seriesData, id);
				//if nws and fawn are both requested successfully, update the compare table
				if (nws.length != 0 && fawn.length != 0)
					table.fillTable(fawn, nws);
			}};
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
				if(!data){
					alert("Currently has no data!");
				}
				if(data.hasOwnProperty('data')){
				var stnData = data.data;
				//alert(id+" "+dataType);
				parseData("Other", dataType, stnData);
				if (graphChart.get(id)) {
					chart.updateSeries(seriesData, id);
				} else {
					chart.addSeries(seriesData, id);
				}
				if (nws.length != 0 && fawn.length != 0) {
					table.fillTable(fawn, nws);
					fawn = [];
					nws = [];
				}
				}
			});
		}
	}
	this.fillSelectionBox = function() {
		$.getJSON('http://test.fawn.ifas.ufl.edu/controller.php/stationsJson/',
				function(data) {
					var stnObj = data;
					var stnIDs = Object.keys(stnObj); //get station ID list[110,120.....]
					var stations = new Array(stnIDs.length);
					for ( var i = 0; i < stnIDs.length; i++) {
						var stnID = stnIDs[i];
						var station = new Array();
						station['stnName'] = stnObj[stnID].display_name;
						station['stnID'] = stnID;
						stations[i] = station;
					}

					stations.sort(function(a, b) {
						return (a['stnName'] < b['stnName'] ? -1
								: (a['stnName'] > b['stnName'] ? 1 : 0));
					});
					$("#county").append(
							$('<option></option>').val("").html(
									"Select Station"));
					for ( var i = 0; i < stations.length; i++) {
						$("#county").append(
								$('<option></option>')
										.val(stations[i]['stnID']).html(
												stations[i]['stnName']));
					}
					$("#county").val(stations[0]['stnID']);
					startLoadData();
				});
		var options = "";
		options += "<option value=" + 0 + ">Critical Temperature</option>"
		for ( var i = 100; i >= 0; i--) {
			options += "<option value=" + i + ">" + i + "</option>";
		}

		document.getElementById('critical').innerHTML = options;
		// window.setTimeout(fetchData,6000);

	}
}
function graphicChart() {
	var criticalTemp = 0;
	//initial a graphic chart
	this.initialChart = function() {
		$(document).ready(function() {
			Highcharts.setOptions({ // This is for all plots, change Date axis to local timezone
				global : {
					useUTC : false
				}
			});
			graphChart = new Highcharts.Chart({
				chart : {
					renderTo : 'chartcontainer',
					defaultSeriesType : 'line'
				},
				title : {
					text : ' '
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
			newTitle = "Forecast Date:" + forecastDateTime + ", " + "Eff Date:"
					+ effDateTime;
			graphChart.setTitle({
				text : newTitle
			});
		}
		graphChart.get(id).update({
			data : data
		});
	}
	/*
	 * If it's the first time choosing a station, add new series to the chart
	 * data type can be critical, fawn, nws, id is "critical", "fawn","nws"
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
			newTitle = "Forecast Date:" + forecastDateTime + ", " + "Eff Date:"
					+ effDateTime;
			graphChart.setTitle({
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
				graphChart.addSeries(series);
			}
		}
		graphChart.addSeries(stnSeries);
	}
	var setCritical = function() {
		var criticalTemp = $("#critical").val();
		var critical = [];//critical data, start from nws start time and end with nws end time
		var criticalStart = [];
		var criticalEnd = [];
		//series start
		criticalStart[0] = xStart;
		criticalStart[1] = parseInt(criticalTemp);
		//series end
		criticalEnd[0] = xEnd;
		criticalEnd[1] = parseInt(criticalTemp);
		//two points
		critical[0] = criticalStart;
		critical[1] = criticalEnd;
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
			if (graphChart.get(id) != null) {
				graphChart.get(id).update({
					data : critical
				});
			} else {
				graphChart.addSeries(series);
			}
		}
	}
}
//display and compare the forecast temperature and station temperature
function compareTable() {
	//find nws and fawn points with same datetime 
	var findComparePoints = function(fawn, nws) {
		var sameDateTimePoints = [];
		var fawnindex = 0;
		var flag = 0;// dicide if the compare point is found
		//nws has more point than fawn, so start from nws and find if there is a match point in fawn
		var nwsHash={};
		for(var i=0;i<nws.length;i++){
			nwsHash[nws[i][0]]=i;
		}
		var count=0;
		for(var j=0;j<fawn.length;j++){
			if(nwsHash.hasOwnProperty(fawn[j][0])){
				var index=[];
				index['fawnindex']=j;
				index['nwsindex']=nwsHash[fawn[j][0]];
				sameDateTimePoints[count]=index;
				count++;
			}
		}
		return sameDateTimePoints;
	}
    
	this.fillTable = function(fawn, nws) {
		//alert(new Date());
		var table = document.getElementById("forecast");
		//delete the old data in the table
		while (table.rows.length > 1) {
			table.deleteRow(1);
		}
		var dateTimePoints = findComparePoints(fawn, nws);
		//Each row has 5 cells, date cell,fawn temper cell, nws temper cell, diff cell and a hidden cell which store the index of each temper.
		for ( var i = 0; i < dateTimePoints.length; i++) {
			//to make it short, just keep date and time.
			var localDate = new Date(fawn[dateTimePoints[i].fawnindex][0])
					.toString();
			var timeStr = shortDataStr(localDate);
			var fawnTemperature = fawn[dateTimePoints[i].fawnindex][1];
			var nwsTemperature = nws[dateTimePoints[i].nwsindex][1];
			var diff = fawnTemperature - nwsTemperature;
			//Store the nws and fawn indexes of the compare points in a hidden field
			var positionInSeries = dateTimePoints[i].fawnindex + " "
					+ dateTimePoints[i].nwsindex;
			var rowcontend = '<tr><td>' + timeStr + '</td>' + '<td>'
					+ fawnTemperature + '</td>' + '<td>' + nwsTemperature
					+ '</td>' + '<td>' + diff + '</td>' + '<td class="index">'
					+ positionInSeries + '</td></tr>';
			$("#forecast").append(rowcontend);
		}
		//the 5th is the hidden field
		$("#forecast td:nth-child(5),th:nth-child(5)").hide();
		$("#forecast").show();
	}
	var shortDataStr=function(dataStr){
		//format the date string,date format is Wed Aug 07 2013 17:00:00 GMT-0400 (EDT), 
		var time = dataStr.split(" ");
		//After format Aug 07 2013 17:00:00
		var dateTime = time[1] + " " + time[2] + " " + time[3] + " "
				+ time[4];
		return dateTime;
		
	}
	//After the user click a certain row in the table. It get the index of two compare point and refresh the tooltip.
	this.targetPoint = function() {
		var fawn = "fawn";
		var nws = "nws";
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
							//[A,B],A is the position of fawn, B is the postion of nws
							var comparePoint = col.split(" ");
							if (index >= 1) {
								graphChart.tooltip
										.refresh([
												graphChart.get(fawn).data[parseInt(comparePoint[0])],
												graphChart.get(nws).data[parseInt(comparePoint[1])] ]);

							}
						});
	}

}
function startLoadData() {
	var fawnurl = 'http://test.fawn.ifas.ufl.edu/controller.php/fawnByStn/json/'
			+ $("#county").val();
	var nwsurl = 'http://test.fawn.ifas.ufl.edu/controller.php/forecastByStn/json/'
			+ $("#county").val();
	weatherForecast.dataRequestObj.fetchTempData("fawn", fawnurl);
	weatherForecast.dataRequestObj.fetchTempData("nws", nwsurl);
}
