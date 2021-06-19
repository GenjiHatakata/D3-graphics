/**
 * Returns functions to interact with a view controls overlay window
 * @param {HTMLElement} parentElem 
 */
function ViewControlsWindow(parentElem) {

    const controlsWindow = parentElem.querySelector(".graph-viewcontrols");
    const chkbox = controlsWindow ? controlsWindow.querySelector("input[type='checkbox']") : null;

    function setChkboxHandler(handler) {
        if (chkbox) {
            chkbox.addEventListener("change", handler);
        }

    }

    this.setChkboxHandler = setChkboxHandler;
}

/**
 * Returns functions to control the sliding overlay window 
 * @param {HTMLElement} parentElem 
 */
function SliderWindow(parentElem) {

    const dtWindow = parentElem.querySelector(".graph-sliderwindow");
    let sliderCtl, showMthsSection, origLabelTxt, showDtRngSection, showCfSection;

    if (dtWindow) {
        sliderCtl = dtWindow.querySelector(".slider-input");
        showMthsSection = dtWindow.querySelector(".slider-showmths");
        origLabelTxt = showMthsSection ? showMthsSection.innerHTML : "";
        showDtRngSection = dtWindow.querySelector("section.slider-showdates");
        showCfSection = dtWindow.querySelector("section.slider-showtotals");
    }

    function displayMths(val) {
        if (!dtWindow || !showMthsSection) {
            return;
        }
        let suffix = val > 1 ? " mths" : " mth";
        let displayString = val > 0 ? val.toString() + suffix : origLabelTxt;
        showMthsSection.innerHTML = displayString;
    }

    function showWindowData(fromDt, toDt, mthsVal, amtsArray) {
        if (!dtWindow) {
            return;
        }

        let dtString = shortDateStr(fromDt) + " to " + shortDateStr(toDt);

        let totalsString = amtsArray.map(amt => {
            let amtString = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
            }).format(amt.valTotal);
            return amt.valType + ": " + amtString;
        }).join("\n");


        if (showDtRngSection) {
            showDtRngSection.innerHTML = mthsVal > 0 ? "range: " + dtString : "";
        }
        if (showCfSection) {
            showCfSection.innerHTML = mthsVal > 0 ? totalsString : "";
        }
    }

    function resetWindow() {
        if (!dtWindow) {
            return;
        }
        if (sliderCtl) {
            sliderCtl.value = 0;
        }
        if (showMthsSection) {
            showMthsSection.innerHTML = origLabelTxt;
        }
        if (showDtRngSection) {
            showDtRngSection.innerHTML = "";
        }
        if (showCfSection) {
            showCfSection.innerHTML = "";
        }
    }

    const sliderHandler = {
        monthsVal: 0,
        fromDt: null,
        toDt: null,
        totalAmts: [],
        resizeRect: function() {},
        refreshTotals: function(tempClass) {
            if (this.fromDt && this.toDt) {
                if (tempClass && (this.fromDt.valueOf() !== this.toDt.valueOf())) {
                    let cfDisplay = d3.select(showCfSection);
                    cfDisplay.classed(tempClass, false);
                    window.requestAnimationFrame(function(time) {
                        window.requestAnimationFrame(function(time) {
                            cfDisplay.classed(tempClass, true);
                        });
                    });
                }
                showWindowData(this.fromDt, this.toDt, this.monthsVal, this.totalAmts);
            }
        },
        setNewVal: function(newVal) {
            this.monthsVal = newVal;
            displayMths(newVal);
            this.resizeRect();
            this.refreshTotals();
        }
    };

    if (sliderCtl) {
        sliderCtl.addEventListener("input", function() {
            let sliderValue = this.value;
            sliderHandler.setNewVal(sliderValue);
        });
    }

    function setSliderMax(maxMths) {
        if (sliderCtl) {
            sliderCtl.setAttribute("max", maxMths);
        }
    }

    function setRectSizer(rectObj, nowDt, dtScaleFn, valData) {

        const nowVal = nowDt.valueOf();
        const xleft = dtScaleFn(nowDt);
        sliderHandler.fromDt = nowDt;

        let rectSizer = function() {
            let addMonths = sliderHandler.monthsVal;
            let rightDt = d3.timeMonth.offset(nowDt, addMonths);
            let rightDtVal = rightDt.valueOf();
            let xright = dtScaleFn(rightDt);
            rectObj.attr("width", xright - xleft);

            sliderHandler.toDt = rightDt;

            let windowTotals = Object.entries(valData).map(([valType, valsArray]) => {
                let valTotal = valsArray.filter(d => {
                    let tval = d.rawDt.valueOf();
                    return ((tval >= nowVal) && (tval <= rightDtVal));
                }).reduce((a, c) => a + c.rawAmt, 0);
                return { valType: valType, valTotal: valTotal };
            });

            sliderHandler.totalAmts = windowTotals;
        };

        sliderHandler.resizeRect = rectSizer;

    }

    // return {
    this.resetWindow = resetWindow;
    this.setSliderMax = setSliderMax;
    this.setRectSizer = setRectSizer;
    this.refreshTotals = function(tempClass) {
        sliderHandler.resizeRect();
        sliderHandler.refreshTotals(tempClass);
    };
}