/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2016, Codrops
 * http://www.codrops.com
 */

//list of different possible paths that can be drawn, based off of the order of the points in the HTML
var paths = [
	[1,4,7]
	//[1,2],
	//[2,1,3,0]
];

//holds the array of paths and descriptions, is filled on page load
var pathList;
var descList;

;(function(window) {

	'use strict';

	// Helper vars and functions.
	function extend(a, b) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}
	/**
	 * Throttle fn: From https://sberry.me/articles/javascript-event-throttling-and-debouncing
	 */
	function throttle(fn, delay) {
		var allowSample = true;

		return function(e) {
			if (allowSample) {
				allowSample = false;
				setTimeout(function() { allowSample = true; }, delay);
				fn(e);
			}
		};
	}
	/**
	 * Mouse position: From http://www.quirksmode.org/js/events_properties.html#position.
	 */
	function getMousePos(e) {
		var posx = 0, posy = 0;
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy };
	}
	/**
	 * Distance between two points P1 (x1,y1) and P2 (x2,y2).
	 */
	function distancePoints(x1, y1, x2, y2) {
		return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
	}
	/**
	 * Equation of a line.
	 */
	function lineEq(y2, y1, x2, x1, currentVal) {
		// y = mx + b
		var m = (y2 - y1) / (x2 - x1),
			b = y1 - m * x1;

		return m * currentVal + b;
	}

	var docScrolls = {left : document.body.scrollLeft + document.documentElement.scrollLeft, top : document.body.scrollTop + document.documentElement.scrollTop};

	/**
	 * Point obj.
	 */
	function Point(el, bgEl, wrapper, options) {
		this.el = el;
		this.wrapper = wrapper;
		// Options/Settings.
		this.options = extend( {}, this.options );
		extend( this.options, options );
		// A Point obj has a background element (img, video, ..) and a point/position (x,y) in the canvas.
		this.bgEl = bgEl;
		// The position of the point.
		this.position = this._updatePosition();
		// When the mouse is dmax away from the point, its image gets opacity = 0.
		this.dmax = this.options.viewportFactor != -1 && this.options.viewportFactor > 0 ? this.wrapper.offsetWidth/this.options.viewportFactor : this.options.maxDistance;
		if( this.dmax < this.options.activeOn ) {
			this.options.activeOn = this.dmax-5; // todo
		}
		// Init/Bind events.
		this._initEvents();
	}
	
	// Loads glowing blue halo around new points
	function loadNewPoints(){
		// finds each point with the "point-new" class
		$( ".point-new" ).each(function( index ) {
			//creates a circle at the point's x and y location
  var highlight = document.createElementNS("http://www.w3.org/2000/svg","circle");
		highlight.setAttributeNS(null,"cx",parseInt(this.attributes.cx.nodeValue));
    highlight.setAttributeNS(null,"cy",parseInt(this.attributes.cy.nodeValue));
		highlight.setAttributeNS(null,"fill","transparent");
		highlight.setAttributeNS(null,"stroke-width",5);
			highlight.setAttributeNS(null,"class","highlight");
			highlight.setAttributeNS(null,"r",15);
			highlight.setAttributeNS(null,"stroke","#02B3EE");
			// add to the list of points
			document.getElementById("points").appendChild(highlight);
});
	}
	
	//Loads the rainbow circle around a point, takes the x and y value of the point as parameters
	function createCircle(x,y)
{
	//each segment of the circle is its own circle svg, placed in an array
	var donuts = new Array(9)
	
	//loop through the array
	for (var i=0;i<9;i++){
		donuts[i]=document.createElementNS("http://www.w3.org/2000/svg","circle");
		donuts[i].setAttributeNS(null,"id","d".concat(i.toString()));
		donuts[i].setAttributeNS(null,"cx",parseInt(x));
    donuts[i].setAttributeNS(null,"cy",parseInt(y));
		donuts[i].setAttributeNS(null,"fill","transparent");
		donuts[i].setAttributeNS(null,"stroke-width",3);
		//each ring of circles has different radius values, and dash-array values
		//dash array defines what percentage of a full circle is being drawn
		//for example the inner circle has a radius of 15.91549, 2*pi*15.91549
		//gives a circumfrence of 100 pixels for the circle, so defining the dasharray as 31 69 means that 31% of 100 pixels is drawn, and 69% is transparent.
		if (i<3){
					donuts[i].setAttributeNS(null,"r",15.91549);
					donuts[i].setAttributeNS(null,"stroke-dasharray","31 69");
		}
		//middle ring
		else if (i<6){
			donuts[i].setAttributeNS(null,"r",19.853);
			donuts[i].setAttributeNS(null,"stroke-dasharray","39.185019 85.555059");
		}
		//outer ring
		else{
			donuts[i].setAttributeNS(null,"r",23.76852);
			donuts[i].setAttributeNS(null,"stroke-dasharray","47.335504 102.006512");
		}
		//each point is added to the points SVGs, use insertBefore so that it is drawn below the points rather than above, which allows for click events to still occur
		    document.getElementById("points").insertBefore(donuts[i],document.getElementById("points").childNodes.item(0));
	}
	//each point has its own colour, dash offset and class. Dash offset is how far from the starting point (top of the circle) to begin drawing the segment
	//each class relates to a different css animation because each animation has a different starting point. Animations are defined in component.css
donuts[0].setAttributeNS(null,"stroke-dashoffset","58.33333" );
						donuts[0].setAttributeNS(null,"class","spin1");
donuts[1].setAttributeNS(null,"stroke-dashoffset","25");
							donuts[1].setAttributeNS(null,"class","spin2");
donuts[2].setAttributeNS(null,"stroke-dashoffset","91.66667" );
							donuts[2].setAttributeNS(null,"class","spin3");
donuts[3].setAttributeNS(null,"stroke-dashoffset","41.18502" );
	donuts[3].setAttributeNS(null,"class","spin4");
donuts[4].setAttributeNS(null,"stroke-dashoffset","82.76505" );
	donuts[4].setAttributeNS(null,"class","spin5");
donuts[5].setAttributeNS(null,"stroke-dashoffset","124.34508");
	donuts[5].setAttributeNS(null,"class","spin6");
donuts[6].setAttributeNS(null,"stroke-dashoffset","56.3355");
	donuts[6].setAttributeNS(null,"class","spin7");
donuts[7].setAttributeNS(null,"stroke-dashoffset","106.11618");
	donuts[7].setAttributeNS(null,"class","spin8");
donuts[8].setAttributeNS(null,"stroke-dashoffset","155.89685");
	donuts[8].setAttributeNS(null,"class","spin9");
donuts[0].setAttributeNS(null,"stroke","#115D6B");
donuts[1].setAttributeNS(null,"stroke","#D90981");
donuts[2].setAttributeNS(null,"stroke","#4A3485");
donuts[3].setAttributeNS(null,"stroke","#F51424");
donuts[4].setAttributeNS(null,"stroke","#0BA599");
donuts[5].setAttributeNS(null,"stroke","#1077B5");
donuts[6].setAttributeNS(null,"stroke","#FA893D");
donuts[7].setAttributeNS(null,"stroke","#87C537");
donuts[8].setAttributeNS(null,"stroke","#02B3EE");
} 
	
	//When the mouse moves off of a point, the hover SVG needs to be deleted
		function deleteCircle()
{
	//get each of the 9 ring segment SVGs and delete them
		for (var i=0;i<9;i++){
			 document.getElementById("d".concat(i.toString())).remove();
		}
	
	//remove any paths that have been drawn 
	var pathLength = pathList.length;
	for(var i2 =0;i2<pathLength;i2++)
		pathList[0].remove();
}
	
	//Create a path on hover if it exists
	function createPath(path, points){
		//list of paths, as defined by the paths variable at the top of this page
		paths.forEach(function(item, index){
			//variable to keep track of if the current point exists in any of the paths
	  var found = 0;
			//Create SVG element for the path
		var newPath = document.createElementNS("http://www.w3.org/2000/svg","path");
		newPath.setAttributeNS(null,"stroke","#000000");
		newPath.setAttributeNS(null,"stroke-width",2);
		newPath.setAttributeNS(null,"fill","transparent");
		newPath.setAttributeNS(null,"class","path");
			//d is how the SVG is drawn, "M" stands for "MoveTo" which is where to begin drawing
		var d = "M";
									item.forEach(function(item2, index2){
										//if the point currently being hovered over exists in one of the paths, set the found variable to 1
										if (item2==path)
											found = 1;
										//other than the very first time it is found, we want to add an "L" which stands for "LineTo" to our d variable
										if (found){
														if (found>1)
															d= d.concat("L");
											//Adds the x and y values to the current path being drawn
			d = d.concat(parseInt(points[item2].el.attributes.cx.nodeValue));
			d = d.concat(" ");
			d = d.concat(parseInt(points[item2].el.attributes.cy.nodeValue));
			d = d.concat(" ");
											//indicates that we are beyond the first element so we need to add an "L" before each set of co-ordinates so it knows to draw a line
											found+=1;
										}
										});
			//if it has created a path, the d variable will contain more than just the "M" character. Otherwise, there is no path
			if(d.length>1){
					newPath.setAttributeNS(null,"d",d);
				//dash array and dash offset have to be set to the total length of the path in order for the animation defined in component.css to work
		 newPath.setAttributeNS(null,"stroke-dasharray", newPath.getTotalLength());
	  newPath.setAttributeNS(null,"stroke-dashoffset", newPath.getTotalLength());
				//once again, draw the SVG behind the existing points using "insertBefore" so you can still click on them
				document.getElementById("points").insertBefore(newPath,document.getElementById("points").childNodes.item(0));
			}
									});
	}

	// Check if a classList contains a substring
	function containsSubStr(classList, substr) {
		for (var i=0, l=classList.length; i<l; ++i) {
			if (classList[i].includes(substr)) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Point options/settings.
	 */
	Point.prototype.options = {
		// Maximum opacity that the bgEl can have.
		maxOpacity : 1,
		// When the mouse is [activeOn]px away from the point, its image gets opacity = this.options.maxOpacity.
		activeOn : 5,
		// The distance from the mouse pointer to a Point where the opacity of the background element is 0.
		maxDistance : 100, 
		// If viewportFactor is different than -1, then the maxDistance will be overwritten by [window´s width / viewportFactor]
		viewportFactor : -1,
		onActive : function() { return false; },
		onInactive : function() { return false; },
		onClick : function() { return false; }
	};

	/**
	 * Initialize/Bind events.
	 */
	Point.prototype._initEvents = function() {
		var self = this;

		// Mousemove event.
		this._throttleMousemove = throttle(function(ev) {
			requestAnimationFrame(function() {
				// Mouse position relative to the mapEl.
				var mousepos = getMousePos(ev);
				// Calculate the opacity value.
				if( self.bgEl ) {
					// Distance from the position of the point to the mouse position.
					var distance = distancePoints(mousepos.x - docScrolls.left, mousepos.y - docScrolls.top, self.position.x - docScrolls.left, self.position.y - docScrolls.top),
						// Convert this distance to a opacity value. (distance = 0 -> opacity = 1).
						opacity = self._distanceToOpacity(distance);

					self.bgEl.style.opacity = opacity;
					
					
					// Callback
					if( !self.isActive && opacity === self.options.maxOpacity ) {
						self.options.onActive();
						self.isActive = true;
					}
					
					if( opacity !== self.options.maxOpacity && self.isActive ) {
						self.options.onInactive();
						self.isActive = false;
					}
				}
			});
		}, 20);
		this.wrapper.addEventListener('mousemove', this._throttleMousemove);

		// Clicking a point.
		this._click = function(ev) {
			// Callback.
			self.options.onClick();
		};
		this.el.addEventListener('click', this._click);

		// Window resize.
		this._throttleResize = throttle(function() {
			// Update Point´s position.
			self.position = self._updatePosition();
			// Update dmax
			if( self.options.viewportFactor != -1 && self.options.viewportFactor > 0 ) {
				self.dmax = self.wrapper.offsetWidth/self.options.viewportFactor;
			}
		}, 100);
		window.addEventListener('resize', this._throttleResize);
	};

	/**
	 * Update Point´s position.
	 */
	Point.prototype._updatePosition = function() {
		var rect = this.el.getBoundingClientRect(), bbox = this.el.getBBox();
		// Also update origins..
		this.el.style.transformOrigin = this.el.style.WebkitTransformOrigin = (bbox.x + rect.width/2) + 'px ' + (bbox.y + rect.height) + 'px';
		return {x : rect.left + rect.width/2 + docScrolls.left, y : rect.top + rect.height/2 + docScrolls.top};
	};

	/**
	 * Maps the distance to opacity.
	 */
	Point.prototype._distanceToOpacity = function(d) {
		return Math.min(Math.max(lineEq(this.options.maxOpacity, 0, this.options.activeOn, this.dmax, d), 0), this.options.maxOpacity);
	};

	/**
	 * Hides the Point.
	 */
	Point.prototype.hide = function() {
		lunar.addClass(this.el, 'point--hide');
				$( ".highlight" ).each(function( index ) {
					lunar.addClass(this, 'highlight--hide');
});
	};

	/**
	 * 
	 */
	Point.prototype.show = function() {
		lunar.removeClass(this.el, 'point--hide')
						$( ".highlight" ).each(function( index ) {
					lunar.removeClass(this, 'highlight--hide');
});
	};

	/**
	 * 
	 */
	Point.prototype.pause = function() {
		this.wrapper.removeEventListener('mousemove', this._throttleMousemove);
	};

	/**
	 * 
	 */
	Point.prototype.resume = function() {
		this.wrapper.addEventListener('mousemove', this._throttleMousemove);
	};

	/**
	 * PointsMap obj.
	 */
	function PointsMap(el, options) {
		this.el = el;
		// Options/Settings.
		this.options = extend( {}, this.options );
		extend( this.options, options );
		
		// Backgrounds container.
		this.bgsWrapper = this.el.querySelector('.backgrounds');
		if( !this.bgsWrapper ) { return; }
		
		// Background elements.
		this.bgElems = [].slice.call(this.bgsWrapper.querySelectorAll('.background__element'));
		// Total background elements.
		this.bgElemsTotal = this.bgElems.length;
		if( this.bgElemsTotal <= 1 ) { return; }
		
		// Points container.
		this.pointsWrapper = this.el.querySelector('.points');
		if( !this.pointsWrapper || getComputedStyle(this.pointsWrapper, null).display === 'none' ) { return; }

		// Points tooltips
		this.tooltips = [].slice.call(this.el.querySelector('.points-tooltips').children);

		// Points´s content
		this.pointsContentWrapper = this.el.querySelector('.points-content');
		this.contents = [].slice.call(this.pointsContentWrapper.children);

		// Init..
		this._init();
	}

	//Scrolls the page smoothly down when a point is clicked so that the description can be read
	function slowScrollDown(){
		 $('html, body').animate({
        scrollTop: ($("#help").offset().top-250)
      }, 800);
	}
	
	//Scrolls the page slowly back up after closing
		function slowScrollUp(){
		 $('html, body').animate({
        scrollTop: 0
      }, 800);
	}
	
	/**
	 * PointsMap options/settings.
	 */
	PointsMap.prototype.options = {
		// Maximum opacity that the background element of a Point can have when the point is active (mouse gets closer to it).
		maxOpacityOnActive : 0.7,
		// The distance from the mouse pointer to a Point where the opacity of the background element is 0.
		maxDistance : 100, 
		// If viewportFactor is different than -1, then the maxDistance will be overwritten by [point´s parent width / viewportFactor]
		viewportFactor : 9,
		// When the mouse is [activeOn]px away from one point, its image gets opacity = point.options.maxOpacity.
		activeOn : 20
	};

	/**
	 * Init.
	 */
	PointsMap.prototype._init = function() {
		var self = this, 
			onLoaded = function() {
				// Create the Points.
				self._createPoints();
			};

		// Preload all images.
		imagesLoaded(this.bgsWrapper, { background: true }, onLoaded);
		
		
		loadNewPoints();

		// Init/Bind events.
		this._initEvents();
	};

	/**
	 * Init/Bind events.
	 */
	PointsMap.prototype._initEvents = function() {
		var self = this;
		
		//loading content
		 pathList = document.getElementsByClassName("path");
		 descList = document.getElementsByClassName("job_description");
		// Window resize.
		this._throttleResize = throttle(function() {
			// Update Document scroll values.
			docScrolls = {left : document.body.scrollLeft + document.documentElement.scrollLeft, top : document.body.scrollTop + document.documentElement.scrollTop};
		}, 100);
		window.addEventListener('resize', this._throttleResize);

		// Close content.
		this._closeContent = function() {
			var currentPoint = self.points[self.currentPoint];
			currentPoint.isActive = false;
			// Hide Point´s bgEl.
			currentPoint.bgEl.style.opacity = 0;
			// Hide Content
			self.pointsContentWrapper.classList.remove('points-content--open');
			self.contents[self.currentPoint].classList.remove('point-content--current');
			// Start mousemove event on Points.
			self._pointsAction('resume');
			// Show all points.
			self._pointsAction('show');
			
								document.getElementById("point-close").classList.add('close-hidden');
			if (self.currentPoint<descList.length)
			descList[self.currentPoint].classList.add('hidden');
			
			//show help dialog again when closing point content
			$("#help").removeClass('hidden');
			slowScrollUp();
		};
		document.getElementById("point-close").addEventListener('click', this._closeContent);
		
		// Keyboard navigation events.
		this.el.addEventListener('keydown', function(ev) {
			var keyCode = ev.keyCode || ev.which;
			if( keyCode === 27 ) {
				self._closeContent();
			}
		});
	};

	/**
	 * Create the Points.
	 */
	PointsMap.prototype._createPoints = function() {
		this.points = [];

		var self = this;
		[].slice.call(this.pointsWrapper.querySelectorAll('.point')).forEach(function(point, pos) {
			var bgVal = 0;
			//Depending on the job code of the point, a different background element should be highlighted. There are 28 squares on the map to choose from
		 if (containsSubStr(point.classList, "PSM") )bgVal=1;
else if (containsSubStr(point.classList, "HSTM"))bgVal=2;
else if (containsSubStr(point.classList, "HEDM"))bgVal=3;
else if (containsSubStr(point.classList, "HIAM"))bgVal=4;
else if (containsSubStr(point.classList, "IGM") )bgVal=5;
else if (containsSubStr(point.classList, "BIM") )bgVal=6;
else if (containsSubStr(point.classList, "DQA") )bgVal=7;
else if (containsSubStr(point.classList, "PSA") )bgVal=8;
else if (containsSubStr(point.classList, "HSTA"))bgVal=9;
else if (containsSubStr(point.classList, "HEDA"))bgVal=10;
else if (containsSubStr(point.classList, "HIAA"))bgVal=11;
else if (containsSubStr(point.classList, "IGA") )bgVal=12;
else if (containsSubStr(point.classList, "BIA") )bgVal=13;
else if (containsSubStr(point.classList, "DQI") )bgVal=14;
else if (containsSubStr(point.classList, "PSI") )bgVal=15;
else if (containsSubStr(point.classList, "HSTI"))bgVal=16;
else if (containsSubStr(point.classList, "HEDI"))bgVal=17;
else if (containsSubStr(point.classList, "HIAI"))bgVal=18;
else if (containsSubStr(point.classList, "IGI") )bgVal=19;
else if (containsSubStr(point.classList, "BII") )bgVal=20;
else if (containsSubStr(point.classList, "DQE") )bgVal=21;
else if (containsSubStr(point.classList, "PSE") )bgVal=22;
else if (containsSubStr(point.classList, "HSTE"))bgVal=23;
else if (containsSubStr(point.classList, "HEDE"))bgVal=24;
else if (containsSubStr(point.classList, "HIAE"))bgVal=25;
else if (containsSubStr(point.classList, "IGE") )bgVal=26;
else if (containsSubStr(point.classList, "BIE") )bgVal=27;
			var p = new Point(point, self.bgElems[bgVal], self.el, {
				maxOpacity : self.options.maxOpacityOnActive, 
				activeOn : self.options.activeOn, 
				maxDistance : self.options.maxDistance, 
				viewportFactor : self.options.viewportFactor, 
				onActive : function() {
					if(self.contents[pos]!=null){
					// Add class active (scales up the pin and changes the fill color).
					lunar.addClass(self.points[pos].el, 'point--active');
					//create rainbow hover
					createCircle(self.points[pos].el.attributes.cx.nodeValue,self.points[pos].el.attributes.cy.nodeValue);
					createPath(pos, self.points);
					// Hide all other points.
					self._pointsAction('hide', pos);
					}
										// Show tooltip.
					var tooltip = self.tooltips[pos];
					tooltip.classList.add('point-tooltip--current');
					// Position tooltip.
					var rect = self.points[pos].el.getBoundingClientRect(),
						bounds = self.el.getBoundingClientRect();

					tooltip.style.left = rect.left - bounds.left + rect.width/2 + 'px';
					tooltip.style.top = rect.top - bounds.top + rect.height + 'px';
				},
				onInactive : function() {
										if(self.contents[pos]!=null){
					lunar.removeClass(self.points[pos].el, 'point--active');
					//delete rainbox hover
					deleteCircle();
					// Show all points.
					self._pointsAction('show', pos);
										}
					// Hide tooltip.
					self.tooltips[pos].classList.remove('point-tooltip--current');
				},
				onClick : function() {
					self.currentPoint = pos;
					lunar.removeClass(self.points[pos].el, 'point--active');
					// Hide the current point (and all other points).
					self._pointsAction('hide');
					//delete rainbow hover
					deleteCircle();
					// Hide tooltip.
					self.tooltips[pos].classList.remove('point-tooltip--current');
					// Stop mousemove event on Points.
					self._pointsAction('pause');
					// Show Point´s bgEl.
					self.points[pos].bgEl.style.opacity = 1;
					// Show content.
					self.pointsContentWrapper.classList.add('points-content--open');
					self.contents[pos].classList.add('point-content--current');
					// Change the description
					if (pos<descList.length)
					descList[pos].classList.remove('hidden');
					
										slowScrollDown();
					//hide help content when clicking a point
					$("#help").addClass('hidden');
					
					document.getElementById("point-close").classList.remove('close-hidden');
					
				}
			});
			if (containsSubStr(point.classList, "point-hover") ){
				p.activeOn = 100;
			p.maxDistance = 200;}
			self.points.push(p);
						if(self.contents[pos]==null)
				self.points[pos].el.removeEventListener('click',self.points[pos]._click);
		});	
	};
	


	/**
	 * Calls a Point´s fn. Excludes the point with index = excludedPoint.
	 */
	PointsMap.prototype._pointsAction = function(action, excludedPoint) {
		for(var i = 0, len = this.points.length; i < len; ++i) {
			if( i !== excludedPoint ) {
				this.points[i][action]();
			}
		}
	};

	window.PointsMap = PointsMap;
	document.documentElement.className = 'js';

})(window);