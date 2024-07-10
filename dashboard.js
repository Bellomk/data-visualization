let chart1, chart2, radarChart;
let selectedStates = [];




function initDashboard(parsedData) {
    console.log('Parsed Data:', parsedData);

    // Dimensions and margins
    const margin = { top: 10, right: 30, bottom: 90, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create dropdowns for x and y axes
    createDropdowns(parsedData);

    // SVG container for chart1
    chart1 = d3.select("#chart1").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create the first chart with initial x and y attributes
    const initialXAttr = ["STATE"];
    const initialYAttr = ["PH"];
    createChart1(parsedData, width, height, margin, initialXAttr, initialYAttr);
    initChoroplethMap(parsedData);
    
 

}

//-----------------------BARCHART----------------------------------------

function createDropdowns(data) {
    const attributes = ["Temp","D.O. (mg/l)" ,"PH" ,"CONDUCTIVITY (Âµmhos/cm)" ,"B.O.D. (mg/l)" ,"NITRATENAN N+ NITRITENANN (mg/l)" ,"FECAL COLIFORM (MPN/100ml)", "TOTAL COLIFORM (MPN/100ml)Mean"];

    const StateYear = ['STATE', 'year'];
    

    // Create x-axis dropdown
    const xDropdown = d3.select("#xDropdown")
        .append("select")
        .attr("id", "xAxisSelect")
        .on("change", updateChart);

    xDropdown.selectAll("option")
        .data(StateYear)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Create y-axis dropdown
    const yDropdown = d3.select("#yDropdown")
        .append("select")
        .attr("id", "yAxisSelect")
        .on("change", updateChart);

    yDropdown.selectAll("option")
        .data(attributes)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
}


function updateChart() {
    // Get selected x and y attributes
    const selectedXAttr = d3.select("#xAxisSelect").node().value;
    const selectedYAttr = d3.select("#yAxisSelect").node().value;

    // Clear the existing chart
    chart1.selectAll("*").remove();

    // Recreate the chart with new x and y attributes
    const width = 600 - 40 - 30; // width = 460 - margin.left - margin.right
    const height = 600 - 10 - 90; // height = 450 - margin.top - margin.bottom
    const margin = { top: 10, right: 30, bottom: 90, left: 40 };
    createChart1(parsedData, width, height, margin, selectedXAttr, selectedYAttr);
}



function createChart1(data, width, height, margin, xAttr, yAttr) {
    // Ensure data is parsed correctly
    data.forEach(d => {
        d[xAttr] = isNaN(d[xAttr]) ? d[xAttr] : +d[xAttr];
        d[yAttr] = isNaN(d[yAttr]) ? d[yAttr] : +d[yAttr];
    });

    // Set the ranges
    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    const y = d3.scaleLinear()
        .range([height, 0]);

    // Scale the range of the data in the domains
    x.domain(data.map(d => d[xAttr]));
    y.domain([0, d3.max(data, d => d[yAttr])]);

    // Append the rectangles for the bar chart
chart1.selectAll(".bar")
.data(data)
.join(
    enter => enter.append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[xAttr]))
        .attr("width", x.bandwidth())
        .attr("y", height) // Start from the bottom
        .attr("height", 0) // Start with height 0
        .style("fill", "orange")
        .transition() // Transition for the enter selection
        .duration(800)
        .attr("y", d => y(d[yAttr]))
        .attr("height", d => height - y(d[yAttr])),
    update => update
        .transition() // Transition for the update selection
        .duration(800)
        .attr("x", d => x(d[xAttr]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[yAttr]))
        .attr("height", d => height - y(d[yAttr])),
    exit => exit
        .transition() // Transition for the exit selection
        .duration(800)
        .attr("y", height)
        .attr("height", 0)
        .remove()
);


    // Add the x Axis
    chart1.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add the y Axis
    chart1.append("g")
        .call(d3.axisLeft(y));

    // Add the x-axis label
    chart1.append("text")
        .attr("transform", `translate(${width / 2},${height + margin.bottom - 20})`)
        .style("text-anchor", "middle")
        .text(xAttr);

    // Add the y-axis label
    chart1.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yAttr);

    // Animation
    chart1.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", d => y(d[yAttr]))
        .attr("height", d => height - y(d[yAttr]))
        .delay((d, i) => i * 100);
}

///--------------------Choropleth MAP --------------------------

function updateMapColors() {
    const test =svg.selectAll("path")
       .attr("fill", function(d) {
           const state = d.properties.st_nm;
           const index = selectedStates.findIndex(s => s.name === state);
           if (index === 0) return 'red';
           if (index === 1) return 'yellow';
           return colorScale(d.properties.pH);  // Original color based on pH
       });
}


function initChoroplethMap(parsedData) {
    const width = 600;
    const height = 580;
    const svg = d3.select("#choroplethMap").append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator().center([82.9739, 22.5937]).scale(850);
    const path = d3.geoPath().projection(projection);

    // Define the tooltip for the choropleth map
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "gray")
        .style("border", "solid 1px black")
        .style("padding", "5px");

    d3.json("states_india.geojson").then(geojson => {
        geojson.features.forEach(feature => {
            const state = feature.properties.st_nm; 
            const stateData = parsedData.find(d => d.STATE.trim().toLowerCase() === state.trim().toLowerCase());
            feature.properties.pH = stateData ? +stateData.PH : "No data";
        });

       

        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain(d3.extent(geojson.features, d => d.properties.pH));

        svg.selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", d => colorScale(d.properties.pH))
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "orange");
                tooltip.style("visibility", "visible")
                    .text(`State: ${d.properties.st_nm}, pH: ${d.properties.pH}`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY-10)+"px")
                    .style("left",(event.pageX+10)+"px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("fill", colorScale(d.properties.pH));
                tooltip.style("visibility", "hidden");
            })
            .on("click", function(event, d) {
                const stateName = d.properties.st_nm;
                const index = selectedStates.findIndex(state => state.name === stateName);
            
                if (index === -1) {
                    if (selectedStates.length < 2) {
                        const stateData = parsedData.find(data => data.STATE.trim().toLowerCase() === stateName.toLowerCase());
                        if (stateData) {
                            selectedStates.push({ name: stateName, data: stateData });
                        }
                    }
                } else {
                    selectedStates.splice(index, 1);
                }
            
                updateRadarChart();
                updateMapColors();
            });
            
            
            
    });
}


//----------------------------RADAR CHART ! --------------------------------------



function initializeRadarChart(ctx) {
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: null,
        options: {
            elements: {
                line: {
                    borderWidth: 3
                }
            },
            scale: {
                ticks: { beginAtZero: true }
            }
        }
    });
}

function updateRadarChart() {
    const labels = ["PH", "Temp", "D.O. (mg/l)", "B.O.D. (mg/l)", "CONDUCTIVITY (µmhos/cm)", "NITRATENAN N+ NITRITENANN (mg/l)", "FECAL COLIFORM (MPN/100ml)", "TOTAL COLIFORM (MPN/100ml)Mean"];
    const datasets = selectedStates.map((state, index) => {
        const color = index === 0 ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 255, 0, 0.5)';  // Red for the first, yellow for the second
        return {
            label: `${state.name} Water Quality Indicators`,
            data: labels.map(label => state.data[label]),
            fill: true,
            backgroundColor: color,
            borderColor: color,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: color
        };
    });

    if (!radarChart) {
        initializeRadarChart(document.getElementById('radarChart').getContext('2d'));
    }
    radarChart.data.labels = labels;
    radarChart.data.datasets = datasets;
    radarChart.update();
}







function clearDashboard() {
    if (chart1) chart1.selectAll("*").remove();
}
