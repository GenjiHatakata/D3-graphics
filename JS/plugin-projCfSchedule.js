/**
 * Timeline/schedule graph with start/close date pairs, and an 
 * array of date/amount pairs between each start/close date pair
 * 
 * @param {HTMLElement} container - HTML container for the graph
 * @param {Object} config - configuration options object
 * @param {string} config.chartTitle - chart title
 * @param {string} config.cfLegend - legend for vertical cashflow lines
 */

/*
import * as d3 from "d3";
import { Rect } from './rectStacking.js';
import { stackRects } from './rectStacking.js';
*/

/* export default */
function projCfScheduleChart(container, config = { chartTitle: "Cash flow schedule", cfLegend: "cash flow" }) {

    let wrapperInit = false;
    let chartWrapper;
    let width, height;

    let prevGraphArea = null;
    let savedData = {};

    /* sliding cf window object */
    const sliderWindowObj = new SliderWindow(container);

    /* window and data objects for the view controls window */
    const viewCtlsObj = new ViewControlsWindow(container);
    let showEmpty = false;

    function viewCtlsHandler(evt) {
        showEmpty = evt.target.checked;
        makeChart(savedData, true);
    }
    viewCtlsObj.setChkboxHandler(viewCtlsHandler);

    // markers for path elements
    const openboxUrl = "url(#openbox)";
    const filledboxUrl = "url(#filledbox)";

    /* layout dimensions based on em size */
    const emSize =
        parseFloat(window.getComputedStyle(container).getPropertyValue("font-size")
            .replace("px", ""));
    const margin = 4 * emSize;

    const titleHeight = 4 * emSize;
    const legendHeight = 4 * emSize;

    /* project track geometry */
    const xMinGap = 4 * emSize; // px
    const trackGap = 4 * emSize; // px
    const trackHeight = 10 * emSize; //px


    /**
     * Initialize the svg wrapper
     * @param {number} cwidth 
     * @param {number} cheight 
     */
    function initWrapper(cwidth, cheight) {
        /* layout dimensions */
        width = cwidth - 2 * margin;
        height = cheight - 2 * margin;

        /* insert an svg wrapper element in the given container */
        let ts = (new Date()).valueOf();
        chartWrapper = d3.select(container)
            .append('svg')
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("id", "cfGraph-wrapper-" + ts);

        /* Chart title and legend */
        writeTitleLegend(chartWrapper);

        wrapperInit = true;
    }

    /**
     * The drawing function: this is meant to be called repeatedly with fresh
     * datasets once the wrapper, title, and legend are set up. The height of the
     * wrapper may be changed depending on how many tracks are needed to accommodate 
     * the data
     * 
     * @param {Array<Object>} inputData
     * @param {Date} inputData[].dt1
     * @param {Date} inputData[].dt2
     * @param {string} inputData[].txt
     * @param {Array<Object>} inputData[].cf
     * @param {date} inputData[].cf[].dt
     * @param {number} inputData[].cf[].amt
     */
    function makeChart(inputData, reuseData = false) {

        if (!reuseData) {
            savedData = inputData;
        }

        if (!wrapperInit) {
            let containerWidth = container.offsetWidth;
            let containerHeight = container.offsetHeight;
            if (containerWidth && containerHeight) {
                initWrapper(containerWidth, containerHeight);
            }
        }

        if (!wrapperInit) {
            return;
        }

        sliderWindowObj.resetWindow();

        /* filter the project data if showEmpty is false */
        const filteredInputData = inputData.filter(p => showEmpty || (p.cf.length > 0));

        const timestampDt = new Date();
        const timestampVal = timestampDt.valueOf();

        /* calculate data bounds: min and max dates, max cash flow total */
        const minDateVal = Math.min(...filteredInputData.map(d => d.dt1.valueOf()));
        const maxDateVal = Math.max(...filteredInputData.map(d => d.dt2.valueOf()));
        const maxCf = Math.max(...filteredInputData.map(d => d.cf.map(c => c.amt)).flat());
        const maxCumCf = Math.max(...filteredInputData.map((d) => {
            return d.cf.reduce((a, c) => a + c.amt, 0);
        }));


        // set graph date limits
        let datelim1 = d3.timeMonth.offset(new Date(minDateVal), -3);
        let datelim2 = d3.timeMonth.offset(new Date(maxDateVal), 3);
        let firstOfMonthRange = d3.timeMonth.range(datelim1, datelim2, 1);
        const minGraphDate = firstOfMonthRange[0];
        const maxGraphDate = firstOfMonthRange[firstOfMonthRange.length - 1];

        // set the slider months max val
        let sliderMaxMths = d3.timeMonth.range(timestampDt, maxGraphDate, 1).length - 1;
        sliderWindowObj.setSliderMax(sliderMaxMths);

        /* set scales */
        const xScale = d3.scaleTime()
            .range([0, width])
            .domain([minGraphDate, maxGraphDate])
            .nice();

        const yScale = d3.scaleLinear()
            .range([0, trackHeight])
            .domain([0, 1.1 * maxCf]);

        /** Convert the input data to scaled x- and y-values.
         * All dates (dt1, dt2, cf.dt) are converted to x-values.
         * All cash flow amounts (cf.amt) are converted to y-heights.
         */
        const plotData = filteredInputData.map(d => {
            let pData = { idx: 0, x1: null, x2: null, ybase: 0, cf: [] };
            pData.x1 = xScale(d.dt1);
            pData.x2 = xScale(d.dt2);
            pData.dtStr1 = shortDateStr(d.dt1).replaceAll("/", ".");
            pData.dtStr2 = shortDateStr(d.dt2).replaceAll("/", ".");
            pData.txt = d.txt;
            d.cf.forEach((c) => {
                let plotCf = {};
                plotCf.x = xScale(c.dt);
                plotCf.h = yScale(c.amt);
                plotCf.rawDt = c.dt;
                plotCf.rawAmt = c.amt;
                pData.cf.push(plotCf);
            });
            pData.cf.sort((a, b) => a.x - b.x);
            return pData;
        });

        // sort the scaled plot data by x1 (left x-coord)
        plotData.sort((a, b) => a.x1 - b.x1);

        // populate the idx field for each plotData element
        plotData.forEach((p, i) => { p.idx = i; });

        // create a rectangles array for stacking
        // rectangle height is the max of all cf.h fields
        const rects = plotData.map((p) => {
            let h = Math.max(...p.cf.map(c => c.h));
            return new Rect(p.idx, p.x1, 0, (p.x2 - p.x1), h);
        });

        /* call the stacking function and get an indexed list of ybase for tracks */
        const yBaseObj = stackRects(rects, xMinGap, trackGap, trackHeight, false);

        // get the max ybase value to set the height of the chart
        const chartHeight = Math.max(...Object.values(yBaseObj)) + trackHeight + trackGap;

        /* populate the ybase element of plotdata */
        plotData.forEach(p => {
            p.ybase = yBaseObj[p.idx];
        });

        /* vbars dataset */
        const vData = plotData.map(function(p) {
            return p.cf.map(function(c) {
                return { x: c.x, ybase: p.ybase, h: c.h, rawDt: c.rawDt, rawAmt: c.rawAmt };
            });
        }).flat();

        /** SVG chart area */

        /* insert a new chart area svg element in the given container */
        if (prevGraphArea) {
            prevGraphArea.remove();
        }
        const graphArea = chartWrapper
            .append('svg')
            .attr("id", "cfGraph-area-" + timestampVal)
            .attr("x", margin).attr("y", titleHeight + legendHeight)
            .attr("height", chartHeight);

        // store as prevGraphArea
        prevGraphArea = graphArea;

        // adjust the parent svg height
        chartWrapper.attr("height", chartHeight + titleHeight + legendHeight);

        /* sliding cf overlay window */
        const cfWindowXleft = xScale(timestampDt);
        const cfWindow = graphArea.append("rect")
            .attr("x", cfWindowXleft).attr("y", 0)
            .attr("width", 0).attr("height", chartHeight)
            .attr("class", "cfWindow");

        let amtsObj = { 'Earnest money': vData };

        sliderWindowObj.setRectSizer(cfWindow, timestampDt, xScale, amtsObj);

        /* left and right hover groups for the horizontal bars */
        function configLeftHoverGroup(txt, xbr, ybr) {
            if (!txt) {
                leftText.text("");
                leftRect.attr("height", 0).attr("width", 0);
            } else {
                leftText.text(txt);
                let txtLen = leftText.node().getBBox().width;

                let rectW = txtLen * 1.4;
                let rectH = emSize * 1.4;
                let rectX = xbr - rectW;
                let rectY = ybr - (rectH / 2);
                let rectMidX = rectX + (rectW / 2);
                let rectMidY = rectY + (rectH / 2);
                leftRect.attr("x", rectX).attr("y", rectY)
                    .attr("height", rectH).attr("width", rectW);
                leftText.attr("x", rectMidX).attr("y", rectMidY);

            }
        }

        function configRightHoverGroup(txt, xbl, ybl) {
            if (!txt) {
                rightText.text("");
                rightRect.attr("height", 0).attr("width", 0);
            } else {
                rightText.text(txt);
                let txtLen = leftText.node().getBBox().width;

                let rectW = txtLen * 1.4;
                let rectH = emSize * 1.4;
                let rectX = xbl;
                let rectY = ybl - (rectH / 2);
                let rectMidX = rectX + (rectW / 2);
                let rectMidY = rectY + (rectH / 2);
                rightRect.attr("x", rectX).attr("y", rectY)
                    .attr("height", rectH).attr("width", rectW);
                rightText.attr("x", rectMidX).attr("y", rectMidY);
            }
        }

        /* line generator */
        const lineGenerator = d3.line();

        /** SVG groups for graph elements */


        /* insert a group for the x-axis */
        d3.select("#xaxis").remove();
        graphArea.append('g').attr("id", "xaxis")
            .attr('transform', `translate(0, 0)`)
            .call(d3.axisBottom(xScale))
            .call(trimDateAxisText.bind(null, 3));

        /* insert a group for the vbars */
        /* */
        const vBars = graphArea.append("g").attr("id", "vbars");
        vBars.selectAll('path')
            .data(vData)
            .join(
                function(enter) {
                    return enter
                        .append('path')
                        .attr('class', 'vline')
                        .attr('d', function(d) {
                            let pts = [
                                [d.x, d.ybase],
                                [d.x, d.ybase - d.h]
                            ];
                            return lineGenerator(pts);
                        });

                }
            );


        /* insert a group for the vline circles */
        const vBarCircles = graphArea.append("g").attr("id", "vbarCircles");
        vBarCircles.selectAll("use")
            .data(vData)
            .enter()
            .append("use")
            .attr("xlink:href", "#smalldot")
            .attr("x", d => d.x)
            .attr("y", d => d.ybase - d.h);
        // .attr("transform", function(d) { return "translate(" + d.x + "," + d.ybase - d.h + ")"; });

        /* circles - labels */
        const circlesLabels = graphArea.append("g").attr("id", "circlesLabels");
        vBarCircles.selectAll("text")
            .data(vData)
            .enter()
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", d => d.x)
            .attr("y", d => d.ybase - d.h - emSize)
            .attr("font-size", "0.8em")
            .text(d => (d.rawAmt / 1000).toFixed(1));

        /* insert a group for the horizontal bars (x1, x2) pairs */

        const hBars = graphArea.append("g").attr("id", "hbars");
        hBars.selectAll('path, text')
            .data(plotData)
            .join(
                function(enter, dIdx) {

                    let hbarGroup = enter.append("g");

                    hbarGroup
                        .append('path')
                        .attr('class', 'hbar')
                        .attr('d', function(d) {
                            let pts = [
                                [d.x1, d.ybase],
                                [d.x2, d.ybase]
                            ];
                            return lineGenerator(pts);
                        })
                        .attr("marker-end", filledboxUrl)
                        .attr("marker-start", openboxUrl);

                    hbarGroup.append("text")
                        .attr("text-anchor", "middle")
                        .attr("font-size", "0.8em")
                        .attr("x", d => (d.x1 + d.x2) / 2).attr("y", d => d.ybase + 1.5 * emSize)
                        .text(d => d.txt);

                    return hbarGroup;

                }
            )
            .on('mouseenter', function(evt, d) {

                let xLeftPos = d.x1 - emSize / 2;
                let xRightPos = d.x2 + emSize / 2;
                let yPos = d.ybase;
                configLeftHoverGroup(d.dtStr1, xLeftPos, yPos);
                configRightHoverGroup(d.dtStr2, xRightPos, yPos);

            })
            .on('mouseleave', function() {
                configLeftHoverGroup("");
                configRightHoverGroup("");
            });

        /**
         * Remove and re-add the hbar left and right hover groups from the last drawing.
         * Adding the groups as the last elements ensures that they will appear on top
         * of any other SVG elements in case of overlap.  
         */

        d3.select(container).select(".hbarLeftGroup").remove();
        const hbarLeftGroup = graphArea.append("g").attr("class", "hbarLeftGroup");
        let leftRect = hbarLeftGroup.append("rect")
            .attr("rx", 0.2 * emSize)
            .attr("stroke-width", 2)
            .attr("width", 0).attr("height", 0)
            .attr("x", 0).attr("y", 0);
        let leftText = hbarLeftGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text('')
            .attr('x', width / 2).attr('y', height / 2);


        d3.select(container).select(".hbarRightGroup").remove();
        const hbarRightGroup = graphArea.append("g").attr("class", "hbarRightGroup");
        let rightRect = hbarRightGroup.append("rect")
            .attr("rx", 0.2 * emSize)
            .attr("stroke-width", 2)
            .attr("width", 0).attr("height", 0)
            .attr("x", 0).attr("y", 0);
        let rightText = hbarRightGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text('')
            .attr('x', width / 2).attr('y', height / 2);

    }

    /** 
     * Insert title and legend groups 
     */
    function writeTitleLegend(svgParent) {

        const titleArea = svgParent.append("g").attr("height", titleHeight)
            .attr('transform', `translate(${margin + (width/2)}, 0)`);
        const legendGroup = svgParent.append("g").attr("height", legendHeight);
        // .attr('transform', `translate(${margin}, ${titleHeight})`);

        /* write the title */
        titleArea.append("text")
            .attr("text-anchor", "middle")
            .attr("x", 0)
            .attr("y", 3 * emSize)
            .attr("class", "title-text")
            .text(config.chartTitle);

        /* write the legend items */
        let legendLineGen = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        let legendLineData = [{ x: 8, y: 2 * emSize }, { x: 18, y: 2 * emSize }];
        legendGroup.append("path").attr("d", legendLineGen(legendLineData))
            .attr("class", "hbar legend").attr("marker-start", openboxUrl);
        legendGroup.append("text").attr("x", 24).attr("y", 2 * emSize)
            .attr("text-anchor", "start").attr("dominant-baseline", "middle")
            .text("feas exp").attr("class", "legend-text");

        legendLineData = [{ x: 90, y: 2 * emSize }, { x: 102, y: 2 * emSize }];
        legendGroup.append("path").attr("d", legendLineGen(legendLineData))
            .attr("class", "hbar legend").attr("marker-end", filledboxUrl);
        legendGroup.append("text").attr("x", 112).attr("y", 2 * emSize)
            .attr("text-anchor", "start").attr("dominant-baseline", "middle")
            .text("close").attr("class", "legend-text");

        legendGroup.append("use").attr("xlink:href", "#smalldot")
            .attr("x", 170).attr("y", 2 * emSize);
        legendGroup.append("text").attr("x", 180).attr("y", 2 * emSize)
            .attr("text-anchor", "start").attr("dominant-baseline", "middle")
            .text(config.cfLegend).attr("class", "legend-text");

        let legendWidth = legendGroup.node().getBBox().width;
        let dx = margin + (width / 2) - (legendWidth / 2);
        legendGroup
            .attr('transform', `translate(${(dx)}, ${titleHeight})`);

    }

    return {
        makeChart: makeChart
    };
}


// export default { cfScheduleGraph };