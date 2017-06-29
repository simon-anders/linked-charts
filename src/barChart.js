import { axisChart } from "./chartBase";

export function barChart(id, chart){
	
	if(chart === undefined)
		chart = axisChart();
	if(id === undefined)
		id = "layer" + chart.get_nlayers();
	
	var layer = chart.create_layer(id).get_layer(id)
		.add_property("ngroups")
		.add_property("groupIds")
		.add_property("nbars")
		.add_property("barIds")
		.add_property("nstacks")
		.add_property("stackIds")
		.add_property("value")
		.add_property("groupWidth", 0.6)
		.add_property("stroke", "#444")
		.add_property("strokeWidth", 0);
	chart.syncProperties(layer);

	layer.type = "barChart";

	layer.ngroups("_override_", "groupIds", function(){
		return d3.range(layer.ngroups()).map(function(e) {return e.toString()});
	});
	layer.groupIds("_override_", "ngroups", function(){
		return layer.groupIds().length;
	});
	layer.nbars("_override_", "barIds", function(){
		return d3.range(layer.nbars()).map(function(e) {return e.toString()});
	});
	layer.barIds("_override_", "nbars", function(){
		return layer.barIds().length;
	});
	layer.nstacks("_override_", "stackIds", function(){
		return d3.range(layer.nbars()).map(function(e) {return e.toString()});
	});
	layer.stackIds("_override_", "nstacks", function(){
		return layer.stackIds().length;
	});

	layer.nbars(1);
	layer.nstacks(1);
	layer.contScaleX(false);
	layer.dataIds(function(){
		return layer.stackIds();
	});
	layer.colourValue(function(id) {return id;});
	
	layer.layerDomainX(function() {
		return layer.groupIds();
	});
	layer.layerDomainY(function(){
		//go through all bars and find the highest
		var barIds = layer.barIds(),
			groupIds = layer.groupIds(),
			stackIds = layer.stackIds(),
			maxHeight = 0, curHeihgt;
		for(var i = 0; i < layer.ngroups(); i++)
			for(var j = 0; j < layer.nbars(); j++){
				curHeihgt = 0;
				for(var k = 0; k < layer.nstacks(); k++)
					curHeihgt += layer.get_value(groupIds[i], barIds[j], stackIds[k]);
				if(curHeihgt > maxHeight) maxHeight = curHeihgt;
			}

		return [0, maxHeight];
	});

	layer.findPoints = function(lu, rb){
		layer.g.selectAll(".data_point")
			.filter(function(){
				var x = +d3.select(this).attr("x"),
					y = +d3.select(this).attr("y"),
					width = +d3.select(this).attr("width"),
					height = +d3.select(this).attr("height");

				return (lu[0] <= x + width && rb[0] > x && 
								lu[1] <= y + height && rb[1] > y)
			}).nodes().map(function(e) {return e.getAttribute("id")});
	}
	layer.get_position = function(id){
		//gets id as data (so here we have an array of three ids)
		return [layer.g.select("#p" + id.join("_-sep-_")).attr("x"),
						layer.g.select("#p" + id.join("_-sep-_")).attr("y")];
	}

	layer.updatePointLocation = function(){
		var groupWidth = layer.chart.axes.scale_x.step() * layer.groupWidth(),
			barWidth = groupWidth/layer.nbars(),
			//for now it's just a linear scale
			heightMult = Math.abs(layer.chart.axes.scale_y(1) - layer.chart.axes.scale_y(0)),
			groupScale = d3.scaleLinear()
				.domain([0, layer.nbars()])
				.range([-groupWidth/2, groupWidth/2 - barWidth]),
			barIds = layer.barIds(),
			stackIds = layer.stackIds();
		if(typeof layer.chart.transition !== "undefined")
			layer.g.selectAll(".data_point").transition(layer.chart.transition)
				.attr("width", barWidth)
				.attr("height", function(d){ 
					return layer.get_value(d[0], d[1], d[2]) * heightMult;
				})
				.attr("x", function(d){
					return groupScale(barIds.indexOf(d[1])) + 
						layer.chart.axes.scale_x(d[0]);
				})
				.attr("y", function(d){
					var height = 0;
					for(var i = 0; i <= stackIds.indexOf(d[2]); i++)
						height += layer.get_value(d[0], d[1], stackIds[i]);
					return layer.chart.axes.scale_y(height);
				})
		else
			layer.g.selectAll(".data_point")
				.attr("width", barWidth)
				.attr("height", function(d){ 
					return layer.get_value(d[0], d[1], d[2]) * heightMult;
				})
				.attr("x", function(d){
					return groupScale(barIds.indexOf(d[1])) + 
						layer.chart.axes.scale_x(d[0]);
				})
				.attr("y", function(d){
					var height = 0;
					for(var i = 0; i <= stackIds.indexOf(d[2]); i++)
						height += layer.get_value(d[0], d[1], stackIds[i]);
					return layer.chart.axes.scale_y(height);
				});

		return layer;			
	}
	layer.updatePointStyle = function(){
		layer.resetColourScale();

		if(typeof layer.chart.transition !== "undefined")
			layer.g.selectAll(".data_point").transition(chart.transition)
				.attr("fill", function(d) {
					return layer.get_colour(d[0], d[1], d[2]);
				})
				.attr("stroke", function(d) {
					return layer.get_stroke(d[0], d[1], d[2]);
				})
				.attr("stroke-width", function(d) {
					return layer.get_strokeWidth(d[0], d[1], d[2]);
				})
		else
			layer.g.selectAll(".data_point")
				.attr("fill", function(d) {
					return layer.get_colour(d[2], d[1], d[0]);
				})
				.attr("stroke", function(d) {
					return layer.get_stroke(d[0], d[1], d[2]);
				})
				.attr("stroke-width", function(d) {
					return layer.get_strokeWidth(d[0], d[1], d[2]);
				});
	}

	layer.updatePoints = function(){
		
		var groups = layer.g.selectAll(".group")
			.data(layer.groupIds(), function(d) {return d;});
		groups.exit()
			.remove();
		groups.enter()
			.append("g")
				.attr("class", "group");

		var bars = layer.g.selectAll(".group").selectAll(".bar")
			.data(function(d) {
				return layer.barIds().map(function(e){
					return [d, e];
				})
			}, function(d) {return d;});
		bars.exit()
			.remove();
		bars.enter()
			.append("g")
				.attr("class", "bar");

		var stacks = layer.g.selectAll(".group").selectAll(".bar").selectAll(".data_point")
			.data(function(d){
				return layer.stackIds().map(function(e){
					return d.concat(e);
				})
			}, function(d) {return d;});
		stacks.exit()
			.remove();
		stacks.enter()
			.append("rect")
				.attr("class", "data_point")
				.merge(stacks)
					.attr("id", function(d) {return "p" + d.join("_-sep-_")})
					.on( "click", layer.get_on_click );		
	}

	//add legend


	return layer;
}