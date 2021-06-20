function trimDateAxisText(nchar, axis) {
    let txtNodes = axis.selectAll("text").nodes();
    txtNodes.forEach(tn => {
        let curText = tn.innerHTML;
        if (isNaN(curText)) {
            tn.innerHTML = curText.substring(0, nchar);
        }
    });
}

function numFmt(num, isCcy = false, scale = 1000) {
    const ccyFmt = {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 1
    };
    const plainFmt = {
        maximumFractionDigits: 1
    };
    let fmt = isCcy ? ccyFmt : plainFmt;

    return new Intl.NumberFormat("en-US", fmt).format(num / scale);
}

function shortDateStr(date) {
    let opts = { datestyle: 'short' };
    return new Intl.DateTimeFormat('en-US', opts).format(date);
}

function randInt(a, b) {
    let x1 = Math.min(a, b);
    let x2 = Math.max(a, b);
    return Math.round(x1 + (x2 - x1) * Math.random());
}

function genAddress() {
    const sfx = (new Array(11)).fill("th");
    sfx[1] = "st";
    sfx[2] = "nd";
    sfx[3] = "rd";

    let strHousenum = (randInt(1, 2) * 900).toString();
    let strStreet = randInt(20, 120).toString();
    let lastCharInt = parseInt(strStreet.substr(-1));
    strSuffix = sfx[lastCharInt];
    strSuffix = strSuffix + " Avenue, " + genCity();
    let strAddress = strHousenum + " " + strStreet + strSuffix;

    return strAddress;

}

function genCity() {
    const pfx = ["Indigo", "Blue", "Green", "Yellow", "Orange", "Apple", "Peach"];
    const sfx = ["burg", "ville", "town"];
    let ipfx = randInt(0, pfx.length - 1);
    let isfx = randInt(0, sfx.length - 1);
    return pfx[ipfx] + sfx[isfx];
}

class Proforma {
    constructor(name, rank, acqCash, addlCash) {
        this.name = name;
        this.rank = rank;
        this.desc = this.getDesc();
        this.acqCash = acqCash;
        this.addlCash = addlCash;
    }
    getDesc() {
        const resTypes = ["Townhouse", "Loft", "Flat", "Attached Townhouse"];
        let resIdx = Math.round((resTypes.length - 1) * Math.random());
        let numRes = randInt(4, 10);
        return numRes.toString() + " " + resTypes[resIdx] + (numRes > 1 ? "s" : "");
    }
}

class Proj {
    constructor(dt, desc) {
        this.dt = dt;
        this.desc = desc;
        this.proformas = [];
    }

    addProforma(name, rank, acqCash, addlCash) {
        let p = new Proforma(name, rank, acqCash, addlCash);
        this.proformas.push(p);
    }

}

function getProjectsCfArray() {
    let dataArray = [];
    let nproj = 5;
    let minProformas = 0;
    let maxProformas = 6;
    let cashMin = 20000;
    let cashMax = 100000;
    let dtValMin = (new Date(2020, 10, 1)).valueOf();
    let dtValMax = (new Date(2022, 11, 1)).valueOf();


    for (let iproj = 0; iproj < nproj; iproj++) {
        let desc = genAddress();
        let dt = new Date(Math.round(dtValMin + (dtValMax - dtValMin) * Math.random()));
        let proj = new Proj(dt, desc);

        let nproformas = Math.round(minProformas + (maxProformas - minProformas) * Math.random());
        for (let iproforma = 0; iproforma < nproformas; iproforma++) {
            let acqCash = Math.round(cashMin + (cashMax - cashMin) * Math.random());
            let addlCash = Math.round(cashMin + (cashMax - cashMin) * Math.random());
            proj.addProforma("proforma" + iproforma.toString(), (iproforma + 1), acqCash, addlCash);
        }
        dataArray.push(proj);
    }
    return dataArray;
}

/**
 * feas exp date + closing date schedule together with 
 * dated earnest money payments
 */

function getProjectsEmArray() {


    Date.prototype.addDays = function(d) {
        let dtVal = this.valueOf();
        let newDtVal = dtVal + d * 24 * 60 * 60 * 1000;
        return new Date(newDtVal);
    };

    /**
     * generate feas-exp /closing date pairs and add earnest money
     * payments in between each pair, including one on the closing date
     */

    let numProj = 10;
    let projArray = [];

    for (let i = 0; i < numProj; i++) {
        let feYear = randInt(2020, 2022);
        let feMonth = randInt(1, 12);
        let feDay = randInt(1, 28);

        let feDate = new Date(feYear, feMonth, feDay);
        let mthsToClose = randInt(6, 12);
        let clDate = feDate.addDays(mthsToClose * 30);

        let emTotalAmt = 1000 * randInt(25, 100);
        let numEm = randInt(0, 4);
        let emAmt = emTotalAmt / (numEm + 1);
        let emInt = (clDate.valueOf() - feDate.valueOf()) / (numEm + 1);
        let emArray = [];
        for (let i = 0; i < numEm; i++) {
            let emDtVal = feDate.valueOf() + (i + 1) * emInt;
            emArray.push({ dt: new Date(emDtVal), amt: emAmt });
        }
        emArray.push({ dt: clDate, amt: emAmt });

        projArray.push({ dt1: feDate, dt2: clDate, txt: genAddress(), cf: emArray });

    }
    return projArray;
}