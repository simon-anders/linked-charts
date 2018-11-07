var marker = 0;
red = "off";
green = "off";
blue = "off";

var cm = {};
for(var i = 0; i < data.markerNames.length; i++)
	cm[data.markerNames[i]] = data.countMatrix[i];

var tsne = lc.scatter()
	.x(i => data.tsne[i][0])
	.y(i => data.tsne[i][1])
	.size(1)
	.colour(i => "rgb(" + cm[red][i] + ", " +
												cm[green][i] + ", " +
												cm[blue][i] + ")")
	.place(d3.select("#top").select("#plot"));

data.markerNames.unshift("names");

d3.select("#top").select("#buttons").select("table")
	.selectAll("tr").data(data.markerNames)
		.enter()
			.append("tr");

var cells = d3.select("#top").select("#buttons").select("table")
	.selectAll("tr").selectAll("td")
		.data(d => ["names", "red", "green", "blue"].map(el => [d, el]))
			.enter()
				.append("td")
				.attr("class", d => d[0] == "names" || d[1] == "names" ? "tabletitle" : undefined)
				.style("padding", "2px 2px 2px 2px");

cells
	.append("input")
		.attr("type", "radio")
		.attr("name", d => d[1])
		.attr("value", d => d[0])
		.attr("checked", d => d[0] == "off" & d[1] != "names" ? true : undefined)
		.on("change", function() {
			window[this.name] = this.value;
			tsne.updateElementStyle()
		});

d3.selectAll(".tabletitle")
	.text(function(d) {
		if(d[0] == "names" & d[1] == "names")
			return "";
		if(d[0] == "names")
			return d[1];
		if(d[1] == "names")
			return d[0];
	})