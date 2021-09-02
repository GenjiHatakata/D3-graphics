---
layout: page
title: About
permalink: /about/
---

These charts were developed for data relevant to the home construction industry. They show schedules and cash flows associated with property acquisition and construction planning.

More generally, the charts apply to the following data structure types:

- a stop/start date pair array (possibly overlapping), with events of arbitrary measure (e.g. cash flows) associated with each stop/start interval.

- a discrete dates array (e.g. project start dates) with multiple (project) options of different measure (e.g. cash requirement) availabe at each date


### Terminology

Here are some of the construction industry terms used in these charts.

- A property or parcel of land enters the acquisition phase after a *feasibility expiry date*. One or more *earnest money* payments are then made until the deal closes on the *closing date* and ownership is transferred. 

> the linear schedule chart shows [*feas. exp date*, *closing date*] bars together with associated *earnest money* flows

- Several *proforma* building types may be considered for each property. Detailed cost estimates for each *proforma* can be rolled up into two cash outlays: *acquisition cash*, and *additional cash*. 

> the arc schedule chart shows *proforma* cash requirements arranged in an arc around each project start date

### The charts

All charts are designed with updating data in mind. They support a workflow in which a user may modfy graph data several times during each session (e.g. add or update project dates and cash requirements, add *proformas*, and so on).

The schedule charts feature a draggable time window for aggregating cash flows.

Random synthetic data is used for all charts.

### Miscellaneous

- D3.js [v6](https://github.com/d3/d3/releases/tag/v6.0.0) is used; some features may not work with older versions

- The graphs do not scale well horizontally because some SVG dimensions are hardcoded for readability. Graphs should be refreshed after a browser re-size

- HTML5 features are used. The graphs have been tested on Webkit browsers and Firefox

