import { get_symbolSize } from "./additionalFunctions";
import { axesChart } from "./axesChart";

export function scatter(id, chart) {

	if(chart === undefined)
		chart = axesChart();
	if(id === undefined)
		id = "layer" + chart.get_nlayers();

  var layer = chart.create_layer(id).get_layer(id)
		.add_property("x")
		.add_property("y")
    .add_property("size", 6)
    .add_property("stroke", function(d) {
      return d3.rgb(layer.get_colour(d)).darker(0.8)
    })
    .add_property("strokeWidth", function(d) {
      return layer.get_size(d) * 0.1;
    })
    .add_property("symbol", "Circle")
    .add_property("symbolValue")
    .add_property("symbolLegendName", function(){return "symbol_" + layer.id})
		.add_property("groupName", function(i){return i;})
    .add_property("informText", function(id){      
      var x = layer.get_x(id),
        y = layer.get_y(id);
      if(x.toFixed) x = x.toFixed(2);
      if(y.toFixed) y = y.toFixed(2);
      return "ID: <b>" + layer.get_elementLabel(id) + "</b>;<br>" + 
            "x = " + x + ";<br>" + 
            "y = " + y
    });
	chart.syncProperties(layer);

  layer.type = "scatter";

  // Set default for numPoints, namely to count the data provided for x
  layer.nelements( function() {
    var val;
    for( var i = 0; i < 10000; i++ ) {
      try {
        // try to get a value
        val = layer.get_x(i)
      } catch( exc ) {
        // if call failed with exception, report the last successful 
        // index, if any, otherwise zero
        return i >= 0 ? i : 0;  
      }
      if( val === undefined ) {
        // same again: return last index with defines return, if any,
        // otherwise zero
        return i >= 0 ? i : 0;  
      }
    }
    // If we exit the loop, there is either something wrong or there are
    // really many points
    throw "There seem to be very many data points. Please supply a number via 'nelements'."
  });

  var symbolValue = layer.symbolValue;
  layer.symbolValue = function(vf, propertyName, overrideFunc) {
    var returnedValue = symbolValue(vf, propertyName, overrideFunc);
    layer.resetSymbolScale();
    return returnedValue;
  }

  var symbolLegendName = layer.symbolLegendName;
  layer.symbolLegendName = function(vf, propertyName, overrideFunc) {
    if(vf)
      var oldName = symbolLegendName();
    var returnedValue = symbolLegendName(vf, propertyName, overrideFunc);
    if(vf)
      layer.chart.legend.rename(oldName, symbolLegendName());
    return returnedValue;
  }

  //default hovering behaviour
  layer.elementMouseOver(function(d){
    var pos = d3.mouse(chart.container.node());
    //change colour and class
    d3.select(this)
      .attr("fill", function(d) {
        return d3.rgb(layer.get_colour(d)).darker(0.5);
      })
      .classed("hover", true);
    //show label
    layer.chart.container.selectAll(".inform").data([d])
        .style("left", (pos[0] + 10) + "px")
        .style("top", (pos[1] + 10) + "px")
        .select(".value")
          .html(layer.get_informText(d));  
    layer.chart.container.selectAll(".inform")
      .classed("hidden", false);
  });
  layer.elementMouseOut(function(d){
    d3.select(this)
      .attr("fill", function(d) {
        return layer.get_colour(d);
      })
      .classed("hover", false);
    layer.chart.container.selectAll(".inform")
      .classed("hidden", true);
  });


  //These functions are used to react on clicks
  layer.findElements = function(lu, rb){
    return layer.g.selectAll(".data_element")
      .filter(function(d) {
        var loc = [layer.chart.axes.scale_x(layer.get_x(d)), 
                  layer.chart.axes.scale_y(layer.get_y(d))]
        return (loc[0] - layer.get_size(d) <= rb[0]) && 
          (loc[1] - layer.get_size(d) <= rb[1]) && 
          (loc[0] + layer.get_size(d) >= lu[0]) && 
          (loc[1] + layer.get_size(d) >= lu[1]);
      }).nodes().map(function(e) {return e.getAttribute("id")});
  }
  layer.get_position = function(id){
    return [layer.chart.axes.scale_x(layer.get_x(id)), 
            layer.chart.axes.scale_y(layer.get_y(id))];
  } 

	layer.layerDomainX(function() {
		if(layer.get_contScaleX()){
      return d3.extent( layer.get_dataIds(), function(k) { return layer.get_x(k) } )
    } else {
      return layer.get_dataIds().map(function(e) { return layer.get_x(e);});
    }
	});
	layer.layerDomainY(function() {
    if(layer.get_contScaleY()) {
		  return d3.extent( layer.get_dataIds(), function(k) { return layer.get_y(k) } )
    } else{
      return layer.get_dataIds().map(function(e) { return layer.get_y(e);});
    }
	});

  layer.resetSymbolScale = function() {
    //get range of symbol values
    var range = [], ids = layer.dataIds();
    for(var i = 0; i < ids.length; i++)
      if(range.indexOf(layer.get_symbolValue(ids[i])) == -1)
        range.push(layer.get_symbolValue(ids[i]));

    var symbols = ["Circle", "Cross", "Diamond", "Square",
                    "Star", "Triangle", "Wye"];

    layer.symbolScale = d3.scaleOrdinal()
      .domain(range)
      .range(symbols);

    layer.symbol(function(id) {
      return layer.symbolScale(layer.get_symbolValue(id));
    })

    if(layer.chart.showLegend())
      layer.addLegend(layer.symbolScale, "symbol", layer.symbolLegendName());

  }

  layer.updateElementLocation = function(){
    if(layer.chart.transitionDuration() > 0 && !layer.chart.transitionOff){
      layer.g.selectAll(".data_element").transition("elementLocation")
        .duration(layer.chart.transitionDuration())
        .attr("transform", function(d) {
          return "translate(" + layer.chart.axes.scale_x( layer.get_x(d) ) + ", " + 
          layer.chart.axes.scale_y( layer.get_y(d) ) + ")"
        });
    } else {
      layer.g.selectAll(".data_element")
        .attr("transform", function(d) {
          return "translate(" + layer.chart.axes.scale_x( layer.get_x(d) ) + ", " + 
          layer.chart.axes.scale_y( layer.get_y(d) ) + ")"
        });
    }
    var domainX = layer.chart.axes.scale_x.domain(),
      domainY = layer.chart.axes.scale_y.domain();
    var notShown = layer.g.selectAll(".data_element")
      .filter(function(d) {
        return layer.get_x(d) > domainX[1] || layer.get_x(d) < domainX[0] ||
                layer.get_y(d) > domainY[1] || layer.get_y(d) < domainY[0];
      }).data();
    var outTicks = layer.g.selectAll(".out_tick").data(notShown, function(d) {return d});
    outTicks.exit().remove();
    outTicks.enter()
      .append("rect")
        .attr("class", "out_tick")
        .attr("fill", function(d){return layer.get_colour(d)})
        .merge(outTicks)
          .attr("width", function(d){
            return layer.get_y(d) > domainY[1] || layer.get_y(d) < domainY[0] ? 4 : 12;
          })
          .attr("height", function(d){
            return layer.get_x(d) > domainX[1] || layer.get_x(d) < domainX[0] ? 4 : 12;
          })
          .attr("x", function(d){
            return d3.max([layer.chart.axes.scale_x(domainX[0]), 
              layer.chart.axes.scale_x(d3.min([layer.get_x(d), domainX[1]])) - d3.select(this).attr("width")]);
          })
          .attr("y", function(d){
            return d3.min([layer.chart.axes.scale_y(domainY[0]) - d3.select(this).attr("height"), 
              layer.chart.axes.scale_y(d3.min([layer.get_y(d), domainY[1]]))]);
          })
          .on("mousedown", function(d){
            layer.chart.domainX([d3.min([domainX[0], layer.get_x(d)]), d3.max([domainX[1], layer.get_x(d)])]);
            layer.chart.domainY([d3.min([domainY[0], layer.get_y(d)]), d3.max([domainY[1], layer.get_y(d)])]);
            layer.chart.updateAxes();
          });
    
    return layer;
  }

  layer.updateSelElementStyle = function(id){
    if(typeof id.length === "undefined")
      id = [id];
    if(layer.chart.transitionDuration() > 0 && !layer.chart.transitionOff)
      for(var i = 0; i < id.length; i++)
        layer.g.selectAll("#p" + id[i]).transition("elementStyle")
          .duration(layer.chart.transitionDuration())
          .attr( "r", function(d) {return layer.get_size(d)})
          .attr( "fill", function(d) { return layer.get_colour(d)})
          .attr( "style", function(d) { return layer.get_style(d)})
    else
      for(var i = 0; i < id.length; i++)
        layer.g.selectAll("#p" + id[i])
          .attr( "r", layer.get_size(id[i]))
          .attr( "fill", layer.get_colour(id[i]))
          .attr( "style", layer.get_style(id[i]));      
    return layer;
  }

  layer.updateElementStyle = function() {
    layer.resetColourScale();
    var ids = layer.get_dataIds();
    var sel = layer.g.selectAll(".data_element");
    if(layer.chart.transitionDuration() > 0 && !layer.chart.transitionOff)
      sel = sel.transition("elementStyle")
        .duration(layer.chart.transitionDuration());
    sel
      .attr("d", function(d) {
        return d3.symbol()
          .type(d3["symbol" + layer.get_symbol(d)])
          .size(get_symbolSize(layer.get_symbol(d), layer.get_size(d)))();
      })
      .attr("fill", function(d) {return layer.get_colour(d)})
      .attr("stroke", function(d) {return layer.get_stroke(d)})
      .attr("stroke-width", function(d) {return layer.get_strokeWidth(d)})
  }

  layer.dresser(function(sel) {
    sel.attr("fill", function(d) {return layer.get_colour(d);})
      .attr("r", function(d) {return layer.get_size(d);});
  });

  layer.updateElements = function(){
    var sel = layer.g.selectAll( ".data_element" )
      .data( layer.get_dataIds(), function(d) {return d;} );
    sel.exit()
      .remove();  
    sel.enter().append( "path" )
      .attr( "class", "data_element" )
      .merge(sel)
        .attr("id", function(d) {return "p" + (layer.id + "_" + d).replace(/ /g,"_");})
        .on( "click", layer.get_on_click )
        .on( "mouseover", layer.get_elementMouseOver )
        .on( "mouseout", layer.get_elementMouseOut );
  }

  return chart;
}