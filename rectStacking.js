/* rectangles in svg coords (origin left top, y points downwards) */
class Rect {
    constructor(idx, xlt, ylt, w, h) {
        this.idx = idx;
        this.xlt = xlt;
        this.ylt = ylt;
        this.xrb = xlt + Math.abs(w);
        this.yrb = ylt + Math.abs(h);
    }

    showCoords(yShift = 0) {
        let yltShifted = this.ylt + yShift;
        let yrbShifted = this.yrb + yShift;
        return "idx: " + this.idx + ", (" + this.xlt + ", " + yltShifted + ") -> (" + this.xrb + ", " + yrbShifted + ")";
    }
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

function stackRects(rectsArray, xMinGap, trackGap, trackHeight, compact = false) {


    /* sort the rectangles by xlt */
    rectsArray.sort((a, b) => a.xlt - b.xlt);
    rectsArray.forEach(rect => void console.log(rect.showCoords()));

    /* template for each track */
    class Track {
        constructor(yindex) {
            this.yindex = yindex;
            this.ybase = 0;
            this.rects = [];
        }


        get maxHeight() {
            let heights = this.rects.map(rect => rect.yrb - rect.ylt);
            return Math.max(...heights);
        }
        addRect(rect) {
            this.rects.push(rect);
        }

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

    /* Place the rectangles into separate tracks if they overlap in the x-dimension */
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
        // console.log("make new track (index = " + newYindex + "), add rect:" + rect.showCoords());
        let newTrack = new Track(newYindex);
        newTrack.addRect(rect);
        tracks.push(newTrack);
        newYindex++;

    });

    /* Adjust the base y value of tracks  based on the max height 
    of each track and the required gap between tracks. */

    let effTrackHeight = compact ? tracks[0].maxHeight : trackHeight;

    tracks[0].ybase = effTrackHeight + trackGap;

    for (let i = 1; i < tracks.length; i++) {
        effTrackHeight = compact ? tracks[i].maxHeight : trackHeight;
        tracks[i].ybase = tracks[i - 1].ybase + trackGap + effTrackHeight;
    }

    /*
    tracks.forEach(function(track) {
        console.log("track index: " + track.yindex + ", ybase: " + track.ybase);
        track.rects.forEach((rect) => void console.log(rect.showCoords(track.ybase)));
    });
    */

    let returnObj = {};
    tracks.forEach(function(track) {
        let rects = track.rects;
        rects.forEach(function(rect) {
            returnObj[rect.idx] = track.ybase;
        });

    });
    return returnObj;
}
// export { Rect, stackRects };