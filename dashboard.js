let chart1;

function initDashboard(parsedData) {
    // Ensure parsedData is received correctly
    if (!parsedData || parsedData.length === 0) {
        console.error('Parsed data is empty or undefined');
        return;
    }

    console.log('Parsed Data:', parsedData);

    // Dimensions and margins
    const margin = { top: 10, right: 30, bottom: 90, left: 40 };
    const width = 460 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Create dropdowns for x and y axes
    createDropdowns(parsedData);

    // SVG container for chart1
    chart1 = d3.select("#chart1").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create the first chart with initial x and y attributes
    const initialXAttr = Object.keys(parsedData[0])[0];
    const initialYAttr = Object.keys(parsedData[0])[1];
    createChart1(parsedData, width, height, margin, initialXAttr, initialYAttr);
}

function createDropdowns(data) {
    const attributes = Object.keys(data[0]);

    // Create x-axis dropdown
    const xDropdown = d3.select("#xDropdown")
        .append("select")
        .attr("id", "xAxisSelect")
        .on("change", updateChart);

    xDropdown.selectAll("option")
        .data(attributes)
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
    const width = 460 - 40 - 30; // width = 460 - margin.left - margin.right
    const height = 450 - 10 - 90; // height = 450 - margin.top - margin.bottom
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
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[xAttr]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[yAttr]))
        .attr("height", d => height - y(d[yAttr]))
        .style("fill", "skyblue");

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

    // Animation
    chart1.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", d => y(d[yAttr]))
        .attr("height", d => height - y(d[yAttr]))
        .delay((d, i) => i * 100);
}

function createChart2() {
    // Implement the chart2 creation logic
}

function createChart3() {
    // Implement the chart3 creation logic
}

function createChart4() {
    // Implement the chart4 creation logic
}

// Clear charts if changes (dataset) occur
function clearDashboard() {
    if (chart1) chart1.selectAll("*").remove();
    if (chart2) chart2.selectAll("*").remove();
    if (chart3) chart3.selectAll("*").remove();
    if (chart4) chart4.selectAll("*").remove();
}
