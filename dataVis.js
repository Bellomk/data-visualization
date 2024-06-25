// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel, data, x, y;
let channels = ["scatterX", "scatterY", "size"]; // Define channels here
// TO do
// *fix the legends column that corresponds to the chosen axis: in cars we have: point.Name  
// *fix the initialization: after changing the dataset all the data vis should be reset
// * add a filter of number of rows, visible number of rows

function init() {
    // define size of plots
    margin = {top: 20, right: 20, bottom: 20, left: 50};
    width = 600;
    height = 500;
    radius = width / 2;

    // Start at default tab
    document.getElementById("defaultOpen").click();

    // data table
    dataTable = d3.select('#dataTable');

    // scatterplot SVG container and axes
    scatter = d3.select("#sp").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // radar chart SVG container and axes
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    // read and parse input file
    let fileInput = document.getElementById("upload"), readFile = function () {

        // clear existing visualizations
        clear();

        let reader = new FileReader();
        reader.onloadend = function () {
            // Parse CSV data using d3-dsv
            let csvData = reader.result;
            let parsedData = d3.csvParse(csvData, d3.autoType);

            // Extract numerical attributes and store them in the dimensions array
            dimensions = Object.keys(parsedData[0]).filter(key => !isNaN(parsedData[0][key]));

                       
            // Call the initVis function with the parsed data
            initVis(parsedData);
            CreateDataTable(parsedData);
        };
        reader.readAsBinaryString(fileInput.files[0]);
    };
    fileInput.addEventListener('change', readFile);
}

function initVis(_data) {
    data = _data;

    // y scalings for scatterplot
    y = d3.scaleLinear()
        .range([height - margin.bottom - margin.top, margin.top]);

    // x scalings for scatter plot
    x = d3.scaleLinear()
        .range([margin.left, width - margin.left - margin.right]);

    // scatterplot axes
    yAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ")")
        .call(d3.axisLeft(y));

    yAxisLabel = yAxis.append("text")
        .style("text-anchor", "middle")
        .attr("y", margin.top / 2)
        .text("x");

    xAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + (height - margin.bottom - margin.top) + ")")
        .call(d3.axisBottom(x));

    xAxisLabel = xAxis.append("text")
        .style("text-anchor", "middle")
        .attr("x", width - margin.right)
        .text("y");

    // radar chart axes
    radarAxesAngle = Math.PI * 2 / dimensions.length;
    let axisRadius = d3.scaleLinear()
        .range([0, radius]);
    let maxAxisRadius = 0.75,
        textRadius = 0.8;
    gridRadius = 0.1;

    // radar axes
    radarAxes = radar.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis");

    radarAxes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return radarX(axisRadius(maxAxisRadius), i); })
        .attr("y2", function(d, i){ return radarY(axisRadius(maxAxisRadius), i); })
        .attr("class", "line")
        .style("stroke", "black");
    
    // TODO: render grid lines in gray

    // TODO: render correct axes labels
    radar.selectAll(".axisLabel")
        .data(dimensions)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return radarX(axisRadius(textRadius), i); })
        .attr("y", function(d, i){ return radarY(axisRadius(textRadius), i); })
        .text("dimension");


    channels.forEach(function(c){
        initMenu(c, dimensions);
    });

    channels.forEach(function(c){
        refreshMenu(c);
    });

    renderScatterplot();
    renderRadarChart(); // Uncomment if radar chart implementation is needed
}

function clear() {
    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
    dataTable.selectAll("*").remove();
}

function CreateDataTable(_data) {
    if (!_data || _data.length === 0) {
        console.error("No data available to create table");
        return;
    }

    dataTable.selectAll("*").remove();

    let table = dataTable.append("table").attr("class", "dataTableClass");

    let headers = table.append("thead").append("tr");
    headers.selectAll("th")
        .data(Object.keys(_data[0]))
        .enter()
        .append("th")
        .attr("class", "tableHeaderClass")
        .text(d => d);

    let rows = table.append("tbody").selectAll("tr")
        .data(_data)
        .enter()
        .append("tr")
        .attr("class", "tableBodyClass");

    let cells = rows.selectAll("td")
        .data(d => Object.values(d))
        .enter()
        .append("td")
        .attr("class", "tableBodyClass")
        .text(d => d)
        .on("mouseover", function() {
            d3.select(this).style("background-color", "lightgrey");
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "white");
        });
}


