/**
 * Bar chart plugin with date on the x-axis. Input dates are specified
 * as JS date primitive vals, i.e. milliseconds. Y-axis values are shown as vertical
 * bars, with an optional line graph representing the running total.
 * 
 * @param {HTMLElement} container 
 * 
 * @param {Object} config 
 * @param {string} config.title
 * @param {boolean} config.showRunningTotal
 * @return {function(inputData): void} drawChart
 */

function getBarChart(container, config = { title: "", showRunningTotal: true }) {

    // init flag
    let isInit = false;

    // graph area from the previous makeChart() call
    let prevGraphArea = null;

    // path data from the previous call
    let prevPathData = null;

    /* layout dimensions etc */
    const emSize =
        parseFloat(window.getComputedStyle(container).getPropertyValue("font-size")
            .replace("px", ""));
    const margin = 4 * emSize;
    const width = container.offsetWidth - 2 * margin;
    const height = container.offsetHeight - 2 * margin;


    const opendotUrl = "url(#opendot)";

    /* helper functions */
    function fmtTick(d) {
        let isFirstTick = !this.parentNode.previousSibling.classList.contains("tick");
        return isFirstTick ? "" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(d);
    }

    let xAxisGroup, gridlinesGroup, lineGraph, barGroups, valText;

    function initChart() {

        /* insert an svg wrapper element in the given container */
        let ts = (new Date()).valueOf();
        const chartWrapper = d3.select(container)
            .append('svg')
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("height", container.offsetHeight)
            .attr("width", container.offsetWidth)
            .attr("id", "emGraph-wrapper-" + ts);

        /* insert the chart title */
        const titleArea = chartWrapper.append('g');
        titleArea.
        append('text')
            .text(config.title)
            .attr("class", "title-text")
            .attr('x', container.offsetWidth / 2)
            .attr('y', 4 * emSize)
            .attr("text-anchor", "middle");

        /* insert a group for the graph */
        const graphGroup = chartWrapper.append('g')
            .attr("id", "emGraph-area-" + ts)
            .attr("transform", `translate(${margin}, ${margin})`);

        /* insert a group for the x-axis */
        xAxisGroup = graphGroup.append('g').attr("id", "xaxis")
            .attr('transform', `translate(0, ${height})`);

        /* insert a group for gridlines */
        gridlinesGroup = graphGroup.append('g').attr("id", "gridlines")
            .attr('class', 'grid')
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick:not(:first-of-type) line").attr("stroke-dasharray", "2,2"));

        /* insert a group for the line graph (running sum) */
        const lineGraphGroup = graphGroup.append("g").attr("id", "linegraph");
        lineGraph = lineGraphGroup.append("svg:path")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-start", opendotUrl)
            .attr("marker-mid", opendotUrl)
            .attr("marker-end", opendotUrl);

        /* insert a group for the vertical bars */
        barGroups = graphGroup.append('g').attr("id", "barGroups");

        /* insert a text element for displaying bar info on hover */
        valText = graphGroup.append('text')
            .attr("id", "valText")
            .attr("class", "bar-hover-text")
            .text('')
            .attr('x', 0).attr('y', 0);

        isInit = true;

    }

    function scaleXAxis(xScale) {
        xAxisGroup
            .call(d3.axisBottom(xScale))
            .call(trimDateAxisText.bind(null, 3));
    }

    function scaleGridLines(gridXlinesGenerator) {
        gridlinesGroup
            .call(gridXlinesGenerator()
                .tickSize(-width, 0, 0)
                .tickFormat(fmtTick))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick:not(:first-of-type) line").attr("stroke-dasharray", "2,2"));
    }

    function renderLineGraph(prevPathData, pathGenerator, dataset) {
        lineGraph
            .attr("d", pathGenerator(prevPathData))
            .transition().duration(1000).ease(d3.easeQuad)
            .attr("d", pathGenerator(dataset));
    }


    /**
     * @param {Object[]} inputData 
     * @param {number} inputData[].dateMsecs
     * @param {number} inputData[].y
     * @param {string} inputData[].txt
     */
    const makeChart = function(inputData) {

        if (!isInit) {
            initChart();
        }

        /* make a copy of inputData and insert a key for cumulative y */
        const dataset = inputData.map(function(dataElem) {
            let newObj = {};
            newObj.yCum = 0;
            Object.assign(newObj, dataElem);
            return newObj;
        });

        /* sort the input data by dateVal */
        dataset.sort((a, b) => a.dateMsecs - b.dateMsecs);

        /* insert a running total field for y and a field to hold JS Date for the x-axis */
        let cumTotal = 0;
        dataset.forEach(function(elem) {
            cumTotal += elem.y;
            elem.yCum = cumTotal;
            elem.dateVal = new Date(elem.dateMsecs);
        });

        /* get data bounds */
        const maxDateval = dataset[dataset.length - 1].dateVal;
        const minDateval = dataset[0].dateVal;
        const minY = Math.min(...dataset.map(elem => elem.y));
        const maxY = Math.max(...dataset.map(elem => elem.y));

        /* set scales */
        const xScale = d3.scaleTime()
            .range([0, width])
            .domain([minDateval, maxDateval])
            .nice();

        const yMax = config.showRunningTotal ? cumTotal : maxY;
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 1.1 * yMax]);

        // set width of bars 
        var next = d3.timeDay.offset(minDateval, 10);
        const barWidth = xScale(next) - xScale(minDateval);

        /* define generators */
        const gridXlinesGenerator = () => d3.axisLeft()
            .scale(yScale);

        const pathGenerator = d3.line()
            .x(function(data) { return xScale(data.dateVal); })
            .y(function(data) { return yScale(data.yCum); })
            .curve(d3.curveCatmullRom);


        /** scale the x-axis and gridlines */
        scaleXAxis(xScale);
        scaleGridLines(gridXlinesGenerator);

        /* draw the line graph for running totals */
        if (config.showRunningTotal) {

            if (!prevPathData) {
                prevPathData = dataset.map((d) => {
                    return { dateVal: d.dateVal, yCum: cumTotal };
                });
            }

            renderLineGraph(prevPathData, pathGenerator, dataset);

            prevPathData = dataset.map((d) => {
                return { dateVal: d.dateVal, yCum: d.yCum };
            });

        }


        /* draw the bars*/
        barGroups.selectAll('rect')
            .data(dataset)
            .join(
                function(enter) {
                    return enter
                        .append('rect')
                        .attr('class', 'vbar')
                        .attr('width', barWidth)
                        .attr('x', 0).attr('y', 0)
                        .call(function(enter) {
                            enter
                                .transition().duration(1000).ease(d3.easeQuad)
                                .attr('x', (g) => xScale(g.dateVal) - barWidth / 2)
                                .attr('y', (g) => yScale(g.y))
                                .attr('height', (g) => height - yScale(g.y));
                        });


                },
                function(update) {
                    return update.call(function(update) {
                        update
                            .call(function(update) {
                                update.classed("updating", true);
                            })
                            .transition().duration(2000)
                            .attr('x', (g) => xScale(g.dateVal) - barWidth / 2)
                            .attr('y', (g) => yScale(g.y))
                            .attr('height', (g) => height - yScale(g.y))
                            .attr('width', barWidth)
                            .on('end', function() {
                                update.classed("updating", false);
                            });
                    });
                },
                function(exit) {
                    return exit.call(function(exit) {
                        exit
                            .call(function(exit) {
                                exit.classed("exiting", true);
                            })
                            .transition().duration(1000)
                            .attr('x', width)
                            .attr('y', 0)
                            .attr('height', 0)
                            .attr('width', 0)
                            .on('end', function() {
                                exit.remove();
                            });

                    });
                }
            )
            .on('mouseenter', function(evt, d) {

                let xTextPos = xScale(d.dateVal);
                let yTextPos = yScale(d.y) - 10;
                valText
                    .text(d.txt)
                    .attr("text-anchor", "start")
                    .attr('x', xTextPos)
                    .attr('y', yTextPos)
                    .attr('transform', "rotate(-90 " + xTextPos + " " + yTextPos + ")");

            })
            .on('mouseleave', function() {
                valText.text('');
            });

    };

    return {
        makeChart: makeChart
    };

}