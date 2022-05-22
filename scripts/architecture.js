//got the original example from here
//https://bl.ocks.org/e9t/6073cd95c2a515a9f0ba

var play;
var state;
var data;
var random_data;
var evolution_data;
const width = document.getElementById('architecture').clientWidth;
const height = 800;
const margin = { top:50, bottom: 50, right: 50, left: 60 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
state = this;
data = this;
var new_layer_name;
var rand_arch;
var evol_arch;
var index_till_now;
var new_layer_name;
width_scatterplot = document.getElementById('scatterplot').clientWidth;
height_scatterplot = document.getElementById('scatterplot').clientHeight;

var scatter_margin = {top: 40, right: 20, bottom: 40, left: 60},
    scatter_width = width_scatterplot - scatter_margin.left - scatter_margin.right,
    scatter_height = height_scatterplot - scatter_margin.top - scatter_margin.bottom;
var networkGraph = {
	"nodes": []
};

// var width = $window.innerWidth -15;
// var	height = 400;
var nodeSize = 25;

var color = d3.scaleOrdinal(d3.schemeCategory10);

state.draw = draw;


var lastState;
var bestLayerAdded;
var largestTestDelta;
//var bestModelYet=null;
var bestModelTest;
var random_data;
var evol_data;
const NA="N/A";

// This function is called once the HTML page is fully loaded by the browser
document.addEventListener('DOMContentLoaded', function () {
	Promise.all([readTextFile("data/random-data.json", function (values){
			random = JSON.parse(values);

			random_data = random;
			for(i=0; i<random_data.length; i++) {
				random_data[i]["best_valid"] *= 100; 
				random_data[i]["best_test"] *= 100;
			}
			initState(random_data);
			init(0);
			   
		}),readTextFile("data/evolution-data.json", function (values){
			evolution = JSON.parse(values);

			evolution_data = evolution;
			for(i=0; i<evolution_data.length; i++) {
				evolution_data[i]["best_valid"] *= 100; 
				evolution_data[i]["best_test"] *= 100; 
			}
		})	
	]);
});

function map_data() {
	data.map(function (d) {
		d.best_valid = +d["best_valid"];
		d.best_test = +d["best_test"];
		
	}); 
}

function buildNodeGraph() {
	var newGraph = {
		"nodes": []
	};

	//construct input layer
	var newFirstLayer = [];
	for (var i = 0; i < state.inputLayerHeight; i++) {
		var newTempLayer = {"label": "i"+i, "layer": 1};
		newFirstLayer.push(newTempLayer);
	}

	//construct hidden layers
	var hiddenLayers = [];
	for (var hiddenLayerLoop = 0; hiddenLayerLoop < state.hiddenLayersCount; hiddenLayerLoop++) {
		var newHiddenLayer = [];
		//for the height of this hidden layer
		for (var i = 0; i < state.hiddenLayersDepths[hiddenLayerLoop]; i++) {
			var newTempLayer = {"label": "h"+ hiddenLayerLoop + i, "layer": (hiddenLayerLoop+2)};
			newHiddenLayer.push(newTempLayer);
		}
		hiddenLayers.push(newHiddenLayer);
	}

	//construct output layer
	var newOutputLayer = [];
	for (var i = 0; i < state.outputLayerHeight; i++) {
		var newTempLayer = {"label": "o"+i, "layer": state.hiddenLayersCount + 2};
		newOutputLayer.push(newTempLayer);
	}

	//add to newGraph
	var allMiddle = newGraph.nodes.concat.apply([], hiddenLayers);
	newGraph.nodes = newGraph.nodes.concat(newFirstLayer, allMiddle, newOutputLayer );

	return newGraph;

}

function drawGraph(networkGraph, svg) {
	var graph = networkGraph;
	var nodes = graph.nodes;
	var layers = [];

	// get network size
	var netsize = {};
	nodes.forEach(function (d) {
		if(d.layer in netsize) {
			netsize[d.layer] += 1;
		} else {
			netsize[d.layer] = 1;
		}
		d["lidx"] = netsize[d.layer];
	});

	
	// calc distances between nodes
	var largestLayerSize = Math.max.apply(
		null, Object.keys(netsize).map(function (i) { return netsize[i]; }));

	var xdist = width / Object.keys(netsize).length,
		ydist = (height-150) / largestLayerSize;
	
	var layerHeight = height - 70;
	var layerWidth = xdist - 40;


	// create node locations
	nodes.map(function(d) {
		d["x"] = (d.layer - 0.5) * xdist;
		d["y"] = ( ( (d.lidx - 0.5) + ((largestLayerSize - netsize[d.layer]) /2 ) ) * ydist )+10 ;
	});

	// Layer boundaries
	for (let i = 0; i<state.hiddenLayersCount + 2; i++) {
		tempData = {
			"x": (i) * xdist + 15,
			"index": i,
			"layerName": state.layerNames[i]
		}
		layers.push(tempData);
	}
	
	// autogenerate links
	var links = [];
	nodes.map(function(d, i) {
		for (var n in nodes) {
			if (d.layer + 1 == nodes[n].layer) {
				links.push({"source": parseInt(i), "target": parseInt(n), "value": 1}) }
		}
	}).filter(function(d) { return typeof d !== "undefined"; });

	// draw links
	var link = svg.selectAll(".link")
		.data(links)
		.enter().append("line")
		.attr("class", "link")
		.attr("x1", function(d) { return nodes[d.source].x; })
		.attr("y1", function(d) { return nodes[d.source].y; })
		.attr("x2", function(d) { return nodes[d.target].x; })
		.attr("y2", function(d) { return nodes[d.target].y; })
		.style("stroke-width", function(d) { return Math.sqrt(d.value); });

	// draw nodes
	var node = svg.selectAll(".node")
		.data(nodes)
		.enter().append("g")
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")"; });

	var circle = node.append("circle")
		.attr("class", "node")
		.attr("r", nodeSize)
		.style("fill", function(d) { return color(d.layer); });

	node.append("text")
		.attr("dx", "-0.7em")
		.attr("dy", ".35em")
		.attr("font-size", "1em")
		.style("fill",'white')
		.text(function(d) { return d.label; });

	var layers = svg.selectAll(".layers")
		.data(layers)
		.enter().append("g")
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + 20 + ")"; });

	var rect = layers.append("rect")
		.attr("width", layerWidth)
		.attr("height", layerHeight)
		.attr("x", 0)
		.attr("y", 20)
		.attr("class", "layers")
		.attr("id", function(d) {return d.index})
		.attr("data-bs-toggle", "modal")
		.attr("data-bs-target", "#staticBackdrop")
		.on("click", function(d) {
			remove_add(d.index, layers);
		});

	var layerLabel = layers.append("text")
		.attr("x", 55 + layerWidth/2)
		.attr("y", 670)
		.attr("class", "layer-text")
		.text(function(d) { return d.layerName; });
}