///--------------------Scatterplot chart ---------------------------------------------

function renderScatterplot() {
    let xVar = readMenu('scatterX');
    let yVar = readMenu('scatterY');
    let sizeVar = readMenu('size');

    x.domain(d3.extent(data, d => d[xVar])).nice();
    y.domain(d3.extent(data, d => d[yVar])).nice();

    let size = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[sizeVar]))
        .range([3, 10]);

    let opacity = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[sizeVar]))
        .range([0.3, 1]);

    xAxis.call(d3.axisBottom(x));
    yAxis.call(d3.axisLeft(y));

    xAxisLabel.text(xVar);
    yAxisLabel.text(yVar);

    let circles = scatter.selectAll(".dot")
        .data(data);

    circles.enter().append("circle")
        .attr("class", "dot")
        .merge(circles)
        .attr("cx", d => x(d[xVar]))
        .attr("cy", d => y(d[yVar]))
        .attr("r", d => size(d[sizeVar]))
        .style("fill", d => selectedPoints.has(d) ? selectedPoints.get(d) : "black") // Apply selected color or default
        .style("fill-opacity", d => opacity(d[sizeVar]))
        .on("click", handlePointClick); // click event listener 

    circles.exit().remove();
}

///-----------------------Select the points and display them in the legend----------------------
let selectedPoints = new Map();
let maxSelectedPoints = 10; // maximum points to select
let colors = d3.schemeCategory10; // color scheme for the selected points

function handlePointClick(event, d) {
    if (selectedPoints.has(d)){
        selectedPoints.delete(d);
        d3.select(event.target).style("fill", "black");
    } else if (selectedPoints.size < maxSelectedPoints) {
        if (!selectedPoints.has(d)) {
            let color = colors[selectedPoints.size];
            selectedPoints.set(d, color);
            d3.select(event.target).style("fill", color);
        }
    } else {
        alert(`You can only select up to ${maxSelectedPoints} points.`);
    }
    updateLegend(); // Call updateLegend to refresh the legend
    renderRadarChart();
}


function updateLegend() {
    // Remove existing legend
    d3.select("#legend").selectAll("*").remove();

    // Append legend items for selected points
    selectedPoints.forEach((color, point) => {
        let legendItem = d3.select("#legend").append("div")
            .style("color", color)
            .style("align-items", "center");

        legendItem.append("div")
            .style("width", "10px")
            .style("height", "10px")
            .style("background-color", color)
            .style("margin-right", "5px");

        legendItem.append("span")
            .text(point.Name); // Display the point's name or ID in the legend

        legendItem.append("span")
            .attr("class", "close")
            .text("x")
            .on("click", () =>{
                selectedPoints.delete(point);
                renderScatterplot();
                updateLegend();
            });
    });
}





///-----------------------RADAR CHART------------------------------------------------------------

function renderRadarChart() {
    radar.selectAll(".line").remove(); // Clear previous lines

    let axisRadius = d3.scaleLinear().range([0, radius]);
    selectedPoints.forEach((color, point) => {
        let lineData = dimensions.map((dim, i) => ({
            angle: i * radarAxesAngle,
            value: point[dim],
            radius: axisRadius(point[dim])
        }));

        let line = d3.lineRadial()
            .angle(d => d.angle)
            .radius(d => d.radius);

        radar.append("path")
            .datum(lineData)
            .attr("class", "line")
            .attr("d", line)
            .style("stroke", color)
            .style("fill", "none");
    });
}

 function radarX(radius, index){
    return radius * Math.cos(radarAngle(index));
}

function radarY(radius, index){
    return radius * Math.sin(radarAngle(index));
}

function radarAngle(index){
    return radarAxesAngle * index - Math.PI / 2;
}
///----------------------------------------------------------------------------------------------
function initMenu(id, entries) {
    $("select#" + id).empty();

    entries.forEach(function (d) {
        $("select#" + id).append("<option>" + d + "</option>");
    });

    $("#" + id).selectmenu({
        select: function () {
            renderScatterplot();
        }
    });
}

function refreshMenu(id) {
    $("#" + id).selectmenu("refresh");
}

function readMenu(id) {
    return $("#" + id).val();
}

function openPage(pageName, elmnt, color) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = color;
}
document.getElementById("defaultOpen").click();
