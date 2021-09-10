/**
 * Rectangle class in svg coordinates (origin left top, y points downwards).
 * Each 'cell' in a schedule graph is one such rectangle.
 * 
 */
class Rect {
    /**
     * 
     * @param {number} idx - integer index of the rectangle
     * @param {number} xlt - x-coordinate of the left-top corner
     * @param {number} ylt - y-coordinate of the left-top corner
     * @param {number} w - width of the rectangle
     * @param {number} h - height of the rectangle
     * @property {number} xrb - x-coordinate of the right-bottom corner
     * @property {number} yrb - y-coordinate of the right-bottom corner
     */
    constructor(idx, xlt, ylt, w, h) {
        this.idx = idx;
        this.xlt = xlt;
        this.ylt = ylt;
        this.xrb = xlt + Math.abs(w);
        this.yrb = ylt + Math.abs(h);
    }

    /** for debugging only */
    showCoords(yShift = 0) {
        let yltShifted = this.ylt + yShift;
        let yrbShifted = this.yrb + yShift;
        return "idx: " + this.idx + ", (" + this.xlt + ", " + yltShifted + ") -> (" + this.xrb + ", " + yrbShifted + ")";
    }
}

/**
 * Class definition for each track
 * @property {number} yindex - integer index
 * @property {number} ybase - y-coordinate of the top of the track
 * @property {Rect[]} rects - rectangles placed in this track
 */
class Track {
    /**
     * @param {number} yindex - integer index
     */
    constructor(yindex) {

        this.yindex = yindex;
        this.ybase = 0;
        this.rects = [];
    }

    /** max height of all rectangles in this track
     * @returns {number}
     */
    get maxHeight() {
        let heights = this.rects.map(rect => rect.yrb - rect.ylt);
        return Math.max(...heights);
    }

    /**
     * Add a rectangle to this track
     * @param {Rect} rect 
     */
    addRect(rect) {
        this.rects.push(rect);
    }

    /**
     * Determine if a given candidate rectangle can be accommodated in this track
     * while maintaining a minimum space xspace from rectangles already in the track
     * @param {Rect} rect 
     * @param {number} xspace 
     * @returns {boolean}
     */
    accommodates(rect, xspace) {

        let xleft = rect.xlt - xspace;
        let xright = rect.xrb + xspace;

        for (let i = 0; i < this.rects.length; i++) {
            let testRect = this.rects[i];
            let noOverlap = ((xleft > testRect.xrb) || (xright < testRect.xlt));
            if (!noOverlap) {
                return false;
            }
        }

        return true;

    }
}

/**
 * Function to stack input rectangles into different tracks (horizontal bands) as needed 
 * so that x-overlapping rectangles can be separated vertically.
 * The rectangles are cells in a linear schedule chart or an arc schedule chart.
 * In a linear schedule chart a cell contains a time interval (x-direction)
 * with associated vertical cash flow bars (y-direction). 
 * In an arc schedule chart, each cell contains a group of radial spokes (cash flow bars)
 * arranged around an event date, where date is represented as an x-coordinate.
 * 
 * @param {Rect[]} rectsArray - array of rectangles to be stacked into tracks
 * @param {number} xMinGap - min horizontal gap between rectangles in the same track
 * @param {number} trackGap - vertical gap between two tracks
 * @param {number} trackHeight - uniform height applied to all tracks
 * @param {boolean} compact - set to true for variable-height tracks
 * @returns {ybaseObj} ybaseObj - indexed yBase values for stacked rectangles
 */
function stackRects(rectsArray, xMinGap, trackGap, trackHeight, compact = false) {

    /* sort the rectangles by xlt */
    rectsArray.sort((a, b) => a.xlt - b.xlt);

    /** 
     * Place the rectangles into separate tracks if they overlap in the x-dimension .
     * At this stage, tracks are differentiated by a y-index. Actual y-coordinates
     * are determined later
     * 
     */
    const tracks = [];
    let foundSlot = false;
    let newYindex = 0;

    rectsArray.forEach(function(rect) {

        /* check if the rect can be accommodated in the existing tracks */
        for (let i = 0; i < tracks.length; i++) {
            let track = tracks[i];
            foundSlot = track.accommodates(rect, xMinGap);
            if (foundSlot) {
                // console.log("found slot on track " + track.yindex + ", rect: " + rect.showCoords());
                track.addRect(rect);
                break;
            }
        }

        if (foundSlot) {
            return;
        }

        /* if no slot was found, create a new track and add the rectangle to it */
        let newTrack = new Track(newYindex);
        newTrack.addRect(rect);
        tracks.push(newTrack);
        newYindex++;

    });

    /** 
     * Adjust the base y value of tracks  based on the max height 
     * of each track and the required gap between tracks. 
     */

    let effTrackHeight = compact ? tracks[0].maxHeight : trackHeight;

    tracks[0].ybase = effTrackHeight + trackGap;

    for (let i = 1; i < tracks.length; i++) {
        effTrackHeight = compact ? tracks[i].maxHeight : trackHeight;
        tracks[i].ybase = tracks[i - 1].ybase + trackGap + effTrackHeight;
    }

    /**
     * Return object with input rectangle indices as keys, and yBase as values
     * @typedef {Object} ybaseObj - indexed yBase values for stacked rectangles
     * @property {number} ybase
     */
    let ybaseObj = {};
    tracks.forEach(function(track) {
        let rects = track.rects;
        rects.forEach(function(rect) {
            ybaseObj[rect.idx] = track.ybase;
        });

    });
    return ybaseObj;
}

/*
(function testStackRects() {

    const rectsArray = [];

    // define random rectangles
    const maxX = 1000;
    const maxWidth = 250;
    const maxHeight = 50;
    const trackGap = 10;
    const xMinGap = 10;

    for (let i = 0; i < 10; i++) {
        let x = Math.round(Math.random() * maxX);
        let width = Math.round(Math.random() * maxWidth);
        let height = Math.round(Math.random() * maxHeight);

        let newRect = new Rect(i, x, 0, width, height);

        rectsArray.push(newRect);
    }
    let yBaseArray = stackRects(rectsArray, xMinGap, trackGap);
    console.log("rectsArray: \n" + rectsArray.forEach(rect => rect.showCoords() + "\n"));
    console.log('yBaseArray: \n' + yBaseArray.map(x => Object.entries(x).join(", ")).join("\n"));
})();
*/

// export { Rect, stackRects };