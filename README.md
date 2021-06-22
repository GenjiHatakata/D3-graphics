# D3-graphics
Custom charts based on the [D3.js](https://d3js.org) graphics package.  

A customized version of the lightweight [Milligram](https://milligram.io) CSS framework is used for basic HTML styling.

No other packages or frameworks are used.

The charts are here: <https://genjihatakata.github.io/D3-graphics>

## Context
These charts explore ways to present data in the construction industry, specifically in the property acquisition and building planning stages.

A property or parcel of land enters the acquisition phase after a *feasibility expiry date*. One or more *earnest money* payments are then made until the deal closes on the *closing date* and ownership is transferred. 

Several *proforma* building types may be considered for each property. Detailed cost estimates for each *proforma* can be rolled up into two cash outlays: *acquisition cash*, and *additional cash*. These consist of loan down payments, interest, points and other financing fees, reserves, and so on.

## The charts

All charts are designed with updating data in mind. They support a workflow in which a user may modfy graph data several times during each session (e.g. add or update project dates and cash requirements, add *proformas*, and so on).

The sample charts here use random data.
### __Bar chart__  
A basic bar chart showing *earnest money* payments on different dates.  
Payments from different projects are intermingled since project timelines can overlap.  
A cumulative cash flow line is also shown.

> This chart includes light animation to visually indicate new, defunct, and updating chart elements as data is updated.

### __Earnest money schedule__  
A schedule schart with the *feasibility expiry date* and *closing date* pair for each property laid out on a horizontal time scale.  
*Earnest money* payments are shown as vertical lollipops.

> This chart features a draggable time window for aggregating cash flows.

### __Proforma cash schedule__
A schedule chart with each project represented as a circle centered on the closing date. *Acquisition cash* and *additional cash* for each *proforma* are shown as radial bars.

> This chart features a draggable time window for aggregating cash flows. The user can click and select the *proforma* used for cash flow totals.

