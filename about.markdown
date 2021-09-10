---
layout: page
title: About
permalink: /about/
---

Standard schedule charts are usually stacked horizontal bars representing timelines for different tasks.

The charts on this site are customized with different objectives in mind. They explore ways to display additional metrics together with the time dimension. 

For example, if events of given magnitude (e.g. cash flows) are planned over the duration of a project, they can be displayed alongside the schedule in the transverse direction. 

Similarly, metrics associated with alternative project configurations (e.g. budgets) can be shown alongside project start dates.

The [D3.js](https://d3js.org) package is well-suited for this kind of customization because of the low-level access it provides to SVG charting elements, along with numerous helper methods for common tasks.

These charts were developed for data relevant to the home construction industry. They show schedules and cash flows associated with property acquisition and construction planning.

### Applications
However, the charts can be adapted to any application with the following data structures:

- stop/start date pairs (with possibly overlapping time intervals), with events of arbitrary measure and timing (e.g. cash flows) associated with each pair
    - project intervals and associated event timings refer to the time x-axis, and event magnitudes use the y-axis

- discrete dates (e.g. project start dates) with multiple project metrics (e.g. cash requirements)  and alternatives (e.g. configurations) associated with each date
    - project start dates refer to a horizontal time axis, alternatives for each project are arranged as radial spokes, and spokes are stacked bars representing project metrics


### Terminology
Here are some of the construction industry terms used in these charts.

- A property or parcel of land enters the acquisition phase after a *feasibility expiry date*. One or more *earnest money* payments are then made until the deal closes on the *closing date* and ownership is transferred. 

> the linear schedule chart shows [*feas. exp date*, *closing date*] bars together with associated *earnest money* flows

- Several *proforma* building alternatives may be considered for each property. Detailed cost estimates for each *proforma* can be rolled up into two cash outlays: *acquisition cash*, and *additional cash*. 

> the arc schedule chart shows cash requirements for multiple *proformas* arranged in an arc around each project start date

### The charts

All charts are designed with updating data in mind. They support a workflow in which a user may modfy graph data several times during each session (e.g. add or update project dates and cash requirements, add *proformas*, and so on).

The schedule charts feature a draggable time window for aggregating cash flows.

Random synthetic data is used in all the examples.

### Miscellaneous

- D3.js [v6](https://github.com/d3/d3/releases/tag/v6.0.0) is used; some features may not work with older versions

- The graphs do not scale well horizontally because some SVG dimensions are hardcoded for readability. Graphs should be refreshed after a browser re-size

- HTML5 features are used. The graphs have been tested on Blink/Chromium based browsers and Firefox

