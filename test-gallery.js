const graphRefresh = {
    cfGraph: newScheduleChart,
    barChart: makeBarChart,
    arcDiagram: newArcDiagram
};

document.querySelector("#graphsNav").addEventListener("click", function(evt) {
    let evtTarget = evt.target;
    if (evtTarget.tagName.toUpperCase() == "A") {
        let fnKey = evtTarget.getAttribute("graph-refresh");

        if (fnKey && (fnKey in graphRefresh)) {
            graphRefresh[fnKey]();
        }
    }
});

window.location.href = "#graphsSplash";