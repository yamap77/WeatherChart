package com.fawn.weatherchart;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.http.*;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
@SuppressWarnings("serial")
public class WeatherChartServlet extends HttpServlet {


	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		resp.getWriter().println("Hello, world");
	}
	public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException{
      response.setContentType("application/json;charset=utf-8");
      String station=request.getParameter("county");
      /*
      JSONObject json=new JSONObject();
      JSONArray array=new JSONArray();
      JSONObject member=new JSONObject();
      member.put("arrayData", sampleData);
      array.add(member);
      json.put("jsonArray", array);
      */
      String json="{\"station\":[{\"fawn\":[[0,75],[2,80],[3,77],[5,72]],\"nws\":[[0,80],[2,75],[3,77],[5,82]]},{\"fawn\":[80,82,75,77],\"nws\":[77,78,85,79]}]}";
  // String Alachua = "{\"fawn\":[1,-1,4,3,2,-1,3],\"nws\":[2,3,4,2,3,4,0,-1]}";
  //    String Apopka="{\"fawn\":[1,-1,-3,3,2,-1,3],\"nws\":[2,3,4,2,3,4,5,-1]}";
      PrintWriter pw=response.getWriter();
      
      pw.print(json);
      pw.close();
	}
}