<img src="https://github.com/Vault6936/WebDashboard/blob/main/team/banner.svg"></img>

Webdashboard is a browser-based dashboard for use in FIRST Robotics Competition (FRC).  Dashboard layouts can be edited within browsers, saved to a browser's local storage, or transferred to other browsers with JSON.  

This project first started during the 2023 Charged Up FRC season when Vault was exploring ways to make a custom payload controller interface.  Ultimately, we decided to use a touch-screen monitor to display a simple HTML dashboard.  While this was much less capable than Shuffleboard, it was also more aesthetically pleasing, more customizable, and less prone to disastrous failure before a match (If the dashboard crashes, just reload the page :D).  After our last competition, we began taking this project farther with the goal of making a better and faster alternative to Shuffleboard.

# Getting Started
You'll need one of the following browsers:
- Microsoft Edge 12+
- Google Chrome 32+
- Firefox 29+
- Opera 19+
- Safari 8+

Since this project uses only HTML, CSS, and vanilla JavaScript, you can simply download the project and click on the index.html file!

# Usage
When you first open the index page, you should see a blank layout:

<img src="https://github.com/Vault6936/WebDashboard/blob/main/samples/images/example1.png"></img>

To begin creating your own layout, go to edit>turn on editing mode.  You will then have options to add nodes and edit them.

If you wish to create a new layout, go to file>new layout.  You can rename any layout by going to file>open layout and right clicking on the layout you wish to rename.  Alternatively, if you want to view an example layout, copy a json file in the samples directory and go to file>import json.

The test directory contains a sample Java program with websocket server code and an API for pulling data from dashboard layouts.  To connect your dashboard to the websocket server, go to options>settings and verify that the websocket URL is correct.  The dashboard will automatically connect when it detects the websocket server. 

# Contributing
We would love to see how other teams can improve this project!  If you or your team is interested in contributing, simply create a pull request.  If you have any questions or suggestions that aren't suited for an issue, feel free to email us at vault6936programming@gmail.com. 

# Licensing
This project is available under the <a href="https://mit-license.org/">MIT license</a>.