function remove_add(layer_index, layers) {
	state.mode = document.getElementById("layerOp").value;
	var next_state_index;
	if (state.mode == "1") {

		modal = document.getElementById("modal-body");
		var selectList = document.createElement("select");
		selectList.id = "select-layer";		

		var labelSelect = document.createElement("label");
		labelSelect.setAttribute("for", "select-layer");
		labelSelect.id = "label-select"
		labelSelect.innerHTML = "Choose Layer:&nbsp"
		modal.appendChild(labelSelect);
		modal.appendChild(selectList);

		count_null = 0;
		//Create and append the options
		for (var i = 0; i < state.next_options_indexes.length; i++) {
			if (state.next_options_indexes[layer_index][i]) {

				var option = document.createElement("option");
				option.value = state.next_options_indexes[layer_index][i];
				option.text = state.next_layer_options[layer_index][i];
				selectList.appendChild(option);
			}
			else {
				count_null += 1;
			}
		}	
		if (state.next_options_indexes.length == count_null) {
			var option = document.createElement("option");
			option.value = -1;
			option.text = "No other option selection possible.";
			selectList.appendChild(option);
		}	
	}

	else if (state.mode == "2") {
		// console.log(state.delete_options);
		next_state_index = state.delete_options[layer_index];
		if (next_state_index != -1) {
			modal = document.getElementById("modal-body");
			var info = document.createElement("h6");
			info.id = "infoId";
			info.textContent = "Removed Layer ".concat(state.layerNames[layer_index]);
			modal.appendChild(info);

			document.getElementById("add-submit").style.display = 'none';

			delete_submit(next_state_index);
		}
		else {
			modal = document.getElementById("modal-body");
			var info = document.createElement("h6");
			info.id = "infoId";
			info.textContent = "Cannot remove this layer!";
			modal.appendChild(info);

			document.getElementById("add-submit").style.display = 'none';
		}
	}
}

