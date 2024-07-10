let xAxis, yAxis, xAxisLabel, yAxisLabel, data, x, y;
let channels = ["scatterX", "scatterY", "size"]; // Define channels here
let selectedPoints = new Map(); // Map to keep track of selected points
var parsedData;
function init() {
    // define size of plots
    margin = {top: 10, right: 10, bottom: 10, left: 50};
    width = 600;
    height = 600;
    radius = Math.min(width, height) / 2;

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
        .attr("width", width)  // Adjust width as necessary
        .attr("height", height)  // Adjust height as necessary
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // read and parse input file
    let fileInput = document.getElementById("upload"), readFile = function () {
        clear();
        let reader = new FileReader();
        reader.onloadend = function () {
            let csvData = reader.result;
            parsedData = d3.csvParse(csvData, d3.autoType);
            dimensions = Object.keys(parsedData[0]).filter(key => !isNaN(parsedData[0][key]));
            initVis(parsedData);
            initDashboard(parsedData);
            CreateDataTable(parsedData);
        };
        reader.readAsBinaryString(fileInput.files[0]);
    };
    fileInput.addEventListener('change', readFile);
}

function getParsedData () {
    return parsedData;
}

function initVis(_data) {
    data = _data;
    y = d3.scaleLinear().range([height - margin.bottom - margin.top, margin.top]);
    x = d3.scaleLinear().range([margin.left, width - margin.left - margin.right]);

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

    radarAxesAngle = Math.PI * 2 / dimensions.length;

    gridRadius = 0.1;

    // Initialize menu for the visual channels
    channels.forEach(function(c){
        initMenu(c, dimensions);
    });

    channels.forEach(function(c){
        refreshMenu(c);
    });

    renderScatterplot();
    renderRadarGrid();
    renderRadarAxes();
}

// clear visualizations before loading a new file
function clear(){
    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
    dataTable.selectAll("*").remove();
}

//------------------**TABLE CREATION**---------------------------------------
function CreateDataTable(_data) {
   

    let tableContainer = document.getElementById("dataTable");
    let table = document.createElement("table");
    table.classList.add("dataTableClass");
    tableContainer.appendChild(table);

    let headers = Object.keys(_data[0]);
    let thead = table.createTHead();
    let headerRow = thead.insertRow();
    headers.forEach(headerText => {
        let th = document.createElement("th");
        th.textContent = headerText;
        th.classList.add("tableHeaderClass");
        headerRow.appendChild(th);
    });

    let tbody = document.createElement("tbody");
    _data.forEach(rowData => {
        let row = tbody.insertRow();
        headers.forEach(header => {
            let cell = row.insertCell();
            cell.textContent = rowData[header];
            cell.classList.add("tableBodyClass");
        });
    });
    table.appendChild(tbody);

    tbody.addEventListener("mouseover", function(event) {
        let targetCell = event.target.closest("td");
        if (targetCell) {
            targetCell.classList.add("hovered-cell");
        }
    });

    tbody.addEventListener("mouseout", function(event) {
        let targetCell = event.target.closest("td");
        if (targetCell) {
            targetCell.classList.remove("hovered-cell");
        }
    });
}
//------------------**LEGEND**-------------------------------
function updateLegend() {
    // Remove existing legend items
    d3.select("#legend").selectAll("*").remove();

    // Append legend items for selected points
    selectedPoints.forEach((color, point) => {
        let legendItem = d3.select("#legend").append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("cursor", "pointer");

        legendItem.append("div")
            .style("width", "20px")
            .style("height", "20px")
            .style("background-color", color)
            .style("margin-right", "5px");

        legendItem.append("span")
            .text(point.LOCATIONS);

        // Add "x" button to remove the item
        legendItem.append("span")
            .text(" x")
            .attr("class", "close")
            .style("margin-left", "10px")
            .style("color", "black")
            .style("cursor", "pointer")
            .on("click", () => toggleLegendItem(point));
    });
}

function toggleLegendItem(point) {
    if (selectedPoints.has(point)) {
        selectedPoints.delete(point);
        // Reset the color of the corresponding point in the scatter plot to black
        scatter.selectAll(".dot")
            .filter(d => d === point)
            .style("fill", "black");
    } else if (selectedPoints.size < maxSelectedPoints) {
        let color = colors[selectedPoints.size];
        selectedPoints.set(point, color);
        // Set the color of the corresponding point in the scatter plot
        scatter.selectAll(".dot")
            .filter(d => d === point)
            .style("fill", color);
    } else {
        alert(`You can only select up to ${maxSelectedPoints} points.`);
    }
    updateLegend(); // Call updateLegend to refresh the legend
    renderRadarChart();
}

function handlePointClick(d, element) {
    if (selectedPoints.has(d)) {
        selectedPoints.delete(d);
        element.style("fill", "black");
    } else {
        let color = d3.schemeCategory10[selectedPoints.size % 10];
        selectedPoints.set(d, color);
        element.style("fill", color);
    }
    updateLegend();
    renderRadarChart(); // Update radar chart when a point is clicked
}

//-----------------------**SCATTERPLOT**----------------------------

