/* Copyright 2016 General Electric Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

function init() {

	// Define a set of styles to use when the features are rendered on the map.
	var styles = {
		ed_pole : new ol.style.Style({
			image : new ol.style.Circle({
				radius : 5,
				fill : new ol.style.Fill({
					color : '#00ff00',
					opacity : 0.6
				}),
				stroke : new ol.style.Stroke({
					color : 'black',
					opacity : 0.4
				})
			})
		}),
		ed_oh_transformer : new ol.style.Style({
			image : new ol.style.RegularShape({
			  fill: new ol.style.Fill({color: 'red'}),
			  stroke: new ol.style.Stroke({color: 'black', width: 2}),
			  points: 3,
			  radius: 5,
			  rotation: 0,
			  angle: 0
			})
		}),
		ed_demand_point : new ol.style.Style({
			image : new ol.style.Circle({
				radius : 2,
				fill : new ol.style.Fill({
					color : 'green',
					opacity : 0.6
				}),
				stroke : new ol.style.Stroke({
					color : 'black',
					opacity : 0.4
				})
			})
		}),
		ed_handhole : new ol.style.Style({
			image : new ol.style.Circle({
				radius : 2,
				fill : new ol.style.Fill({
					color : 'blue',
					opacity : 0.6
				}),
				stroke : new ol.style.Stroke({
					color : 'black',
					opacity : 0.4
				})
			})
		}),
		ed_light : new ol.style.Style({
			image : new ol.style.Circle({
				radius : 2,
				fill : new ol.style.Fill({
					color : 'orange',
					opacity : 0.6
				}),
				stroke : new ol.style.Stroke({
					color : 'black',
					opacity : 0.4
				})
			})
		}),
		ed_ug_secondary_conductor : new ol.style.Style({
			fill : new ol.style.Fill({
				color : 'rgba(255, 255, 255, 0.6)'
			}),
			stroke : new ol.style.Stroke({
				color : '#319FD3',
				width : 2
			})
		}),
		ed_ug_primary_conductor : new ol.style.Style({
			fill : new ol.style.Fill({
				color : 'purple'
			}),
			stroke : new ol.style.Stroke({
				color : 'purple',
				width : 2
			})
		}),
		ed_oh_secondary_conductor : new ol.style.Style({
			fill : new ol.style.Fill({
				color : 'rgba(255, 255, 0, 0.6)'
			}),
			stroke : new ol.style.Stroke({
				color : '#319FD3',
				width : 2
			})
		}),
		ed_oh_primary_conductor : new ol.style.Style({
			fill : new ol.style.Fill({
				color : 'rgba(255, 0, 0, 0.6)'
			}),
			stroke : new ol.style.Stroke({
				color : '#319FD3',
				width : 2
			})
		}),
		sub_substation : new ol.style.Style({
			fill : new ol.style.Fill({
				color : 'rgba(0, 0, 255, 0.6)'
			}),
			stroke : new ol.style.Stroke({
				color : 'black',
				width : 2
			})
		})
	}

	// Create the array of layers adding an OpenStreetMap layer as the base map.
	var mapLayers = [
		new ol.layer.Tile({
			source : new ol.source.OSM()
		})
	];

	// Used to convert the GeoJSON data from the IMS instance into Openlayers 3 feature objects.
	var geoFormatter = new ol.format.GeoJSON({
			defaultDataProjection : 'EPSG:4326',
			projection : 'EPSG:3857'
		});

	var ohSecondaryConductorLayer, alarmCircuitID;
	var styleFunction;

	function defineAndGetLayer(layerProp) {
		// Helper function that creates Openlayers 3 layers and then populates them
		// with data from the IMS instance.
		if (layers.hasOwnProperty(layerProp)) {
			// Create a new Openlayers 3 layer.
			var lineColor, lineWidth, specialStyle = false;
			var layerName = layerProp;
			
			switch(layerProp) {
				case 'ed_oh_secondary_conductor': {
					lineColor = '#0000ff';
					lineWidth = 10;
					specialStyle = true;
					break;
				}
				case 'ed_oh_primary_conductor': {
					lineColor = '#6699ff';
					lineWidth = 7;
					specialStyle = true;
					break;
				}
				case 'ed_ug_primary_conductor': {
					lineColor = '#6699ff';
					lineWidth = 5;
					specialStyle = true;
					break;
				}
				case 'ed_ug_secondary_conductor': {
					lineColor = '#6699ff';
					lineWidth = 5;
					specialStyle = true;
					break;
				}
				default: {
					specialStyle = false;
				}
			}
			
			styleFunction = function(feature, resolution) {
				if (specialStyle) {
					if (typeof alarmCircuitID != 'undefined') {
						// If an alarm is set return a highlighted style.
						if (feature.getProperties()["Circuit ID"] == alarmCircuitID) {
							return new ol.style.Style({
								fill : new ol.style.Fill({
									color : 'rgba(10, 255, 0, 0.6)'
								}),
								stroke : new ol.style.Stroke({
									color : lineColor,
									width : lineWidth
								})
							});
						}
						else {
							// Return the normal styles.
							return styles[layerName];
						}
					} else {
						// Return the normal style.
						return styles[layerName];
					}
				}
				else {
					return styles[layerName];	
				}
			}
			
			var aLayer = new ol.layer.Vector({
					source : new ol.source.Vector({
						format : new ol.format.GeoJSON()
					}),
					style : styleFunction
				});

			aLayer.layerName = layers[layerProp];
			
			if (layerProp == 'ed_oh_secondary_conductor') {
				ohSecondaryConductorLayer = aLayer;
			}

			mapLayers.push(aLayer);

			// Fetch the layer data and add it to the layer's source.
			$.ajax({
				url : '/v1/collections/' + layerName,
				type : 'GET',
				success : function (data) {
					var features = geoFormatter.readFeatures(data, {
							dataProjection : 'EPSG:4326',
							featureProjection : 'EPSG:3857'
						});
					console.log("Collection call succeeded for /v1/collections/" + layerName + " (" + features.length + " features)");
					aLayer.getSource().addFeatures(features);
				}
			});
		}
	}

	// Defines the layers to be added to the map. The keys are the name of the collections
	// stored in the IMS instance, the values are the human-readable name of collection used
	// in the popover when the user clicks on the map.
	var layers = {
		'ed_oh_secondary_conductor' : 'Overhead Secondary Conductor',
		'ed_ug_secondary_conductor' : 'Underground Secondary Conductor',
		'ed_oh_primary_conductor' : 'Overhead Primary Conductor',
		'ed_ug_primary_conductor' : 'Underground Primary Conductor',
		'ed_handhole' : 'Handhole',
		'ed_pole' : 'Pole',
		'sub_substation' : 'Substation',
		'ed_oh_transformer' : 'Overhead Transformer',
		'ed_demand_point' : 'Demand Point',
		'ed_light' : 'Streetlight'
	}

	// Create the layers for the map.
	for (var layerProp in layers) {
		defineAndGetLayer(layerProp);
	}

	// Create an Openlayers 3 map using the layers defined above.
	var map = new ol.Map({
			layers : mapLayers,
			target : 'map',
			view : new ol.View({
				// Hardwired to centre the map over Cortland, NY.
				center : ol.proj.transform([-76.180484, 42.601181], 'EPSG:4326', 'EPSG:3857'),
				zoom : 10
			})
		});

	// Create an overlay for popups when the users clicks on the map.
	var popup = new ol.Overlay({
			element : document.getElementById('popup')
		});
	map.addOverlay(popup);

	// Add an event handler for when the user clicks on the map which raises a popover with the selected feature
	// (or the location in degrees if there is no feature at that location).
	map.on('click', function (evt) {
		var element = popup.getElement();
		var coordinate = evt.coordinate;
		var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
					coordinate, 'EPSG:3857', 'EPSG:4326'));
		var pixel = evt.pixel;
		var content = '';
		var feature;

		var feature = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
				$(element).attr("title", layer.layerName);
				return feature;
			});

		if (typeof feature != 'undefined') {
			var props = feature.getProperties();
			for (var property in props) {
				if (props.hasOwnProperty(property)) {
					if (property != "geometry") {
						if (props[property] != 'unset' && props[property] != '') {
							content += '<p>' + property + ': ' + props[property] + '</p>'
						}
					}
				}
			}
			$(element).popover('destroy');
			popup.setPosition(coordinate);
			// the keys are quoted to prevent renaming in ADVANCED_OPTIMIZATIONS mode.
			$(element).popover({
				'placement' : 'top',
				'animation' : false,
				'html' : true,
				'content' : content + '<code>' + hdms + '</code>'
			});
			$(element).popover('show');
		}
		else {
			$(element).popover('destroy');
		}
	});

	var svg;

	function createD3SvgCanvas() {
		// Creates the D3 SVG canvas used to render alarm "ripple" animations.
		var v = map.getView();
		var centre = v.getCenter();
		var pixel_size = map.getSize();
		$(".ol-viewport").append('<div id="svg-div" class="svg"></div>');
		svg = d3.select("#svg-div").append("svg")
			.attr("width", pixel_size[0])
			.attr("height", pixel_size[1]);
	}

	if ($("#svg-div").length == 0)
		createD3SvgCanvas();

	function createD3PointFromFeature(aFeature) {
		// Generates the animation of an alarm using D3.
		var pixel = map.getPixelFromCoordinate(aFeature.getGeometry().getCoordinates());

		//vector.getSource().addFeature(aFeature);

		var dot = svg.append("circle")
			.attr("class", "dot")
			.attr("transform", "translate(" + pixel[0] + "," + pixel[1] + ")")
			.attr("r", 8);

		var ease = d3.easeLinear;

		var ping = function () {
			svg.append("circle")
			.attr("class", "ring")
			.attr("transform", "translate(" + pixel[0] + "," + pixel[1] + ")")
			.attr("r", 6)
			.style("stroke-width", 3)
			.style("stroke", "blue")
			.transition()
			//.easeLinear(10)
			.duration(ease(3000))
			.style("stroke-opacity", 1e-6)
			.style("stroke-width", 1)
			.style("stroke", "lt-blue")
			.attr("r", 160)
			.remove();
		}
		var timeout = 0;
		for (var i = 0; i < 5; i++) {
			setTimeout(ping, timeout);
			timeout += 400;
		}

		setTimeout(function () {
			dot.remove();
		}, 3500);
	}

	// Set up an SSE connection.
	var eventSource = new EventSource('/events');
	var alarm = false;
	var alarmFeature;

	function drawAlarm() {
		// Callback for moveend event listener.
		if (alarm) {
			createD3PointFromFeature(alarmFeature);
			alarm = false;
		}
	}

	// Set up an event listener for when the map is panned or zoomed. It will draw an alarm (if there is one to draw)
	// over the map after it has been panned to the location of the pole that the alarm has been raised on.
	map.on('moveend', drawAlarm);

	function panAndZoom(feature) {
		// Helper function that pans the map to the alarm location (if necessary) and triggers
		// drawing of the alarm.
		alarmFeature = feature;
		var mapView = map.getView();
		var center = mapView.getCenter();
		var featureCoords = feature.getGeometry().getCoordinates();

		if (center[0] == featureCoords[0] && center[1] == featureCoords[1]) {
			// Don't need to move the map so just draw the alarm.
			drawAlarm();
		} else {
			// Move the map to a new center position and rely on moveend event to draw the alarm.
			mapView.setCenter(feature.getGeometry().getCoordinates())
		}
	}

	// Listens for SSE events generated by the server. Events of type alarm have the id of the pole
	// the alarm is raised for, so we look up the map feature with that id and use it to relocate the
	// map to its position and to draw an alarm "ripple".
	eventSource.addEventListener('alarm', function (e) {
		map.getLayers().getArray().forEach(aLayer => {
			if (typeof aLayer.layerName != 'undefined') {
				if (aLayer.layerName == "Pole") {
					var poleId = JSON.parse(e.data).poleId;
					var src = aLayer.getSource();

					var alarmPole = src.forEachFeature(function (aFeature) {
							if (aFeature.getProperties().id == poleId) {
								// Find all the OH Secondary Conductors with the same circuit id as
								// this pole.
								alarm = true;
								var id;

								id = aFeature.getProperties()["OH Secondary Conductor"];
								alarmCircuitID = aFeature.getProperties()["Circuit " + id];

								// Pan to the pole's location.
								panAndZoom(aFeature);
								return true;
							}
						});

				}
			}
		})
	})
}