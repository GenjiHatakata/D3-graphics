function getArcDiagram() {
    let arcDiagramContainer = document.querySelector("#arcDiagram");
    let arcDiagram = arcScheduleChart(arcDiagramContainer,
        "Proforma cash flows");

    return arcDiagram;
}

var arcDiagram = getArcDiagram();

function newArcDiagram() {
    arcDiagram.makeChart(getProjectsCfArray());
}

newArcDiagram();