var config = {
  svg: {
    width: 1060,
    height: 500
  },
  margin: {
    top: 50,
    right: 10,
    bottom: 20,
    left: 100
  }
};

config.plot = {
  width: config.svg.width - config.margin.right - config.margin.left,
  height: config.svg.height - config.margin.top - config.margin.bottom
}

console.log('config', config);

// legend configs

var svg = d3.select("body").append("svg")
  .attr("width", config.svg.width)
  .attr("height", config.svg.height);

var translate = function(x, y) {
  return "translate(" + x + "," + y + ")";
};

var plot = svg.append("g")
  .attr("id", "plot")
  .attr("transform", translate(config.margin.left, config.margin.top));

var xScale = d3.scaleBand()
  .range([0, config.plot.width]);


var yScale = d3.scaleBand()
  .range([config.plot.height, 0], 0, 0);

// var altYScale = function(x) {
//   var separation = plot.height /
// }


console.log('config.plot', config.plot);

// TODO change color scale to the blue default
var colorScale = d3.scaleSequential(d3.interpolateViridis);

function rowAccessor(d) {
  var row = {};
  row.hour  = d["Hour of Response DtTm"];
  row.hood  = d["Neighborhood District"];
  row.value = d["Avg. Avg.Response.Time"];
  return row;
}

// make data global
var data = [];
var dataJSON = [];

d3.text('./data.json', dataCallback);

function dataCallback(error, data_json) {
  dataJSON = JSON.parse(data_json).reverse();
  data = dataJSON;
  // console.log('data', data);

  // group by hours
  data = d3.nest()
   .key(function(d) {
     d = rowAccessor(d);
     return d.hour;
   })
   // group by neighborhood
   .key(function(d) {
     d = rowAccessor(d);
     return d.hood;
   })
   // TODO test if this should just return the count
   // or if this should be d3.avg or something instead of d3.sum
   .rollup(function(values) {
     return d3.sum(values, function(d) {
       d = rowAccessor(d);
       return d.value;
     })
   })
   .map(data, d3.map);

   console.log('nest', data);


   var hours = data.keys();
   var hoods = data.get(hours[0]).keys();

   console.log('hours', hours, 'hoods', hoods);

   xScale.domain(hours);
   yScale.domain(hoods);


   var values = data.values();

   values = values.map(function(d) {
     return d.values();
   });

   values = d3.merge(values);

   var extent = d3.extent(values);

   console.log('extent', extent);

   colorScale.domain(extent);

   drawBackground();
   drawMap();
}

function drawBackground() {
  plot.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", config.plot.width)
    .attr("height", config.plot.height)
    .style("fill", "white");
}

function drawMap() {
  var xAxis = d3.axisBottom(xScale)
    .tickPadding(0);

  var yAxis = d3.axisLeft(yScale)
    .tickPadding(0);

  plot.append("g")
    .attr("id", "x-axis")
    .attr("class", "axis")
    .attr("transform", translate(0, config.plot.height))
    .call(xAxis);

  plot.append("g")
    .attr("id", "y-axis")
    .attr("class", "axis")
    .call(yAxis);

  var count = 0;

  var rows = plot.append("g")
    .attr("id", "heatmap")
    .attr("class", "cell")
    .selectAll("g")
    .data(data.entries())
    .enter()
    .append("g")
    .attr("id", function(d) {
      return d.key;
    })
    .attr("transform", function(d, i) {
      console.log("d", d);
      // var y = i*yScale.bandwidth();
      var x = d.key * xScale.bandwidth();
      // count++;
      // console.log('i', i, 'd', d);
      return translate(x, 0);
    })

  var key = 0;

  var cells = rows.selectAll("rect")
    .data(function(d) {
      return d.value.entries();
    })
    .enter()
    .append("rect")
    .attr("x", function(d) {
      // console.log('d', d);
      key = d.key;
      return xScale(key);
    })
    .attr("y", 0)
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("transform", function(d, i) {
      var y = i*yScale.bandwidth();
      var x = 0;
      count++;
      // console.log('i', i, 'd', d);
      return translate(x, y);
    })
    .attr("fill", function(d) {
      // console.log('color', colorScale(d.value))

      return colorScale(d.value);
    })
  console.log('count post color', count);
}