function renderScatterplot() {
    let xAttribute = readMenu("scatterX");
    let yAttribute = readMenu("scatterY");
    let sizeAttribute = readMenu("size");

    // Calculate the domain for x and y scales based on the data
    let xExtent = d3.extent(data, d => d[xAttribute]);
    let yExtent = d3.extent(data, d => d[yAttribute]);

    // Add some padding to extend the domain and accommodate negative values
    let padding = 100;

    // Adjust x domain to include negative and positive values
    let xDomain = [
        Math.min(xExtent[0], 0) - padding,
        Math.max(xExtent[1], 0) + padding
    ];

    // Adjust y domain to include negative and positive values
    let yDomain = [
        Math.min(yExtent[0], 0) - padding,
        Math.max(yExtent[1], 0) + padding
    ];

    x.domain(xDomain).nice();
    y.domain(yDomain).nice();

    // Update the axes with the new scales
    xAxis.transition().duration(900).call(d3.axisBottom(x));
    yAxis.transition().duration(900).call(d3.axisLeft(y));

    // Add padding to the x-axis text
    xAxis.selectAll("text")
        .attr("dx", "10px")
        .attr("dy", "10px");

    // Add padding to the y-axis text
    yAxis.selectAll("text")
        .attr("dx", "-10px")
        .attr("dy", "10px");

    // Create a size scale for the scatterplot points
    let sizeScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[sizeAttribute]))
        .range([3, 10]);

    // Update the axis labels
    xAxisLabel.text(xAttribute);
    yAxisLabel.text(yAttribute);

    // Bind data to the scatterplot points
    let dots = scatter.selectAll(".dot")
        .data(data);

    // Enter and update pattern for scatterplot points
    dots.enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d[xAttribute]))
        .attr("cy", d => y(d[yAttribute]))
        .attr("r", 0) // Start radius at 0 for animation
        .attr("opacity", 0.6)
        .style("fill", d => selectedPoints.has(d) ? selectedPoints.get(d) : "black")
        .on("click", function(event, d) {
            handlePointClick(d, d3.select(this));
        })
        .merge(dots)
        .transition()
        .delay((d, i) => i * 3) // Delay based on index
        .duration(700)
        .attr("cx", d => x(d[xAttribute]))
        .attr("cy", d => y(d[yAttribute]))
        .attr("r", d => sizeScale(d[sizeAttribute]));

    // Remove exiting points
    dots.exit().remove();
}






function renderRadarGrid() {
    let levels = 5; // Number of concentric circles

    let gridlines = radar.selectAll(".grid")
        .data(d3.range(1, levels + 1).reverse());

    gridlines.enter()
        .append("circle")
        .attr("class", "grid")
        .merge(gridlines)
        .attr("r", d => radius / levels * d)
        .style("stroke", "lightgray")
        .style("fill", "none");

    gridlines.exit().remove();
}

function renderRadarAxes() {
    let axisRadius = radius * 0.9; // Scale down to ensure there's room for labels

    let axes = radar.selectAll(".axis")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "axis");

    // Draw the axes lines
    axes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => radarX(axisRadius, i))
        .attr("y2", (d, i) => radarY(axisRadius, i))
        .style("stroke", "grey")
        .style("stroke-width", "1px");

    // Draw the labels at each axis end
    axes.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("x", (d, i) => radarX(axisRadius + 20, i)) // Offset labels a bit more outside
        .attr("y", (d, i) => radarY(axisRadius + 20, i))
        .text(d => d)
        .style("font-size", "10px");
}

function radarX(length, angleIndex) {
    return length * Math.cos(radarAngle(angleIndex) - Math.PI / 2);
}

function radarY(length, angleIndex) {
    return length * Math.sin(radarAngle(angleIndex) - Math.PI / 2);
}

function radarAngle(angleIndex) {
    // Divide the circle based on the number of dimensions
    return (Math.PI * 2 * angleIndex) / dimensions.length;
}


function renderRadarChart() {
    // Remove existing radar lines before drawing new ones
    radar.selectAll(".radarLine").remove();
    radar.selectAll(".radarPoint").remove(); // Remove existing radar points before drawing new ones

    selectedPoints.forEach((color, point) => {
        let pointData = dimensions.map(attr => {
            let value = point[attr];
            let extent = d3.extent(data, d => d[attr]);
            let normalizedValue = (value - extent[0]) / (extent[1] - extent[0]);
            return { value: normalizedValue, axis: attr };
        });

        // Close the shape by adding the first point at the end
        pointData.push(pointData[0]);

        let radarLine = d3.lineRadial()
            .radius(d => radius * d.value) // Adjust scaling as necessary
            .angle((d, i) => i * radarAxesAngle);

        radar.append("path")
            .datum(pointData)
            .attr("class", "radarLine")
            .attr("d", radarLine)
            .style("stroke", color)
            .style("fill", "none")
            .style("stroke-width", 2);

        // Add dots for each point on the radar line
        pointData.forEach((d, i) => {
            if (i < pointData.length - 1) { // Avoid duplicating the first point added at the end
                radar.append("circle")
                    .attr("class", "radarPoint")
                    .attr("cx", radarX(radius * d.value, i))
                    .attr("cy", radarY(radius * d.value, i))
                    .attr("r", 4) // Radius of the points
                    .style("fill", color)
                    .style("stroke", "none");
            }
        });
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

// init scatterplot select menu
function initMenu(id, entries) {
    let select = document.getElementById(id);
    select.innerHTML = '';

    entries.forEach((entry, index) => {
        let option = document.createElement("option");
        option.value = entry;
        option.text = entry;
        if (index === 1) { // Set the second attribute as selected
            option.selected = true;
        }
        select.appendChild(option);
    });

    $("#" + id).selectmenu({
        select: function () {
            renderScatterplot();
        }
    }).selectmenu("refresh");
}


// refresh menu after reloading data
function refreshMenu(id){
    $( "#"+id ).selectmenu("refresh");
}

// read current scatterplot parameters
function readMenu(id){
    return $( "#" + id ).val();
}

// switches and displays the tabs
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

init(); // Initialize the visualization