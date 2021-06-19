const barchartContainer = document.querySelector("#emGraph");
const barchartConfig = { title: "Earnest money", showRunningTotal: true };

function delay(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}


function getBarData(numPoints) {

    class BarchartDataElem {
        constructor(msecs, val, txt) {
            this.dateMsecs = msecs;
            this.y = val;
            this.txt = genAddress();
        }
    }

    const dataset = [];

    for (let i = 0; i < numPoints; i++) {
        let dt = new Date(Date.UTC(2020, i, 1));
        let newDataElem = new BarchartDataElem(dt.valueOf(), Math.random() * 100000, "text_" + i);
        dataset.push(newDataElem);
    }

    return dataset;
}

var barChartGen = getBarChart(barchartContainer, barchartConfig);

function makeBarChart() {

    let delayMsecs = 5000;

    let numReps = 5;

    function getDataCount() {
        let minDataPoints = 5;
        let maxDataPoints = 20;
        return minDataPoints + Math.round((maxDataPoints - minDataPoints) * Math.random());
    }
    barChartGen.makeChart(getBarData(getDataCount()));

    delay(delayMsecs).then(function() {
        barChartGen.makeChart(getBarData(getDataCount()));
        delay(delayMsecs).then(function() {
            barChartGen.makeChart(getBarData(getDataCount()));
        });
    });

}

makeBarChart();