function delete_submit(next_index) {
	changeState(next_index)
}

function add_submit() {
	var next_index = document.getElementById("select-layer").value;

	diff = data[next_index]['arc'].filter(x => !state.layerNames.includes(x) );
	new_layer_name = diff
	//console.log(state.layerNames);
	//console.log(data[next_index]['arc']);
	console.log(diff);
	//new_layer_name = document.getElementById("select-layer").textContent;
	//console.log('Prev Layer Name:', new_layer_name);

	document.getElementById("select-layer").remove();
	document.getElementById("label-select").remove();
	changeState(next_index);
}

function close_modal() {
	if (document.getElementById("select-layer")){
		document.getElementById("select-layer").remove();
	}
	if (document.getElementById("label-select")) {
		document.getElementById("label-select").remove();
	}
	if (document.getElementById("infoId")){
		document.getElementById("infoId").remove();
	} 
	document.getElementById("add-submit").style.display = 'block';
}

function draw(index) {

	d3.select("#scatterplot-svg").remove();
	d3.select("#architecture-svg").remove();
	d3.select("#lineChart-svg").remove();

	var architecture_svg = d3.select("#neuralNet").append("svg")
	.attr("id","architecture-svg")
	.attr("width", width)
	.attr("height", height);

	// console.log("drawing   " + new Date());
	networkGraph = buildNodeGraph();
	//buildNodeGraph();
	drawGraph(networkGraph, architecture_svg);

	var scatterplot_svg = d3.select("#scatterplot")
	.append("svg")
		.attr("width", scatter_width + scatter_margin.left + scatter_margin.right)
		.attr("height", scatter_height + scatter_margin.top + scatter_margin.bottom)
		.attr("id", "scatterplot-svg")
	.append("g")
		.attr("transform", "translate(" + scatter_margin.left + "," + scatter_margin.top + ")");
	drawScatterChart(index, scatterplot_svg);

	drawLineChart(index);

	updateTableRandom(index, new_layer_name);
}

function init(index) {
	resetTable();
	draw(index);
}

function initState(current_data) {
	play = false;
	data = current_data;
	var architecture = data[0];
	new_layer_name = 'None'
	state.layerNames = architecture["arc"];
	state.currentIndex = 0;
	state.inputLayerHeight = 3;
	state.outputLayerHeight = 3;

	state.hiddenLayersCount = state.layerNames.length - 2;
	state.hiddenLayersDepths = [];
	state.layersCount = state.hiddenLayersCount+2;
	for (i=0; i<state.layerNames.length; i++){
		state.hiddenLayersDepths.push(5);
	}

	var next_options = data[0]["options"];
	var next_options_indexes = data[0]["option_indexes"];

	state.next_layer_options = next_options;
	state.next_options_indexes = next_options_indexes;

	state.delete_options = data[0]["delete_pos"];
	state.mode = document.getElementById("layerOp").value;

	rand_arch = [];
	evol_arch = [];
	index_till_now = [];
	map_data();

	lastState=null;
	bestLayerAdded="";
	largestTestDelta=0;
	//var bestModelYet=null;
	bestModelTest=data[0]["best_test"];
}

function changeState(index) {
	
	if (state.mode == "1") {
		diff = data[index]['arc'].filter(x => !state.layerNames.includes(x) );
		new_layer_name = diff;
		console.log("YEESSS: ",diff);
	}

	var architecture = data[index];

	state.layerNames = architecture["arc"];
	state.currentIndex = index;
	state.hiddenLayersCount = state.layerNames.length - 2;
	state.hiddenLayersDepths = [];
	state.layersCount = state.hiddenLayersCount+2;
	for (i=0; i<state.layerNames.length; i++){
		state.hiddenLayersDepths.push(5);
	}

	var next_options = data[index]["options"];
	var next_options_indexes = data[index]["option_indexes"];

	state.delete_options = data[index]["delete_pos_non_null"];
	state.next_layer_options = next_options;
	state.next_options_indexes = next_options_indexes;

	draw(index);
}

