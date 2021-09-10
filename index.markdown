---
layout: home
title: D3.js custom charts
---


Three Javascript charts are developed: two interactive schedule charts to display point and interval schedules alongside associated metrics, and a combination bar/line chart with animated data updates.

Libraries used:

 - the  [D3.js](https://d3js.org) graphics package is used for drawing the charts
 
 - basic HTML styling for the charts is based on the lightweight [Milligram](https://milligram.io) CSS framework. 

 - No other libraries or frameworks are used for the graphs


## Interactive schedule charts
Two types of custom schedule charts are shown. Both show time along the horizontal axis. The vertical axis is used for stacking events or time intervals that may overlap:

1. The *linear schedule chart* plots time intervals (e.g. process start and end dates) that have discrete events of some magnitude (e.g. cash flows) associated with each interval. When two intervals overlap, they are stacked vertically, with the earlier-starting interval positioned higher.

2. The *arc schedule chart* plots discrete events (e.g. start dates) with multiple alternative metrics arranged as radial spokes around each event date. If the dates are construction start dates for different sites, for example, the spokes could represent the cost of alternative building designs for each site.

Both schedule charts include an interactive time window for summing metrics for intervals or events, e.g. the sum of cash flows over some period, which amounts to a budget forecast.

The *arc schedule chart* allows the user to click and choose alternatives for each event.

## Dynamic bar chart
The bar chart is a simple bar representation of magnitudes (e.g. cash flows) along a horizontal date axis, plus a cumulative line graph. It is designed to be called repeatedly with dynamic data. Light animation is used to illustrate data updates.

### Miscellaneous
Site pages make use of [Jekyll](https://jekyllrb.com/) and parts of the Jekyll [minima](https://github.com/jekyll/minima) theme.