function forecastTracker() {
    var graphchart;
    var xStart;
    var xEnd;
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
    /*
     * In IE, the data format should be normalize because IE is very restricted about the format.
     *
     */
    var formatIEDate = function (dateStr) {
        //2013-08-07 14:00:00 EDT
        var dateString = dateStr.split(" ");//[2013-08-07,14:00:00,EDT]
        var d = dateString[0].split("-");//[2013,08,07]
        var t = dateString[1].split(":");//[14,0,0]
        var date = new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]);// Wed Aug 7 17:00:00 EDT 2013
        //alert(date);
        return date;
    }
    /*request temperature data to the certain station the user choose
     * dataType can be fawn, nws
     * IE and other browsers should be dealt with seperately
     */
    this.fetchTempData = function (dataType, url) {
        //series data
        var data;
        //series id
        var id;
        // if in IE browser
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
                if (dataType == "fawn") {
                    for (var i = 0; i < stnData.length; i++) {
                        //parse JSON style:{"obz_temp":"82","local_time":"2013-08-07 17:00:00 EDT"} to highcart style: [1375902000000,82]
                        var temperPoint = [];
                        var dateStr = stnData[i].local_time; //"2013-07-18 10:00:00 EDT"
                        var date = formatIEDate(dateStr);// format date for IE
                        temperPoint[0] = date.getTime();
                        temperPoint[1] = parseInt(stnData[i].obz_temp);
                        fawn[i] = temperPoint;
                    }
                    data = fawn;
                    id = 2;
                }
                else {
                    forecastDate = stnData[0].local_fcst_time;
                    effDate = stnData[0].local_eff_time; //forecastDate,effDate is used in chart title
                    var forecast = stnData[0].local_fcst_time;
                    var effforecast = formatIEDate(forecast);
                    //parse JSON style:{"fcst_temp":"90.1","local_fcst_time":"2013-08-07 12:00:00 EDT","local_eff_time":"2013-08-07 14:00:00 EDT"}
                    //to highchart style:[1375902000000,90]
                    for (var i = 0; i < stnData.length; i++) {
                        var fore = stnData[i].local_fcst_time;
                        var effcttime = formatIEDate(fore);//make the first forecast date as eff forecast date
                        if (effforecast.getTime() == effcttime.getTime())//Since there can be out of date forecast data, ignore these data
                        {
                            var temperPoint = [];
                            var dateStr = stnData[i].local_eff_time; //"2013-07-18 10:00:00 EDT"
                            var date = formatIEDate(dateStr);          //format for IE
                            temperPoint[0] = date.getTime();
                            temperPoint[1] = parseInt(stnData[i].fcst_temp);
                            nws[i] = temperPoint;

                        }
                    }
                    //xStart and xEnd is used for the critical temperature since the nws is longer than fawn
                    xStart = nws[0][0];
                    xEnd = nws[nws.length - 1][0];
                    data = nws;
                    id = 3;
                }
                //if series is already exist in the chart, update it, else add a new one
                if (graphchart.get(id))
                    chart.updateSeries(data, id);
                else
                    chart.addSeries(data, id);
                //if nws and fawn are both requested successfully, update the compare table
                if (nws.length != 0 && fawn.length != 0)
                    table.inserTable(fawn, nws);


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
        else {
            $.getJSON(url,
                function (data) {
                    var stnData = data;
                    if (dataType == "fawn") {
                        //parse JSON style:{"obz_temp":"82","local_time":"2013-08-07 17:00:00 EDT"} to highcart style: [1375902000000,82]
                        for (var i = 0; i < stnData.length; i++) {
                            var temperPoint = [];
                            temperPoint[0] = (new Date(stnData[i].local_time)).getTime();
                            temperPoint[1] = parseInt(stnData[i].obz_temp);
                            fawn[i] = temperPoint;
                        }
                        data = fawn;
                        id = 2;
                    }
                    else {
                        forecastDate = stnData[0].local_fcst_time;
                        effDate = stnData[0].local_eff_time; //forecastDate,effDate is used in chart title
                        var effforecast = new Date(stnData[0].local_fcst_time).getTime();
                        for (var i = 0; i < stnData.length; i++) {
                            if (effforecast == (new Date(stnData[i].local_fcst_time).getTime())) {
                                var temperPoint = [];
                                var tempnws = [];
                                temperPoint[0] = (new Date(stnData[i].local_eff_time)).getTime();
                                temperPoint[1] = parseInt(stnData[i].fcst_temp);
                                nws[i] = temperPoint;
                            }
                        }
                        xStart = nws[0][0];
                        xEnd = nws[nws.length - 1][0];
                        data = nws;
                        id = 3;
                    }

                    if (graphchart.get(id))
                        chart.updateSeries(data, id);
                    else
                        chart.addSeries(data, id);
                    if (nws.length != 0 && fawn.length != 0)
                        table.inserTable(fawn, nws);
                });
        }
    }
}
function graphicChart() {
    var criticalTemp=0;
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
                    tickInterval: 4 * 3600 * 1000, // the interval is 4 hours
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
    /*
     * If the user choose a different station, update the already existed series
     */
    this.updateSeries = function (data, id) {
        if (id == 3) {
            newTitle = "Forecast Date:" + forecastDate + ", " + "Eff Date:" + effDate;
            graphchart.setTitle({text: newTitle});
        }
        graphchart.get(id).update({
            data: data
        });
    }
    /*
     * If it's the first time choosing a station, add new series to the chart
     * data type can be critical, fawn, nws, id is 1,2,3
     */
    this.addSeries = function (data, id) {
        var stnSeries;
        //update fawn
        if (id == 2) {
            var name = 'FAWN Observation';
            var stnSeries = {
                id: id,
                color: '#000000',
                name: name,
                data: data
            }
        }
        //update nws
        else if (id == 3) {
            //when update nws, also update the title of the chart to display the forecast date and effect date
            newTitle = "Forecast Date:" + forecastDate + ", " + "Eff Date:" + effDate;
            graphchart.setTitle({text: newTitle});
            var name = 'NWS Forecast';
            var stnSeries = {
                id: id,
                color: '#0066FF',
                name: name,
                data: data
            }
            if($("#critical").val()!=0){
            	var critical=setCritical();
            	var series = {
                        id: 1,
                        color:'#FF0000',
                        name: 'Critical Temperature',
                        data: critical};
            	graphchart.addSeries(series);       	
            }
        }
        graphchart.addSeries(stnSeries);   
    }
    var setCritical=function(){
    	var criticalTemp = $("#critical").val();
        var critical = [];//critical data, start from nws start time and end with nws end time
        var criticalStart = [];
        var criticalEnd = [];
        criticalStart[0] = xStart;//series start
        criticalStart[1] = parseInt(criticalTemp);
        criticalEnd [0] = xEnd;//series end
        criticalEnd [1] = parseInt(criticalTemp);
        critical[0] = criticalStart;
        critical[1] = criticalEnd;//two points
        return critical;
 	
   }
    this.displayCritical = function () {
        if ($("#county").val() != "") {
        	var critical=setCritical();
            var series = {
                id: 1,
                color:'#FF0000',
                name: 'Critical Temperature',
                data: critical};
            if (graphchart.get(1) != null) {
                graphchart.get(1).update({
                    data: critical
                });
            }
            else {
                graphchart.addSeries(series);
            }
        }
    }
}
function compareTable() {
    //display and compare the forecast temperature and station temperature
	var seriesIndex=[];
	var findComparePoint=function(fawn,nws){
		var fawnindex = 0;
		var flag = 0;// dicide whether the compare point is found
		var length = nws.length;
		//nws has more point than fawn, so start from nws and find if there is a match point in fawn
	    for (var i = 0; i < length; i++) {
            if (nws[i][0] > fawn[fawn.length - 1][0])// if nws is beyoud the time range of fawn, there is no way to find a compare point,break
                break;
            for (var j = fawnindex; j < fawn.length; j++)//start search from the last compare point 
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
            	var index=[];
            	index['fawnindex']=fawnindex;
            	index['nwsindex']=i;
            	seriesIndex[seriesIndex.length]=index;
            }		
	}
	    return seriesIndex;
	}
	this.inserTable=function(fawn, nws){
		var table = document.getElementById("forecast")
		var index=findComparePoint(fawn,nws);
		var rownum=1;
		//Each row has 5 cells, date cell,fawn temper cell, nws temper cell, diff cell and a hidden cell which store the index of each temper.
		for(var i=0;i<index.length;i++){
            var row = table.insertRow(rownum);
            var timeCell = row.insertCell(0);
            var fawnCell = row.insertCell(1);
            var nwsCell = row.insertCell(2);
            var diffCell = row.insertCell(3);
            var positionCell = row.insertCell(4);
            var date = new Date(fawn[index[i].fawnindex][0]).toString();//date format is Wed Aug 07 2013 17:00:00 GMT-0400 (EDT), to make it short, just keep date and time.
            var time = date.split(" ");// format the date string
            var timestr = time[1] + " " + time[2] + " " + time[3] + " " + time[4];//Aug 07 2013 17:00:00
            timeCell.innerHTML = timestr; 
            fawnCell.innerHTML = fawn[index[i].fawnindex][1]; //fawn temperature
            nwsCell.innerHTML = nws[index[i].nwsindex][1]; //nws temperature
            diffCell.innerHTML = fawn[index[i].fawnindex][1] - nws[index[i].nwsindex][1];// calculate the difference of fawn and nws
            positionCell.innerHTML = index[i].fawnindex + " " + index[i].nwsindex; //store the index of the point in fawn and nws which is used to target the point in chart when the user click a certain row
            positionCell.style.display = "none"; //make it hidden
            rownum++;	
		}
		var div = document.getElementById("forecastdiv");
        div.style.display = ""; //after insert, make the table visible.
	}
    //After the user click a certain row in the table. It get the index of two compare point and refresh the tooltip.
	this.chooseTable = function () {
        $("#forecast tr").click(function () {
            $.each($("#forecast tr"), function (i, n) {
                $(n).removeClass("selected");
            });
            $(this).addClass("selected");
            var index = $("#forecast tr").index($(this));
            var table = document.getElementById("forecast");
            //get the fawn index and nws index hidden in the table
            var col = table.rows[index].cells[4].innerHTML;
            var dataIndex = col.split(" ");
            if (index >= 1) {
                graphchart.tooltip.refresh([graphchart.series[0].data[parseInt(dataIndex[0])], graphchart.series[1].data[parseInt(dataIndex[1])]]);

            }
        });
    }

}