function readTextFile(file, callback) {
	var rawFile = new XMLHttpRequest();
	rawFile.overrideMimeType("application/json");
	rawFile.open("GET", file, true);
	rawFile.onreadystatechange = function() {
		if (rawFile.readyState === 4 && rawFile.status == "200") {
			callback(rawFile.responseText);
		}
	}
	rawFile.send(null);
}

function drawScatterChart(index, scatterplot_svg){
	drawRandomChart(index, scatterplot_svg)
}

function drawRandomChart(index, scatterplot_svg){
	// console.log(index);
	console.log(data[index])
	if (!index_till_now.includes(parseInt(index))){
		index_till_now = index_till_now.concat(parseInt(index));
		rand_arch = rand_arch.concat(data[index]);
		console.log("arch data",rand_arch);
		// console.log("index_till_now",index_till_now);
	}
	else{
		console.log("Already present");
	}

	

    // create svg element, respecting margins
    
	
	const xScale = d3.scaleLinear()
						.domain([d3.min(rand_arch, d => d.best_valid)-1, d3.max(rand_arch, d => d.best_valid)+1]) // data space
						.range([0, scatter_width]); // pixel space
	const yScale = d3.scaleLinear()
					.domain([d3.min(rand_arch, d => d.best_test)-0.4, d3.max(rand_arch, d => d.best_test)]) // data space
					.range([scatter_height, 0 ]); // pixel space

	// Extent gets the "min" and "max" values and returns as an array of size 2.
	const colorExtent = d3.extent(random_data, d => d.best_test);
	// This is how you do a manual color scale
	const colorScaleManual = d3.scaleLinear()
								.domain(colorExtent)
								.range(['lightblue','magenta']);
	// This is how you do a pre-built scale, by using d3.scaleSequential.
	const colorScaleProvided = d3.scaleSequential(d3.interpolateWarm).domain([20,80])
								.domain(colorExtent);
		
	/* scatterplot_svg.select('g').remove();
								
	/*
	8. Draw the scatter plot circles.    
	*/
	/* g = scatterplot_svg.append('g')
				.attr('transform', 'translate('+scatter_margin.left+', '+scatter_margin.top+')');;  */

	var div = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);           
	scatterplot_svg.selectAll('circle')
	.data(rand_arch)
	.enter()
	.append('circle')
	.style('fill', d => colorScaleProvided(d.best_test))
	.on("mouseover", function (d, i) {
		d3.select(this).transition()
			.duration('100')
			.attr("r", d => xScale(d.best_valid)/15)
			//Makes div appear
		div.transition()
			.duration(100)
			.style("opacity", 1)
		div.html("No. of Layers : "+(d.arc.length-2) + "<br>Test Accuracy : "+d3.format(".2f")(d.best_test)+'%'+"<br>Validation Accuracy : "+d3.format(".2f")(d.best_valid)+'%')
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 15) + "px");})
	.on("mouseout", function (d, i) {
		d3.select(this).transition()
			.duration('200')
			.attr("r", d => xScale(d.best_valid)/20)
			//makes div disappear
		div.transition()
			.duration(600)
			.style("opacity", 0);})
	.on("click", function(d,i) {
		changeState(d["index"])
		//disappear
		div.transition()
			.duration(600)
			.style("opacity", 0);})
	.transition()

	.delay(function(d,i) {return i * 100 })
	.style("opacity", 0.45)
	.ease(d3.easeBounce)
	.attr('cx', d => xScale(d.best_valid))
	.attr('cy', d => yScale(d.best_test))
	.attr('r',d => xScale(d.best_valid)/20);



	//  .style('opacity',.6)    // you can uncomment this line to make the points semi-opaque, but it can lead to separability issues with the color scale
	//.style('fill', d => colorScaleManual(d.best_test))

	/*
	9. Add a gradient colorscale legend.
	*/
	const linearGradient = scatterplot_svg.append("defs")
	.append("linearGradient")
	.attr("id", "linear-gradient");
	linearGradient.selectAll("stop")
				.data(colorScaleProvided.ticks()
				.map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScaleProvided(t) })))
		.enter().append("stop")
		.attr("offset", d => d.offset)
		.attr("stop-color", d => d.color);
		scatterplot_svg.append('g')
		.append("rect")
		.attr('transform', 'translate(0, -40)')
		.attr("width", 200)
		.attr("height", 20)
		.style("fill", "url(#linear-gradient)");
	const colorAxis = d3.axisBottom(d3.scaleLinear()
									.domain(colorScaleProvided.domain())
									.range([0,200]))
									.ticks(5).tickSize(-10);
	scatterplot_svg.append('g').call(colorAxis)
				.attr('class','colorLegend')
				.attr('transform','translate(0,-20)')
				.attr('color','white');

	/*
	10. Draw the scatterplot's x and y axes and add label axes
	*/
	const yAxis = d3.axisLeft(yScale);
	scatterplot_svg.append('g').call(yAxis)
	.attr('font-size',12)
	.attr('color','white');
	const xAxis = d3.axisBottom(xScale).ticks(5);
	scatterplot_svg.append('g').call(xAxis)
					.attr('transform',`translate(0,${scatter_height})`)
					.attr('font-size',12)
					.attr('color','white');
	scatterplot_svg.append('text')
		.attr("text-anchor",'end')
		.attr('x',scatter_width/2+80)
		.attr('y',scatter_height + scatter_margin.top-5	)
		.attr('font-size',15)
		.style('fill', 'white')
		.text('Validation Accuracy (%)');
	scatterplot_svg.append('text')
		.attr('transform','rotate(-90)')
		.attr('y',-scatter_margin.left+10)
		.attr('x',-scatter_height/2 -65)
		.attr('font-size',15)
		.style('fill', 'white')
		.text('Test Accuracy (%)' )
		
}

