/* 
import * as d3 from "d3";
import { Rect } from './rectStacking.js';
import { stackRects } from './rectStacking.js';
*/

/**
 * Wrapper for a project schedule diagram with each project's proformas
 * arranged around a circular arc centered at the closing date of the 
 * project. Acquisition and additional cash are shown as radial bars.
 * Cash flows can be aggregated over any period using a sliding date window.
 *  
 * @param {HTMLElement} container 
 * @param {string} chartTitle
 */
function arcScheduleChart(container, chartTitle) {

    let savedData = {};

    let wrapperInit = false;
    let chartWrapper;
    let prevGraphArea = null;

    /* window and data objects for the cf slider window */
    const sliderWindowObj = new SliderWindow(container);
    const cfWindowData = {};

    /* window and data objects for the view controls window */
    const viewCtlsObj = new ViewControlsWindow(container);
    let showEmpty = false;

    function viewCtlsHandler(evt) {
        showEmpty = evt.target.checked;
        makeChart(savedData, true);
    }
    viewCtlsObj.setChkboxHandler(viewCtlsHandler);

    /* layout dimensions etc */
    const emSize =
        parseFloat(window.getComputedStyle(container).getPropertyValue("font-size")
            .replace("px", ""));
    const margin = 4 * emSize;

    const titleHeight = 4 * emSize;
    const legendHeight = 4 * emSize;

    const pi = Math.PI;
    const startTheta = pi / 4;
    const dTheta = pi / 4;
    const thetaOffset = pi / 24;
    const maxRadials = 5;
    const cellRadius = 125;
    const textArcGap = 1.5 * emSize;
    const innerRadius = 50;
    const cellGap = 4 * emSize;

    let width, height;

    // markers for path elements
    const filldotUrl = "url(#filldot)";

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
            .attr("id", "arcDiagram-wrapper-" + ts);

        /* Chart title and legend */
        writeTitleLegend(chartWrapper, chartTitle);

        wrapperInit = true;
    }

    /**
     * 
     * @param {Array<Proj>} projData 
     * @param {boolean} reuseData
     */
    function makeChart(projData, reuseData = false) {

        if (!reuseData) {
            savedData = projData;
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
        const filteredProjData = projData.filter(p => showEmpty || (p.proformas.length > 0));

        const proformaDisplayStatus = {};
        const proformaDetailsText = {};
        const proformaDetailsPointers = {};
        const timestampDt = new Date();
        const timestampVal = timestampDt.valueOf();

        /* insert a new chart area svg element in the given container */
        if (prevGraphArea) {
            prevGraphArea.remove();
        }

        /* insert the graph svg element */
        const graphArea = chartWrapper.append("svg")
            .attr("x", margin)
            .attr("y", titleHeight + legendHeight)
            .attr("width", width);

        prevGraphArea = graphArea;

        /** 
         * get data bounds 
         */

        // max total cash amount
        let totalCashArray = filteredProjData.map(p => {
            return p.proformas.map(proforma => {
                return (proforma.acqCash + proforma.addlCash);
            });
        }).flat();

        const maxTotalCash = Math.max(...totalCashArray);

        // date limits
        let minDtVal = Math.min(...filteredProjData.map(p => p.dt.valueOf()));
        let maxDtVal = Math.max(...filteredProjData.map(p => p.dt.valueOf()));
        let minDt = new Date(minDtVal);
        let maxDt = new Date(maxDtVal);

        // set the slider months max val
        let sliderMaxMths = d3.timeMonth.range(timestampDt, maxDt, 1).length + 1;
        sliderWindowObj.setSliderMax(sliderMaxMths);

        /** 
         * set scales 
         */

        // max total cash is mapped to cell outer annulus
        const rScale = d3.scaleLinear()
            .range([0, (cellRadius - innerRadius)])
            .domain([0, maxTotalCash]);

        // dates are mapped to an x-range that is inset on each end by cell radius, 
        // so that the cells for the first and last dates fit within the graph width
        const xScale = d3.scaleTime()
            .range([cellRadius, (width - cellRadius)])
            .domain([minDt, maxDt])
            .nice();

        /** convert the raw data to scaled plot data */
        const plotData = filteredProjData.map(function(prj) {
            let d = {
                projDesc: prj.desc,
                dt: prj.dt,
                cx: xScale(prj.dt),
                cy: 0,
                proformas: []
            };
            for (let iproforma = 0; iproforma < prj.proformas.length; iproforma++) {
                let prf = prj.proformas[iproforma];
                let dpr = {
                    name: prf.name,
                    rank: prf.rank,
                    desc: prf.desc,
                    rAcq: rScale(prf.acqCash),
                    rAddl: rScale(prf.addlCash),
                    amtAcq: prf.acqCash,
                    amtAddl: prf.addlCash
                };
                d.proformas.push(dpr);
            }
            return d;

        });

        // sort by x-position
        plotData.sort((p1, p2) => p1.cx - p2.cx);

        // insert an index field
        plotData.forEach((p, i) => { p.idx = i; });

        // create a rectangles array for the stacking function
        const rects = plotData.map(function(p) {
            return new Rect(p.idx, (p.cx - cellRadius), 0, 2 * cellRadius, 2 * cellRadius);
        });

        /* call the stacking function and get an indexed list of ybase for tracks */
        const yBaseObj = stackRects(rects, cellGap, cellGap, 2 * cellRadius, false);

        /* populate the cy element of plotdata */
        plotData.forEach(p => {
            p.cy = yBaseObj[p.idx] - cellRadius + 2 * cellGap;
            console.log("pElem: " + JSON.stringify(p));
        });

        /* initialize the proforma display status and details pointers objects */
        plotData.forEach(proj => {
            proformaDisplayStatus[proj.idx] = false;
            proformaDetailsPointers[proj.idx] = {};
            proj.proformas.forEach(prf => {
                proformaDetailsPointers[proj.idx][prf.rank] = null;
            });

        });

        // get the max ybase value to set the height of the chart
        const chartHeight = Math.max(...Object.values(yBaseObj)) + 2 * margin;

        // set the heights of the svg wrapper and the graph area
        chartWrapper.attr("height", chartHeight + titleHeight + legendHeight);
        graphArea.attr("height", chartHeight);

        /**
         * Drawing
         */

        /* insert the x-axis */
        graphArea.append('g').attr("id", "xaxis")
            .attr('transform', `translate(0, 0)`)
            .call(d3.axisBottom(xScale).ticks(d3.timeMonth))
            .call(trimDateAxisText.bind(null, 3));

        /* sliding cf window */
        const cfWindowXleft = xScale(timestampDt);
        const cfWindow = graphArea.append("rect")
            .attr("x", cfWindowXleft).attr("y", 0)
            .attr("width", 0).attr("height", chartHeight)
            .attr("class", "cfWindow");

        // set the sizing function for the sliding cf window
        sliderWindowObj.setRectSizer(cfWindow, timestampDt, xScale, cfWindowData);

        /** 
         * insert a group for the outer arc borders
         */
        const arcs = graphArea.append("g")
            .attr("id", "arcs")
            .attr("class", "outer-arc");
        arcs.selectAll("path")
            .data(plotData)
            .enter()
            .append("path")

        .attr("d", function(d) {

            let x1 = d.cx;
            let y1 = d.cy - cellRadius;
            let theta1 = startTheta + thetaOffset;
            let x2 = d.cx + cellRadius * Math.cos(theta1);
            let y2 = d.cy - cellRadius * Math.sin(theta1);
            let arcPath1 = ['M', x1, y1,
                'A', cellRadius, cellRadius,
                0, 0, 1, x2, y2
            ];
            let theta2 = -pi + startTheta - thetaOffset;
            x1 = d.cx + cellRadius * Math.cos(theta2);
            y1 = d.cy - cellRadius * Math.sin(theta2);
            x2 = d.cx - cellRadius;
            y2 = d.cy;
            let arcPath2 = ['M', x1, y1,
                'A', cellRadius, cellRadius,
                0, 0, 1, x2, y2
            ];

            return arcPath1.concat(arcPath2).join(' ');
        });

        /**
         * Define a floating vertical line and associated text
         * to indicate project date on hover
         */
        let dateLineGen = d3.line()
            .x(d => d.x)
            .y(d => d.y);
        let projDateLine = graphArea.append("path")
            .attr("class", "date-line");

        let projDateText = graphArea.append("text")
            .attr("class", "date-text smalltext spacedtext")
            .attr("text-anchor", "start");

        /* function to dynamically display the floating date line and date text */
        function showDateLine(evt, proj) {
            let lineCoords, markerUrl;
            let dateTxt, txtX, txtY, txtAngle;

            if (arguments.length === 0) {
                lineCoords = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
                dateTxt = "";
                txtX = 0;
                txtY = 0;
                txtAngle = 90;
                markerUrl = "none";
            } else {
                lineCoords = [{ x: proj.cx, y: proj.cy }, { x: proj.cx, y: 0 }];
                dateTxt = shortDateStr(proj.dt);
                txtX = proj.cx - emSize / 2;
                txtY = proj.cy - cellRadius - emSize;
                txtAngle = -90;
                markerUrl = filldotUrl;
            }
            projDateLine
                .attr("d", dateLineGen(lineCoords))
                .attr("marker-start", markerUrl);
            projDateText.text(dateTxt)
                .attr("x", txtX)
                .attr("y", txtY)
                .attr("transform", "rotate(" + txtAngle + " " + txtX + " " + txtY + ")");

        }

        function clearDateLine() {
            showDateLine();
        }

        /** 
         * insert a group for the outer text paths and text 
         */
        let arcPathFn = function(d, radius) {
            let x1 = d.cx - radius;
            let y1 = d.cy;
            let x2 = d.cx;
            let y2 = d.cy - radius;
            let pathInstr = ['M', x1, y1,
                'A', radius, radius,
                0, 0, 1, x2, y2
            ].join(' ');
            return pathInstr;
        };
        const outerText = graphArea.append("g").attr("id", "outerText");
        outerText.selectAll("g")
            .data(plotData)
            .enter()
            .append(
                function(d) {

                    let arcTextGroup = d3.select(this).append("g");

                    // insert three textpath arcs to display project and proforma info
                    for (let i = 0; i < 3; i++) {
                        let arcRadius = cellRadius - i * textArcGap;

                        arcTextGroup.append("path")
                            .attr("id", "arc-" + d.idx + "-" + i)
                            .attr("class", "text-arc")
                            .attr("d", arcPathFn(d, arcRadius));
                    }

                    // associate text elements with the two inner arcs for proforma
                    // details: text content will be set dynamically
                    let proformaDescText = arcTextGroup.append("text").append("textPath")
                        .attr("xlink:href", d => "#arc-" + d.idx + "-1")
                        .attr("class", "proforma-desc-text smalltext spacedtext")
                        .attr("startOffset", "50%").attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle");
                    let acqCashText = arcTextGroup.append("text").append("textPath")
                        .attr("xlink:href", d => "#arc-" + d.idx + "-2")
                        .attr("class", "acq-cash-text smalltext spacedtext")
                        .attr("startOffset", "48%").attr("text-anchor", "end")
                        .attr("dominant-baseline", "middle");
                    let addlCashText = arcTextGroup.append("text").append("textPath")
                        .attr("xlink:href", d => "#arc-" + d.idx + "-2")
                        .attr("class", "addl-cash-text smalltext spacedtext")
                        .attr("startOffset", "52%").attr("text-anchor", "start")
                        .attr("dominant-baseline", "middle");

                    // store the text elements for the inner arcs

                    proformaDetailsText[d.idx] = {
                        proformaDesc: proformaDescText,
                        acqCash: acqCashText,
                        addlCash: addlCashText
                    };


                    // write the project description on the outermost arc
                    let projDescText = arcTextGroup.append("text");
                    projDescText
                        .append("textPath")
                        .attr("xlink:href", d => "#arc-" + d.idx + "-0")
                        .attr("startOffset", "50%")
                        .text(d => d.projDesc)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .attr("class", "proj-desc");

                    // project description text hover: show project date
                    projDescText.on("mouseenter", showDateLine);
                    projDescText.on("mouseleave", clearDateLine);

                    return arcTextGroup.node();
                }
            );


        /**
         * function to dynamically display text along textpath arcs
         */
        function showProformaDetails(proforma, evt, prj) {

            // return if the specified proforma is already displayed
            if (proformaDisplayStatus[prj.idx] === proforma.rank) {
                return;
            }

            let textElements = proformaDetailsText[prj.idx];

            let proformaDescStr = proforma.desc;
            let acqCashStr = "acq: " + numFmt(proforma.amtAcq, true);
            let addlCashStr = "addl: " + numFmt(proforma.amtAddl, true);

            textElements.proformaDesc.text(proformaDescStr);
            textElements.acqCash.text(acqCashStr);
            textElements.addlCash.text(addlCashStr);
            proformaDetailsPointers[prj.idx][proforma.rank].classed("hidden", false);

            for (let [rnk, ptrLine] of Object.entries(proformaDetailsPointers[prj.idx])) {
                if (ptrLine) {
                    ptrLine.classed("hidden", (parseInt(rnk) !== proforma.rank));
                }
            }

            proformaDisplayStatus[prj.idx] = proforma.rank;

            if (evt && (evt.type === "click")) {
                setCfWindowData();
                sliderWindowObj.refreshTotals("highlight-temp");
            }

        }

        /** 
         * insert a group for the radial lines 
         */
        const radialGen = d3.line();

        const radialLines = graphArea.append("g")
            .attr("id", "radialLines")
            .attr("class", "radial-lines");
        radialLines.selectAll("g")
            .data(plotData)
            .enter()
            .append("g")

        .append(function(d) {
            let gr = d3.select(this).append("g")
                .attr("id", d => "radialLines-" + d.idx);
            let numRadials = Math.min(maxRadials, d.proformas.length);

            function menter(evt, d) {
                console.log("acqLine");
            }

            for (let i = 0; i < numRadials; i++) {
                let proforma = d.proformas[i];
                let rAcq = proforma.rAcq;
                let rAddl = proforma.rAddl;
                let theta = startTheta - i * dTheta;

                // acq cash line
                let x1 = d.cx + innerRadius * Math.cos(theta);
                let y1 = d.cy - innerRadius * Math.sin(theta);
                let r = innerRadius + rAcq;
                let x2 = d.cx + r * Math.cos(theta);
                let y2 = d.cy - r * Math.sin(theta);
                let acqLine = gr.append("path")
                    .attr("class", "acq-line")
                    .attr("d", radialGen([
                        [x1, y1],
                        [x2, y2]
                    ]));

                // addl cash line    
                x1 = x2;
                y1 = y2;
                r = innerRadius + rAcq + rAddl;
                x2 = d.cx + r * Math.cos(theta);
                y2 = d.cy - r * Math.sin(theta);
                let addlLine = gr.append("path")
                    .attr("class", "addl-line")
                    .attr("d", radialGen([
                        [x1, y1],
                        [x2, y2]
                    ]));

                // total cash text
                r += emSize / 4;
                x1 = d.cx + r * Math.cos(theta);
                y1 = d.cy - r * Math.sin(theta);
                let totalAmt = proforma.amtAcq + proforma.amtAddl;
                let rotation = -theta * 180 / pi;
                let amtString = numFmt(totalAmt);

                gr.append("text")
                    .attr("class", "radial-text smalltext spacedtext")
                    .attr("x", x1).attr("y", y1)
                    .attr("text-anchor", "start")
                    .attr("dominant-baseline", "middle")
                    .text(amtString)
                    .attr("transform", "rotate(" + rotation + " " + x1 + " " + y1 + ")");

                // rank text
                r = innerRadius - emSize / 4;
                x1 = d.cx + r * Math.cos(theta);
                y1 = d.cy - r * Math.sin(theta);


                let rankString = "#" + proforma.rank;

                let rankText = gr.append("text")
                    .attr("class", "rank-text")
                    .attr("x", x1).attr("y", y1)
                    .attr("text-anchor", "end")
                    .attr("dominant-baseline", "middle")
                    .text(rankString)
                    .attr("transform", "rotate(" + rotation + " " + x1 + " " + y1 + ")");

                hTxt = proforma.desc;
                let rankClickFn = showProformaDetails.bind(null, proforma);
                rankText.on('click', rankClickFn);

                // pointer lines for each proforma
                r -= 2 * emSize;
                x1 = d.cx + r * Math.cos(theta);
                y1 = d.cy - r * Math.sin(theta);
                x2 = d.cx + (cellRadius - 5 * emSize) * Math.cos(3 * pi / 4);
                y2 = d.cy - (cellRadius - 5 * emSize) * Math.sin(3 * pi / 4);
                let pathStr = ["M", x1, y1, "L", d.cx, d.cy, "L", x2, y2]
                    .map(elem => elem.toString()).join(" ");

                let pointerLine = gr.append("path")
                    .attr("class", "pointer-path hidden")
                    .attr("marker-mid", filldotUrl)
                    .attr("d", pathStr);

                // store the pointer line
                proformaDetailsPointers[d.idx][proforma.rank] = pointerLine;

            }
            return gr.node();

        });

        /** 
         * function to set data for the cf window based on current display status
         */
        function setCfWindowData() {
            let acqCashArray = [];
            let addlCashArray = [];
            Object.entries(proformaDisplayStatus).forEach(([projIdx, currentRank]) => {
                let proj = plotData.filter(prj => prj.idx === parseInt(projIdx));
                if (proj.length > 0) {
                    let proforma = proj[0].proformas.filter(prf => prf.rank === currentRank);
                    if (proforma.length > 0) {
                        acqCashArray.push({ rawDt: proj[0].dt, rawAmt: proforma[0].amtAcq });
                        addlCashArray.push({ rawDt: proj[0].dt, rawAmt: proforma[0].amtAddl });
                    }
                }
            });
            cfWindowData["acq cash"] = acqCashArray;
            cfWindowData["addl cash"] = addlCashArray;
        }

        /**
         * initialize proforma details display by displaying 
         * the top-ranked proformas for each project
         */
        plotData.forEach(prj => {
            proforma = prj.proformas.filter(proforma => proforma.rank === 1);
            if (proforma.length > 0) {
                showProformaDetails(proforma[0], null, prj);
            }
        });

        /**
         * initialize the cf window data object
         */
        setCfWindowData();

    }

    /** 
     * Insert title and legend grpups 
     */
    function writeTitleLegend(svgParent, chartTitle) {

        const titleArea = svgParent.append("g").attr("height", titleHeight)
            .attr('transform', `translate(${margin}, 0)`);
        const legendGroup = svgParent.append("g")
            .attr("height", legendHeight);

        /* write the title */
        titleArea.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 3 * emSize)
            .attr("class", "title-text")
            .text(chartTitle);

        /* write the legend items */
        let legendLineGen = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        let legendLineData = [{ x: 8, y: 2 * emSize }, { x: 28, y: 2 * emSize }];
        legendGroup.append("path").attr("d", legendLineGen(legendLineData))
            .attr("stroke-width", 8).attr("class", "acq-line");
        legendGroup.append("text").attr("x", 34).attr("y", 2 * emSize)
            .attr("text-anchor", "start").attr("dominant-baseline", "middle")
            .text("acq cash $K").attr("class", "legend-text");

        legendLineData = [{ x: 150, y: 2 * emSize }, { x: 172, y: 2 * emSize }];
        legendGroup.append("path").attr("d", legendLineGen(legendLineData))
            .attr("stroke-width", 8).attr("class", "addl-line");
        legendGroup.append("text").attr("x", 178).attr("y", 2 * emSize)
            .attr("text-anchor", "start").attr("dominant-baseline", "middle")
            .text("addl cash $K").attr("class", "legend-text");

        let legendWidth = legendGroup.node().getBBox().width;
        let dx = margin + (width / 2) - (legendWidth / 2);
        legendGroup
            .attr('transform', `translate(${(dx)}, ${titleHeight})`);

    }

    return {
        makeChart: makeChart
    };
}