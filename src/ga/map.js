goog.provide('ga.Map');

goog.require('goog.asserts');
goog.require('goog.net.Jsonp');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.dom');

goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control.ScaleLine');
goog.require('ol.interaction');
goog.require('ol.proj.EPSG21781');
goog.require('ol.source.State');
goog.require('ol.extent');
goog.require('ol.Overlay');
goog.require('ol.format.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.layer.Vector');
goog.require('ol.style.Style');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Circle');


goog.require('ga.Tooltip');
goog.require('ga.Lang');


/**
 * @classdesc
 * The map is the core component of the GeoAdmin API. In its minimal configuration it
 * needs a view, one or more geoadmin layers, and a target container:
 *
 *     var map = new ga.Map({
 *       view: new ol.View2D({
 *         center: [600000, 200000]
 *       }),
 *       layers: [
 *         ga.layer.create('ch.swisstopo.pixelkarte-farbe')
 *       ],
 *       target: 'map'
 *     });
 *
 * The above snippet creates a map with a GeoAdmin layer on a 2D view and
 * renders it to a DOM element with the id 'map'.
 * The coordinate system EPSG:21781 is automatically set.
 *
 * @constructor
 * @extends {ol.Map}
 * @param {gax.MapOptions} options Map options.
 * @todo api stable
 */
ga.Map = function(options) {

  var renderer = 'canvas';

  if (goog.isDefAndNotNull(options.renderer)) {
    renderer = options.renderer;
  }
  options.renderer = renderer;



  var view = new ol.View2D({
    resolutions: [
      650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    ],
    extent: [420000, 30000, 900000, 350000],
    projection: new ol.proj.EPSG21781(),
    center: [660000, 190000],
    zoom: 0
  });
  if (goog.isDef(options.view)) {
    // FIXME: see ol3 #1000
    if (goog.isDefAndNotNull(options.view.getCenter())) {
      view.setCenter(options.view.getCenter());
    }
    if (goog.isDef(options.view.getResolution())) {
      view.setResolution(options.view.getResolution());
    }
    if (goog.isDef(options.view.getRotation())) {
      view.setRotation(options.view.getRotation());
    }
    delete options.view;
  }
  options.view = view;
  options.ol3Logo = false;
  options.interactions = goog.isDef(options.interactions) ? options.interactions : ol.interaction.defaults();

  goog.base(this, options);

  this.addControl(new ol.control.ScaleLine());


  this.serviceUrl = window['GeoAdmin']['serviceUrl'];

  // Geocoder
  this.geocoderDialog_ = null;
  this.geocoderList_ = null;
  this.geocoderCrossElement_ = null;
  this.geocoderOverlay_ = null;
  this.createGeocoderDialog_();
  
  options.tooltip = goog.isDefAndNotNull(options.tooltip) ? options.tooltip : true;
  
  if (options.tooltip) {
    var tooltip = new ga.Tooltip();
    tooltip.setMap(this);
    this.registerDisposable(tooltip);
  }
};
goog.inherits(ga.Map, ol.Map);

/**
 * Geocode using api.geo.admin.ch
 * @param {String} text text to geocode.
 * @todo api
 */
ga.Map.prototype.geocode = function(text) {
  var jsonp = new goog.net.Jsonp(
    this.serviceUrl + '/rest/services/api/SearchServer');
  var payload = { 'searchText': text,
                  'type': 'locations',
                  'returnGeometry': true
  };
  jsonp.send(payload, 
             goog.bind(this.handleGeocode_, this), 
             goog.bind(this.handleGeocodeError_, this));
};

ga.Map.prototype.handleGeocode_ = function(response) {
  if (response['results'].length == 0) {
    alert("Geocoding failed. No result has been found.");
  }
  if (response['results'].length == 1) {
    this.recenterToResult_(response['results'][0]['attrs']);
  }
  if (response['results'].length > 1) {
    this.showGeocoderDialog_(response['results']);  
  }
};

ga.Map.prototype.handleGeocodeError_ = function(response) {
  alert("Geocoding failed. Sorry for inconvenience.");
};

/**
 * Recenter feature using api.geo.admin.ch
 * @param {String} layerId GeoAdmin id of the layer.
 * @param {String} featureId id of the feature.
 * @todo api
 */
ga.Map.prototype.recenterFeature = function(layerId, featureId) {
  var jsonp = new goog.net.Jsonp(
    this.serviceUrl + '/rest/services/api/MapServer/' +
    layerId + '/' + featureId);
  var payload = { 'geometryFormat': 'geojson' };
  jsonp.send(payload, 
             goog.bind(this.handleRecenter_, this), 
             goog.bind(this.handleRecenterError_, this));
};

ga.Map.prototype.handleRecenter_ = function(response) {
  var feature = response['feature'];
  this.recenterToFeature_(feature);
};

ga.Map.prototype.handleRecenterError_ = function(response) {
  alert("Recentering failed. No feature found. Sorry for inconvenience.");
};

