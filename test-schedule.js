function getScheduleChart() {
    let cfGraphContainer = document.querySelector("#cfGraph");
    let scheduleChart = projCfScheduleChart(cfGraphContainer, {
        chartTitle: "Project schedule and earnest money",
        cfLegend: "earnest money $k"
    });

    return scheduleChart;
}

var scheduleChart = getScheduleChart();

function newScheduleChart() {
    scheduleChart.makeChart(getProjectsEmArray());
}

newScheduleChart();