function drawLineChart(index){

	//rand_arch = rand_arch.concat(random_data[index]);
    // set the dimensions and margins of the graph
	
    var linechart_margin = {top: 20, right: 20, bottom: 40, left: 60},
    linechart_width = width_scatterplot - linechart_margin.left - linechart_margin.right,
    linechart_height = height_scatterplot - linechart_margin.top - linechart_margin.bottom;

    // create svg element, respecting margins
    var linechart_svg = d3.select("#lineChart")
      .append("svg")
          .attr("width", linechart_width + linechart_margin.left + linechart_margin.right)
          .attr("height", linechart_height + linechart_margin.top + linechart_margin.bottom)
		  .attr("id", "lineChart-svg")
      .append("g")
          .attr("transform", "translate(" + linechart_margin.left + "," + linechart_margin.top + ")");

    // Add X axis
  var x = d3.scaleLinear().domain([0,rand_arch.length - 1]).range([0, linechart_width]);
  linechart_svg.append("g")
      .attr("transform", "translate(0," + linechart_height + ")")
      .call(d3.axisBottom(x).ticks(rand_arch.length - 1))
	  .attr('color','white')
	  .attr('font-size',12);

    // Add Y axis
  var y = d3.scaleLinear().domain([d3.min(rand_arch, d => d.best_test)-1, d3.max(rand_arch, d => d.best_test)+1]).range([ linechart_height, 0 ]);
  linechart_svg
      .append("g")
      .call(d3.axisLeft(y))
	  .attr('color','white')
	  .attr('font-size',12);

   // Add X axis label:
  linechart_svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", linechart_width/2+80)
        .attr("y", linechart_height + linechart_margin.top + 15)
		.style('fill', 'white')
		.attr('font-size',15)
        .text("Evolution Stages");

    // Y axis label:
  linechart_svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -linechart_margin.left+10)
        .attr("x", -linechart_margin.top-15)
		.style('fill', 'white')
		.attr('font-size',15)
        .text("Test Accuracy (%)")

   
  const transitionPath = d3.transition()
                          .ease(d3.easeSin)
                          .duration(2500);

  const line = d3.line()
                  .x(function(d) { return x(rand_arch.indexOf(d))})
                  .y(function(d) { return y(d.best_test) })

  // Add dots
  // console.log(data)


  // const path = grp
  //         .append("path")
  //         .datum(data)
  //         .attr("fill", "none")
  //         .attr("stroke", "steelblue")
  //         .attr("stroke-linejoin", "round")
  //         .attr("stroke-linecap", "round")
  //         .attr("stroke-width", 1.5)
  //         .attr("d", line);

  linechart_svg.append("path")
      .datum(rand_arch)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 1.5)
      .attr("d", line)


	  var div = d3.select("body").append("div")
	  .attr("class", "tooltip")
	  .style("opacity", 0);
  linechart_svg.append('g')
      .selectAll("dot")
      .data(rand_arch)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return x(rand_arch.indexOf(d)); } )
      .attr("cy", function (d) { return y(d.best_test) ; } )
      .attr("r", 5)
      .style("fill", "#00cb9c")
	  .on("click", function(d,i) {
		changeState(d["index"])
		//disappear
		div.transition()
			.duration(600)
			.style("opacity", 0);})
	  .on("mouseover", function (d, i) {
		d3.select(this).transition()
			.duration('100')
			.attr("r", 8)
			//Makes div appear
		div.transition()
			.duration(100)
			.style("opacity", 1)
		div.html("Evolution Stage : "+ d.index + "<br>Test Accuracy : "+d3.format(".2f")(d.best_test)+'%')
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 15) + "px");})
	.on("mouseout", function (d, i) {
		d3.select(this).transition()
			.duration('200')
			.attr("r", 6)
			//makes div disappear
		div.transition()
			.duration(600)
			.style("opacity", 0);})
}