ga.Map.prototype.recenterToFeature_ = function(feature) {
  var extent = feature['bbox'];
  this.getView().getView2D().fitExtent(extent, this.getSize());
  if (this.getView().getView2D().getZoom() > 7) {
    this.getView().getView2D().setZoom(7);
  }
};

/**
 * Highlight feature using api.geo.admin.ch
 * @param {String} layerId GeoAdmin id of the layer.
 * @param {String} featureId id of the feature.
 * @todo api
 */
ga.Map.prototype.highlightFeature = function(layerId, featureId) {
  var jsonp = new goog.net.Jsonp(
    this.serviceUrl + '/rest/services/api/MapServer/' +
    layerId + '/' + featureId);
  var payload = { 'geometryFormat': 'geojson' };
  jsonp.send(payload, 
             goog.bind(this.handleHighlight_, this), 
             goog.bind(this.handleHighlightError_, this));
};

ga.Map.prototype.handleHighlight_ = function(response) {
  var features = [response['feature']];
  var parser = new ol.format.GeoJSON();
  var vectorSource = new ol.source.Vector({
    projection: 'EPSG:21781',
    features: parser.readFeatures({
      type: 'FeatureCollection',
      features: features
    })
  });
  var vector = new ol.layer.Vector({
    opacity: 0.75,
    source: vectorSource,
    style: function(feature, resolution) {
      return [new ol.style.Style({
        fill: new ol.style.Fill({color: '#ffff00'}),
        stroke: new ol.style.Stroke({color: '#ff8000', width: 3}),
        image: new ol.style.Circle({
          radius: 10,
          fill: new ol.style.Fill({color: '#ffff00'}),
          stroke: new ol.style.Stroke({color: '#ff8000', width: 3})
        })
      })];
    }
  });
  this.addLayer(vector);
};

ga.Map.prototype.handleHighlightError_ = function(response) {
  alert("Highlighting failed. No feature found. Sorry for inconvenience.");
};

ga.Map.prototype.getFeature_ = function(layerId, featureId) {
};

ga.Map.prototype.createGeocoderDialog_ = function() {
  this.geocoderDialog_ = new goog.ui.Dialog('geocoder-dialog');
  this.geocoderDialog_.setTitle(ga.Lang.translate('Geocoding results'));
  this.geocoderDialog_.setModal(true);
  this.geocoderDialog_.setButtonSet(null);
};

ga.Map.prototype.showGeocoderDialog_ = function(results) {
  this.geocoderDialog_.setContent('<div id="geocoderList"></div>');
  this.geocoderDialog_.setVisible(true); 
  this.geocoderList_ = new goog.ui.Menu();
  var geocoderListContainer = goog.dom.getElement('geocoderList');
  for (var item in results) {
     this.geocoderList_.addChild(
       new goog.ui.MenuItem(results[item]['attrs']['label'].
        replace('<b>','').replace('</b>',''),
        results[item]['attrs']),true);  
  }
  goog.events.listen(this.geocoderList_,
    'action',
    goog.bind(this.handleResultSelection_,this));

  this.geocoderList_.render(geocoderListContainer); 
};

ga.Map.prototype.handleResultSelection_ = function(e) {
  var resultItem = e.target.model_;
  this.recenterToResult_(resultItem);
  this.hideGeocoderDialog_();
};

ga.Map.prototype.recenterToResult_ = function(resultItem) {
  var extent = resultItem['geom_st_box2d'];
  extent = this.parseExtent_(extent);
  var origin = resultItem['origin'];
  var originZoom = {
    'address': '10',
    'parcel': '10',
    'sn25': '8'
  };
  if (originZoom.hasOwnProperty(origin)) {
    var zoom = parseInt(originZoom[origin],10);
    var center = [(extent[0] + extent[2]) / 2,
      (extent[1] + extent[3]) / 2];
    this.getView().getView2D().setZoom(zoom);
    this.getView().getView2D().setCenter(center);
    this.addCross_(center);
  } else {
    this.getView().getView2D().fitExtent(extent,this.getSize());
  }
};

ga.Map.prototype.hideGeocoderDialog_ = function() {
  this.geocoderDialog_.setVisible(false);
};

ga.Map.prototype.parseExtent_ = function(stringBox2D) {
  var extent = stringBox2D.replace('BOX(', '')
    .replace(')', '').replace(',', ' ')
    .split(' ');
  extent = [parseFloat(extent[0]),parseFloat(extent[1]),
    parseFloat(extent[2]),parseFloat(extent[3])];
  return(extent);
};

ga.Map.prototype.addCross_ = function(center) {
  this.geocoderCrossElement_ = goog.dom.createDom(goog.dom.TagName.DIV);
  goog.dom.classes.add(this.geocoderCrossElement_, 'crosshair');
  goog.dom.classes.add(this.geocoderCrossElement_, 'cross');
  this.removeCross_();
  this.geocoderOverlay_ = new ol.Overlay({
    element: this.geocoderCrossElement_,
    position: center
  });
  this.addOverlay(this.geocoderOverlay_);
};

ga.Map.prototype.removeCross_ = function() {
  if (this.geocoderOverlay_) {
    this.removeOverlay(this.geocoderOverlay_);
  }
};
