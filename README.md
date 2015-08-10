# mutliChart

A comparison chart using d3.js and Angular.js. Chart is contained in its own directive that can be reused throughout your app. Data structure for the chart is visiblie in 'client/assets/mock/mock.json.' For demos sake, on line 41, I've replaced what would normally be a value from a JSON response with a Math function that generates a random number between 1 and 100. I used Github user DaftMonk's incredibly usefully <a href="https://github.com/DaftMonk/generator-angular-fullstack">generator-angular-fullstack</a> Yeoman generator to quickly set up my project. All dev files reside in 'client/app.' I have a working example at www.jonhutchison.com/charts.

Some things I'll look to improve upon in the coming months:
- Making the charts semi-responsive both width and height.
- Making it easier to change time frames in code. 
- Adjusting linebreak on x value text.
- Having an option to average out a day or hours values to declutter chart when viewing from week or day view.