function updateTableRandom(newState,changedLayer){
	valDelta=0;
	testDelta=0;
	if(lastState!=null){
		document.getElementById("valDelta").innerHTML=Number.parseFloat(random_data[newState]["best_valid"]-random_data[lastState]["best_valid"]).toFixed(3);
		var testVal=Number.parseFloat(random_data[newState]["best_test"]).toFixed(3);
		var testDelta=Number.parseFloat(testVal-random_data[lastState]["best_test"]).toFixed(3);
		document.getElementById("testDelta").innerHTML=testDelta;
		if(testDelta>largestTestDelta){
			largestTestDelta=testDelta;
			document.getElementById("bestLayer").innerHTML=changedLayer;
		}
		if(testVal>bestModelTest){
			bestModelTest=testVal;
			document.getElementById("bestModel").innerHTML=random_data[newState]["arc"];
		}
	}	
	lastState=newState;
}
function updateTableEvolution(newState,changedLayer){
	console.log(changedLayer);
	valDelta=0;
	testDelta=0;
	if(lastState!=null){
		document.getElementById("valDelta").innerHTML=Number.parseFloat(evol_data[newState]["best_valid"]-evol_data[lastState]["best_valid"]).toFixed(3);
		var testVal=Number.parseFloat(evol_data[newState]["best_test"]).toFixed(3);
		var testDelta=Number.parseFloat(testVal-evol_data[lastState]["best_test"]).toFixed(3);
		document.getElementById("testDelta").innerHTML=testDelta;
		if(testDelta>largestTestDelta){
			largestTestDelta=testDelta;
			document.getElementById("bestLayer").innerHTML=changedLayer;
		}
		if(testVal>bestModelTest){
			bestModelTest=testVal;
			document.getElementById("bestModel").innerHTML=evol_data[newState]["arc"];
		}
	}	
	lastState=newState;
}
function resetTable(){
	//please call this when you are swapping datasets/NAS types or otherwise want to reset the table
	bestModelTest=data[0]["best_test"];
	largestTestDelta=0;
	document.getElementById("bestLayer").innerHTML = NA;
	document.getElementById("bestModel").innerHTML = data[0]["arc"];
	document.getElementById("valDelta").innerHTML = NA;
	document.getElementById("testDelta").innerHTML = NA;
}

function change_data(){
	data_selected = document.getElementById("dataSelect").value;

	if (data_selected == "random_data") {
		initState(random_data);
		init(0);
	}
	else {
		initState(evolution_data);
		init(0);
	}
}
var repeater;
function play_pause() {
	if (play == false) {
		play = true;

		document.getElementById("play").innerHTML = "Pause";

		repeater = setInterval(function() {
			changeState(state.currentIndex + 1);
		}, 2000);
	}

	else {
		play = false;
		document.getElementById("play").innerHTML = "Play";

		clearInterval(repeater);
	}
}