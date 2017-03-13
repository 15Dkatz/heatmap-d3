// create an object which maps the subsection of data

var sections = {
  0: {
    title: 'global',
    path: './data/data.json'
  },
  1: {
    title: 'Western Addition',
    path: './data/western.json'
  },
  2: {
    title: 'Presidio',
    path: './data/presidio.json'
  },
  3: {
    title: 'Lone Mountiain/USF',
    path: './data/lone.json'
  },
  4: {
    title: 'Inner Richmond',
    path: './data/inner.json'
  },
  5: {
    title: 'Haight Ashbury',
    path: './data/haight.json'
  }
}

function renderd3(section) {
  // var svgList = document.getElementById("heat-map");
  //
  // console.log('svgList.childNodes.length', svgList.childNodes.length);
  //
  // if (svgList.childNodes.length > 0) {
  //   svgList.removeChild(svgList.childNodes[0]);
  //   svgList.removeChild(svgList.childNodes[1]);
  //   // svgList.removeChild(svgList.childNodes[2]);
  // }

  var config = {
    svg: {
      width: 1000,
      height: 400
    },
    margin: {
      top: 50,
      right: 5,
      bottom: 20,
      left: 150
    }
  };

  config.plot = {
    width: config.svg.width - config.margin.right - config.margin.left,
    height: config.svg.height - config.margin.top - config.margin.bottom
  }

  config.legend = {
    width: 200,
    height: 15
  }

  // legend configs

  var svg = d3.select("#heat-map")
    .attr("width", config.svg.width)
    .attr("height", config.svg.height)
    .attr("id", "heat-map");

  svg.selectAll("*").remove();

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

  // change source depending argument
  console.log('sections', sections);
  console.log('section', section);
  var data_path = sections[section].path;
  d3.text(data_path, dataCallback);

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

    //  console.log('nest', data);


     var hours = data.keys();
     var hoods = data.get(hours[0]).keys();

    //  console.log('hours', hours, 'hoods', hoods);

     xScale.domain(hours);
     yScale.domain(hoods);


     var values = data.values();

     values = values.map(function(d) {
       return d.values();
     });

     values = d3.merge(values);

     var extent = d3.extent(values);

    //  console.log('extent', extent);

     colorScale.domain(extent);

     drawBackground();
     drawMap();
     drawTitle();
     drawLegend();
  }

  function drawBackground() {
    plot.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", config.plot.width)
      .attr("height", config.plot.height)
      .style("fill", "#e0e0e0");
  }

  function hour(x) {
    x = x === 0 ? '12am' : x;
    x = x < 12 ? x + 'am' : x;
    x = x === 12 ? x + 12 : x;
    x = x >= 12 ? x-12 + 'pm' : x;
    return x;
  }

  function drawMap() {
    var xAxis = d3.axisBottom(xScale)
      .tickPadding(0)
      .tickFormat(function(d, i) {
        return hour(i);
      })

    var yAxis = d3.axisLeft(yScale)
      .tickPadding(0);

    plot.append("g")
      .attr("id", "x-axis")
      .attr("class", "axis")
      .attr("transform", translate(0, config.plot.height))
      .call(xAxis)
      .selectAll(".tick text")
      .attr("class", "x-tick");

    plot.append("g")
      .attr("id", "y-axis")
      .attr("class", "axis")
      .call(yAxis)
      .selectAll(".tick text")
      .attr("class", "y-tick");

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
        // console.log("d", d);
        var x = d.key * xScale.bandwidth();
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
        return colorScale(d.value);
      })
    // console.log('count post color', count);
  }

  function drawTitle() {
    var title = svg.append("text")
      .text("Avg. Response Time By Neighborhood Throughout the Day")
      .attr("id", "title")
      .attr("x", config.margin.left)
      .attr("y", 20)
      .attr("dx", 0)
      .attr("dy", "18px")
      .attr("text-anchor", "left")
      .attr("font-size", "18px");
  }

  function drawLegend() {
    var percentScale = d3.scaleLinear()
      .domain([0, 100])
      .range(colorScale.domain());

    // defs?
    svg.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .selectAll("stop")
      .data(d3.ticks(0, 100, 5))
      .enter()
      .append("stop")
      .attr("offset", function(d) {
        return d + "%"
      })
      .attr("stop-color", function(d) {
        return colorScale(percentScale(d));
      })

    var legend = svg.append("g")
      .attr("id", "legend")
      .attr("transform", translate(780, 18));

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("fill", "url(#gradient)")
      .attr("width", config.legend.width)
      .attr("height", config.legend.height)

    var legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, config.legend.width])

    var legendAxis = d3.axisBottom(legendScale)
      .tickFormat(function(d) {
        return d+'m';
      })
      .tickValues(colorScale.domain())
      .tickSize(4);

    legend.append("g")
      .attr("id", "color-axis")
      .attr("class", "legend")
      .attr("transform", translate(0, config.legend.height))
      .call(legendAxis)
  }
}



function changeData(x) {
  console.log('change data', x);
  renderd3(x);
}

renderd3(0);
