'use strict';

angular.module('chartsApp')
  .directive('chart', ['$filter', function ($filter) {
    return {
    templateUrl: 'app/main/chart/chart.html',
      restrict: 'EA',
      controllerAs: 'dir',
      link: function (scope, element, attrs) {
        var $scope = scope;

        $scope.chart = {
          "graphData": null,
          "tooltip": {'labelOne': null, 'labelTwo': null, 'labelThree': null, 'labelFour': null, 'labelFive': null, 'labelSix': null, 'labelSeven': null, 'labelEight': null},
          "tooltipsActive": false,
          "hoverActive": false
        };

        $scope.$watch('data', function(response) {
          if (response.data){
            $scope.chart.graphData = $scope.data.data;
            $scope.chart.isActive = true;
            sortData();
          } else {
            $scope.chart.isActive = false;
          }
        });

        // condition data objects and sort by date
        function sortData() {
          var dataExists = false;
          for (var i = 0; i < $scope.chart.graphData.length; i++) {
            for (var j = 0; j < $scope.chart.graphData[i].length; j++) {
              var label = $scope.chart.graphData[i][j].label;
              if ($scope.chart.graphData[i][j].data.length) {
                dataExists = true;
                $scope.chart.graphData[i][j].data = _.sortBy($scope.chart.graphData[i][j].data.map(function(piece) {
                  return {
                      date: new Date(piece.time),
                      value: Math.floor((Math.random() * 100) + 1),
                      label: label
                  };
                }), 'date');
              }
            }
          }
          if (dataExists) {
            findEarliestData();
          } else {
            $scope.chart.isActive = false;
          }
          
        }

        function createGraph() {
          var margin = {top: 75, bottom: 50},
              width = $('chart').width();

          var length = $scope.chart.scale.values.length - 1;
          var values = $scope.chart.scale.values;
          var start = $scope.chart.scale.values[0];
          var end = $scope.chart.scale.values[length];

          // specify date format for X tick marks
          var angularDateFormat = function(date) {
            return $filter('date')(date, 'short');
          };

          // prepare X axis and tick marks
          var x = d3.time.scale().range([0, width]).domain([values[0], values[length]]);
          var xTop = d3.svg.axis().scale(x).orient('top').tickFormat(angularDateFormat).tickValues(values);
          var xBottom = d3.svg.axis().scale(x).orient('bottom').tickFormat(angularDateFormat).tickValues(values);
          var xInner = d3.svg.axis().scale(x).orient('top').tickFormat('').tickValues(values);
          d3.select('g.x.axis-top').attr('transform', "translate(0,50)").attr('height', "50").call(xTop).selectAll(".tick text").call(wrap, 70, -30);
          d3.select('g.x.axis-bottom').call(xBottom).selectAll(".tick text").call(wrap, 70, 25);
          d3.selectAll('.x-inner').call(xInner);

          // prepare Y axis and tick marks
          var y = d3.scale.linear().range([105, 15]);
          var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("right").innerTickSize(0).outerTickSize(0);
          var yAxisRight = d3.svg.axis().scale(y).ticks(4).orient("left").innerTickSize(0).outerTickSize(0);

          //create svg line
          var line = d3.svg.line()
                .x(function(d) {
                  return x(d.date);
                })
                .y(function(d) {
                  return y(d.value);
                });

          if ($scope.chart.graphData.length) {
            $scope.chart.varData = [];
            d3.selectAll('.y-axis-guide').attr('x2', width - 50);
            for (var i = 0; i < $scope.chart.graphData.length; i++) {
              var top = margin.top + (i*180);
              var chart = d3.select('.chart-' + i);

              for (var j = 0; j < $scope.chart.graphData[i].length; j++) {
                var graph = chart.select('g.graph-' + j);
                var data = filterData($scope.chart.graphData[i][j].data);
                $scope.chart.varData.push(data);

                if (data && data.length > 1) {

                  if ($scope.chart.graphData[i][j].toggled) {
                    $scope.chart.graphData[i][j].isActive = false;
                  } else {
                    $scope.chart.graphData[i][j].isActive = true;
                  }

                  chart.select('.x-inner').call(xInner);

                  $scope.$watch('chart.graphData[' + i + '][' + j + '].isActive', function() {
                    setTimeout(function(){
                      for (var i = 0; i < 4; i++) {
                        var chartPosition = $('.chart-' + i).position().top - 80;
                        $('.tip-chart-' + i).css('top', chartPosition);
                      }
                    }, 300);
                  });

                  // if ($scope.chart.graphData[i].length === 3 && j >= 1 && $scope.chart.graphData[i][1].data && $scope.chart.graphData[i][2].data) {

                  //   var axisArray = [];

                  //   for (var k = 0; k < $scope.chart.graphData[i][1].data.length; k++) {
                  //     axisArray.push($scope.chart.graphData[i][1].data[k].value);
                  //   }

                  //   for (var k = 0; k < $scope.chart.graphData[i][2].data.length; k++) {
                  //     axisArray.push($scope.chart.graphData[i][2].data[k].value);
                  //   }

                  //   axisArray.sort();

                  //   var extent = d3.extent(axisArray, function(d) {return d});
                  // } else {
                    var extent = d3.extent(data, function(d) {return Number(d.value);});
                  // }

                  var diff = (Number(extent[1]) - Number(extent[0])) / 3,
                      start = Number(extent[0]),
                      domain = [roundNum(start), roundNum(start + diff),  roundNum(start + (diff*2)), roundNum(extent[1])];

                  y.domain(extent);

                  if (j === 0) {
                    yAxisLeft.tickFormat(function(d) {return $filter('number')(d);}).tickValues(domain);
                    chart.select('.axisLeft').call(yAxisLeft).attr('transform',  "translate(5 ,0)");
                  } else if (j === 1 || j === 2) {
                    yAxisRight.tickFormat(function(d) {return $filter('number')(d); }).tickValues(domain);
                    chart.select('.axisRight').call(yAxisRight).attr('transform', "translate(" + (width - 5) + ",0)");
                  }

                  graph.select('.line').attr("d", line(data));

                  var points = graph.select('.points');
                  points.selectAll('circle').remove();
                  points.selectAll(".dot")
                    .data(data)
                    .enter().append("circle")
                    .attr("r", 4)
                    .style('display','none')
                    .attr("cx", function(d) { return roundNum(x(d.date)); })
                    .attr("cy", function(d) { return roundNum(y(d.value)); });

                  var cNode = chart.node();
                  if (cNode && cNode.parentNode) {
                    d3.select(chart.node().parentNode)
                      .on("mouseout", mouseout)
                      .on("mousemove", function() {
                        mousemove(this);
                      });
                  }


                } else {
                 $scope.chart.graphData[i][j].isActive = false;
                }
              }
            }
          }
          var circles = d3.select('.main-chart').selectAll('circle');
          if (circles.length) {
            $scope.chart.circleData = d3.select('.main-chart').selectAll('circle').data();
          }
        }

        var filteredData;


        //function for hovering over graphs
        function mousemove(self) {
          clearToolTips();
          var mouseX = d3.mouse(self)[0],
              width = $('chart').width(),
              values = $scope.chart.scale.values,
              x = d3.time.scale().range([0, width]).domain([values[0], _.last(values)]),
              bisectDate = d3.bisector(function(d) { return d.date; }).left,
              x0 = x.invert(mouseX),
              data = $scope.chart.varData,
              i = [],
              d0 = [],
              d1 = [];

          // create bisector and nearest values for each variable
          for (var k=0; k < data.length; k++) {
            if (data[k]) {
              i[k] = bisectDate(data[k], x0);
              d0[k] = data[k][i[k]-1];
              d1[k] = data[k][i[k]];
            }
          }

          // flip location of tool tip if cursor is on the right side of chart
          if (mouseX > 640) {
            $('.tooltips').css('left', (mouseX - 205));
            $('.tooltips, .date-tip').addClass('position');
          } else {
            $('.tooltips').css('left', (mouseX));
            $('.tooltips, .date-tip').removeClass('position');
          }

          // TURN ON HOVER/TOOLTIPS
          $scope.$apply(function () {
            $scope.chart.hoverActive = true;
            $scope.chart.tooltip.date = x0;
          });

          // FOR P CHART
          // pull data values and u chart if cursor is inside the data
          if (arrHasObjects(d0) && arrHasObjects(d1)) {
            // reset all circles to hidden
            var circleData = [];
            var charts = d3.select('.main-chart');
            charts.selectAll('circle').style('display','none');

            // loop through all graphs
            for (var k = 0; k < data.length; k++) {
              if (d0[k] && d1[k]) {
                // bisector select the nearest date if there are d0 and d1 for that graph
                var d = x0 - d0[k].date > d1[k].date - x0 ? d1[k] : d0[k],
                  date = roundNum(x(d.date));

                // pick the circles that match the x position of the date (x0) and make visible
                var chartNum, graphNum;
                switch (k) {
                  case 0:
                    chartNum = 0; graphNum = 0;
                    break;
                  case 1:
                    chartNum = 0; graphNum = 1;
                    break;
                  case 2:
                    chartNum = 1; graphNum = 0;
                    break;
                  case 3:
                    chartNum = 1; graphNum = 1;
                    break;
                  case 4:
                    chartNum = 2; graphNum = 0;
                    break;
                  case 5:
                    chartNum = 2; graphNum = 1;
                    break;
                  case 6:
                    chartNum = 3; graphNum = 0;
                    break;
                  case 7:
                    chartNum = 3; graphNum = 1;
                    break;
                  case 8:
                    chartNum = 3; graphNum = 2;
                    break;
                }
                var dataCircle = charts.selectAll('.chart-' + chartNum + ' .graph-' + graphNum+ ' circle[cx="' + date + '"]');
                dataCircle.style('display','block');
                circleData.push(dataCircle.data());
              }
            }

            var labelOne = circleData.filter(function (obj) {return obj[0].label === "Label 1";})[0],
                labelTwo = circleData.filter(function (obj) {return obj[0].label === "Label 2";})[0],
                labelThree = circleData.filter(function (obj) {return obj[0].label === "Label 3";})[0],
                labelFour = circleData.filter(function (obj) {return obj[0].label === "Label 4";})[0],
                labelFive = circleData.filter(function (obj) {return obj[0].label === "Label 5";})[0],
                labelSix = circleData.filter(function (obj) {return obj[0].label === "Label 6";})[0],
                labelSeven = circleData.filter(function (obj) {return obj[0].label === "Label 7";})[0],
                labelEight = circleData.filter(function (obj) {return obj[0].label === "Label 8";})[0];

            $scope.$apply(function () {
              $scope.chart.tooltipsActive = true;

              if (labelOne) {$scope.chart.tooltip.labelOne = labelOne[0].value};
              if (labelTwo) {$scope.chart.tooltip.labelTwo = labelTwo[0].value};
              if (labelThree) {$scope.chart.tooltip.labelThree = labelThree[0].value};
              if (labelFour) {$scope.chart.tooltip.labelFour = labelFour[0].value};
              if (labelFive) {$scope.chart.tooltip.labelFive = labelFive[0].value};
              if (labelSix) {$scope.chart.tooltip.labelSix = labelSix[0].value};
              if (labelSeven) {$scope.chart.tooltip.labelSeven = labelSeven[0].value};
              if (labelEight) {$scope.chart.tooltip.labelEight = labelEight[0].value};
            });
          } else {
            $scope.$apply(function () {
              $scope.chart.tooltipsActive = false;
            });
            d3.selectAll('chart circle').style('display','none');
          }
        }

        //Function for cursor leaving graphs
        function mouseout() {
          $scope.$apply(function () {
            $scope.chart.hoverActive = false;
            $scope.chart.tooltipsActive = false;
            $scope.chart.tooltipsActiveUChart = false;
          });
          $('chart circle').hide();
        }

        //function to round numbers
        function roundNum(num) {
          return Math.round(num * 100) / 100;
        }

        //calculates and sets global x axis
        function setXAxis() {
          // find latest values in data
          if (!$scope.chart.scale) {
            var dateArray = [];
            for (var i = 0; i < $scope.chart.graphData.length; i++) {
              for (var j = 0; j < $scope.chart.graphData[i].length; j++) {
                if ($scope.chart.graphData[i][j].data) {
                  var length = $scope.chart.graphData[i][j].data.length - 1;
                  dateArray.push($scope.chart.graphData[i][j].data[length].date);
                }
              }
            }
            dateArray.sort();

            var endDate = dateArray[dateArray.length - 1];

            var end = new Date(moment(endDate).add(15.5, 'hours'));
            $scope.chart.scale = {'scale': 'week',  'values': [end]};
            $scope.$watch('chart.scale', function() {
              setXAxis();
            });
          }

          // set X scale to determine tick values
          var scale = $scope.chart.scale.scale;
          var length = $scope.chart.scale.values.length - 1;
          var end = $scope.chart.scale.values[length];
          var values = [];

          // create the X tick marks for different time scales
          if (scale === 'hour') {
            for (var i = 0; i < 9; i++) {
              values.push(new Date(moment(end).subtract((i*10), 'minutes')));
            }
          } else if (scale === 'day') {
            for (var i = 0; i < 9; i++) {
              values.push(new Date(moment(end).subtract((i*4), 'hours')));
            }
          } else if (scale === 'week') {
             for (var i = 0; i < 9; i++) {
               values.push(new Date(moment(end).subtract((i), 'days')));
             }
          }

          values.reverse();
          $scope.chart.scale.values = values;
          createGraph();
        }

        // minified function for word wrapping labels on x axis'
        function wrap(t,e,a){t.each(function(){for(var t,p=d3.select(this),n=p.text().split(/\s+/).reverse(),r=[],o=0,x=1.2,s=p.attr("x"),d=a,i=0,u=p.text(null).append("tspan").attr("x",s).attr("y",d).attr("dy",i+"em");t=n.pop();)r.push(t),u.text(r.join(" ")),u.node().getComputedTextLength()>e&&(r.pop(),u.text(r.join(" ")),r=[t],u=p.append("tspan").attr("x",s).attr("y",d).attr("dy",++o*x+i+"em").text(t))})};

        //function for moving forward and backward in the chart
        $scope.changeTime = function(e) {
          var direction = $(e.currentTarget).attr('data-direction');
          var start = $scope.chart.scale.values[0];
          var end = $scope.chart.scale.values[$scope.chart.scale.values.length - 1];
          var scale = $scope.chart.scale.scale;
          var cur = new Date();
          var values = [];
          var scaleLength, timeInterval;

          if ((direction === 'back') && (new Date(start) > new Date($scope.chart.earliestDate))) {
            end = start;
          } else if ((direction === 'forward') && (new Date(end) < new Date($scope.chart.latestDate))) {
            if (scale === 'day') {
              end = moment(end).add(32, 'hours')
            } else if (scale === 'hour') {
              end = moment(end).add(80, 'minutes')
            } else if (scale === 'week') {
              end = moment(end).add(8, 'days')
            }
          }

          if (scale === 'day') {
            timeInterval = 4;
          } else if (scale === 'hour') {
            timeInterval = 10;
          } else if (scale === 'week') {
            timeInterval = 8;
          }

          scaleLength = 9;

          for (var i = 0; i < scaleLength; i++) {
            values.push(new Date(moment(end).subtract((i * timeInterval), 'minutes')));
          }

          values.reverse();

          $scope.chart.scale = {'scale': scale, 'values': values};
        }

        $scope.toggleGraph = function(e) {
          var swtch = $(e.currentTarget).attr('data-switch'),
              parent = $(e.currentTarget).parent(),
              chart = $('g[data-switch="'+swtch+'"]').parent().parent();

          $(e.currentTarget).toggleClass('enabled');
          $(e.currentTarget).toggleClass('disabled');
          $('g[data-switch="'+swtch+'"]').toggle();
          $('.tip div[data-switch="'+swtch+'"]').toggle();

          var enabledSwitches = $(parent).find('.enabled');

          if (enabledSwitches.length === 0) {
            $(chart).height(0);
            $('.tip div[data-switch="'+swtch+'"]').parent().hide();
          } else  {
            $(chart).height(130);
            $('.tip div[data-switch="'+swtch+'"]').parent().show();
          }
        }

        $scope.selectScale = function(e) {
          var scaleExisting = $scope.chart.scale.scale;
          var scaleNew = $(e.currentTarget).attr('data-scale');
          var end = $scope.chart.scale.values[$scope.chart.scale.values.length - 1];
          var values = [];
          var scaleLength, timeInterval, minutes;

          if (scaleExisting !== scaleNew) {
            $('.chart-nav .item').removeClass('selected');
            $(e.currentTarget).addClass('selected');

            if (scaleExisting === 'day' && scaleNew === 'hour') {
              minutes = 920;
              timeInterval = 10;
              end = new Date(moment(end).subtract(minutes, 'minutes'));
            } else if (scaleExisting === 'day' && scaleNew === 'week') {
              minutes = 4800;
              timeInterval = 8;
              end = new Date(moment(end).add(minutes, 'minutes'));
            } else if (scaleExisting === 'hour' && scaleNew === 'day') {
              minutes = 920;
              timeInterval = 4;
              end = new Date(moment(end).add(minutes, 'minutes'));
            } else if (scaleExisting === 'hour' && scaleNew === 'week') {
              minutes = 5720;
              timeInterval = 8;
              end = new Date(moment(end).add(minutes, 'minutes'));
            } else if (scaleExisting === 'week' && scaleNew === 'day') {
              minutes = 4800;
              timeInterval = 4;
              end = new Date(moment(end).subtract(minutes, 'minutes'));
            } else if (scaleExisting === 'week' && scaleNew === 'hour') {
              minutes = 5720;
              timeInterval = 10;
              end = new Date(moment(end).subtract(minutes, 'minutes'));
            }

            scaleLength = 9;

            for (var i = 0; i < scaleLength; i++) {
              values.push(new Date(moment(end).subtract((i * timeInterval))));
            }

            values.reverse();

            $scope.chart.scale = {'scale': scaleNew, 'values': values};
          }
        }

        //filters data for only whats viewable in time frame.
        function filterData(data) {
          var dataArray = [];
          var length = $scope.chart.scale.values.length - 1;
          var start = $scope.chart.scale.values[0];
          var end = $scope.chart.scale.values[length];
          var indices = [];
          if (data) {
            for (var i = 0; i < data.length; i++) {
              var date = data[i].date || new Date(data[i].timeOfOccurrence);
              if (date > start && date < end) {
                dataArray.push(data[i]);
                indices.push(i);
              }
            }
          } else {
            dataArray = null;
          }
          // add points just before and after the filtered array so lines continue off the page
          if (indices.length > 0) {
            var minIndex = Math.min.apply(Math, indices);
            var maxIndex = Math.max.apply(Math, indices);
            if (data[minIndex - 1]) {
              dataArray.unshift(data[minIndex - 1]);
            }
            if (data[maxIndex + 1]) {
              dataArray.push(data[maxIndex + 1]);
            }
          }
          return dataArray;
        }

        //finds earliest and latest piece of data
        function findEarliestData() {
          var data = $scope.chart.graphData;
          var dateArray = [];

          for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
              if (data[i][j].data) {
                dateArray.push(data[i][j].data[0].date);
                dateArray.push(data[i][j].data[data[i][j].data.length - 1].date);
              }
            }
          }

          dateArray = _.sortBy(dateArray.map(function(piece){ return piece; }));

          $scope.chart.earliestDate = dateArray[0];
          $scope.chart.latestDate = dateArray[dateArray.length - 1];

          setXAxis();
        }

        // tests if array has any objects in it
        function arrHasObjects(arr) {
          var isUndefined = true;
          for (var i = 0; i < arr.length; i++) {
            if (typeof arr[i] != 'undefined') {
              isUndefined = false;
            }
          }
          return ! isUndefined;
        }

        // clears tool tips
        function clearToolTips() {
          $scope.chart.tooltipsActiveUChart = false;
          $scope.chart.tooltipsActive = false;

          $scope.chart.tooltip.labelOne = null;
          $scope.chart.tooltip.labelTwo = null;
          $scope.chart.tooltip.labelThree = null;
          $scope.chart.tooltip.labelFour = null;
          $scope.chart.tooltip.labelFive = null;
          $scope.chart.tooltip.labelSix = null;
          $scope.chart.tooltip.labelSeven = null;
          $scope.chart.tooltip.labelEight = null;
        }
      }
    };
  }]);