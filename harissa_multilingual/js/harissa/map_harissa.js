var map;
var osm_background;
var esri_background;
var mousePositionControl;
var scaleline;
var wms_url="https://edit.africamuseum.be/geoserver/harissa/wms?";
var wfs_url="https://edit.africamuseum.be/geoserver/harissa/wfs?";
var name_layer_territoires='harissa:territoires_harissa';
var wms_layers_territoires;
var name_layer_provinces='harissa:provinces_harissa';
var wms_layers_provinces;
var name_layer_secteurs='harissa:mv_secteurs_harissa';
var name_field_secteurs='secteur';
var wms_layers_secteurs;
var name_layer_aleas='harissa:mv_aleas_harissa_with_date_all';
var name_field_territories="territoire";
var name_field_types="type";
var wms_cluster_seismes;
var wms_layers_seismes;
var wfs_layers_seismes;


var url_list_provinces= wfs_url + "service=WFS&version=1.0.0&request=GetFeature&typename="+name_layer_provinces+"&PROPERTYNAME=nom&outputFormat=application%2Fjson";
var url_list_secteurs= wfs_url + "service=WFS&version=1.0.0&request=GetFeature&typename="+name_layer_aleas+"&PROPERTYNAME="+name_field_secteurs+"&outputFormat=application%2Fjson";
var url_list_territoires= wfs_url + "service=WFS&version=1.0.0&request=GetFeature&typename="+name_layer_aleas+"&PROPERTYNAME="+ name_field_territories+"&outputFormat=application%2Fjson";
var url_list_types= wfs_url + "service=WFS&version=1.0.0&request=GetFeature&typename="+name_layer_aleas+"&PROPERTYNAME="+ name_field_types +"&outputFormat=application%2Fjson";

var displayed_layers=Array();
var removed_layers=Array();

var displayed_layer;
var disaster_loaded=false;
//var popup_text;
//popup
var overlay;
var container = null;
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var download_url;

var language="fr";


var init_document=function(p_document, p_language)
{
	container = p_document.getElementById('popup');
	content = p_document.getElementById('popup-content');
	closer = p_document.getElementById('popup-closer');
	 
	language=p_language;
	init_general();
}

var openDescription=function(id)
{
	window.open('description.html?id='+ id,'_blank');
}
	
 var init_overlay=function()
 {
	 
	overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
              element: container,
                    autoPan: true,
                    autoPanAnimation: {
                      duration: 250
                    }
                  }));
                  

     closer.onclick = function() {
                    overlay.setPosition(undefined);
                    closer.blur();
                    return false;
                  };
     map.addOverlay(overlay);
 } 
 
 
var parse_wfs_list=function(url, attribute, sel2, extra_url="", refresh=false)
 {
  
	if(extra_url.length>0)
	{
		console.log("additional");
		url=url+extra_url;
	}
	console.log(url);
	var list=$.getJSON( url, function( data ) {
		var items=[];
		var returned=[];
		var features=data["features"];
		//console.log("features : ");
		//console.log(features);
		for(var i=0; i<features.length;i++)
		{
			var tmp=features[i];
			//console.log("tmp (dans boucle) : ");
			//console.log(tmp);
			var tmp2=tmp["properties"][attribute];
			if(!items.includes(tmp2))
			{
				items.push(tmp2);
				
			}
		}
		//console.log("items non triés");
		//console.log(items);
		items.sort();
		//console.log("items triés");
		//console.log(items);
		for(var i=0; i<items.length;i++)
		{
			var tmp_dict={};
			var tmp2=items[i];
			tmp_dict["id"]=tmp2;
			tmp_dict["text"]=tmp2;
			returned.push(tmp_dict);
		}
		//console.log("select 2:");
		//console.log(returned);
		
		//initialisé dans l'Ajax pour synchroniser
		if(refresh)
		{	
		
			$(sel2).select2().empty().select2({
			  data: returned,			 
			})
		}
		else
		{
			console.log("init");
			$(sel2).select2({
			  data: returned,
			  multiple:true
			})
		}				
	});
	
	
 }
 
function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}
function analyze_result(json_data)
{
	var count_result=json_data["features"].length;
	console.log(count_result)
	var nb_morts=0;
	var nb_blesses=0;
	var nb_sans_abris=0;
	var flag_morts=false;
	var flag_blesses=false;
	var flag_abris=false;
	for(var i=0;i<count_result;i++)
	{
		var tmp_prop=json_data["features"][i]["properties"];
		if(isInt(tmp_prop["nmort"]))
		{
			nb_morts=nb_morts+parseInt(tmp_prop["nmort"]);
			flag_morts=true;
		}
		if(isInt(tmp_prop["nblesse"]))
		{
			nb_blesses=nb_blesses+parseInt(tmp_prop["nblesse"]);
			flag_blesses=true;
		}
		if(isInt(tmp_prop["nsansabris"]))
		{
			nb_sans_abris=nb_sans_abris+parseInt(tmp_prop["nsansabris"]);
			flag_abris=true;
		}
	}
	if(! flag_morts)
	{
		nb_morts="non défini";
	}
	if(! flag_blesses)
	{
		nb_blesses="non défini";
	}
	if(! flag_abris)
	{
		nb_sans_abris="non défini";
	}
	return {
		"count_result": count_result,
		"nb_morts":nb_morts,
		"nb_blesses":nb_blesses,
		"nb_sans_abris":nb_sans_abris
	}
}
function init_wfs(cql_filter)
{
	
	 
	      parse_wfs_list(url_list_provinces,"nom", "#provinces");
		  parse_wfs_list(url_list_territoires,"territoire", "#territoires");
		  parse_wfs_list(url_list_secteurs,name_field_secteurs, "#secteurs");
		 var tmp_url="./lang/type_disaster_fr.json";		  
		 if(language=="fr")
		 {
			var tmp_url="./lang/type_disaster_fr.json";
		 }
		 else if(language=="nl")
		 {
			var tmp_url="./lang/type_disaster_nl.json";
		 }
		 else if(language=="en")
		 {
			var tmp_url="./lang/type_disaster_en.json";
		 }
		  //parse_wfs_list(url_list_types,"type", "#categ");
		  $("#categ").select2({
			multiple:true,
			ajax: {
				dataType: "json",
				url:tmp_url
			}
		  });
		 
	      if(disaster_loaded)
		  {
		    //console.log("enlève");
			map.removeLayer(displayed_layer);
			//displayed_layer=null;
		  }
		  
		  var json_url=null;
		  if(cql_filter.length==0)
		  {
			json_url=wfs_url +
						  'version=1.1.0&request=GetFeature&typename='+ name_layer_aleas +'&' +
						  'outputFormat=application/json&srsname=EPSG:3857';
		    download_url=wfs_url +
						  'version=1.1.0&request=GetFeature&typename='+ name_layer_aleas +'&' +
						  'outputFormat=csv&srsname=EPSG:3857';
						  
			$("#download_csv").attr("href", download_url);
		  }
		  else
		  {
			json_url=wfs_url +
						  'version=1.1.0&request=GetFeature&typename='+ name_layer_aleas +'&' +
						  'outputFormat=application/json&srsname=EPSG:3857&' +
						  'CQL_FILTER=' + cql_filter						  
						;
			download_url=wfs_url +
						  'version=1.1.0&request=GetFeature&typename='+ name_layer_aleas +'&' +
						  'outputFormat=csv&srsname=EPSG:3857&' +
						  'CQL_FILTER=' + cql_filter						  
						;
			$("#download_csv").attr("href", download_url);
		  }
		  
		  $.getJSON( json_url, function( data ) {
				var result_metadata=analyze_result(data);
				
				if(language=="fr")
				 {
					$("#desc_search").html("<div class='row'><div class='col-md-3'>Nombre d'évènements</div><div class='col-md-9'>"+result_metadata["count_result"]+"</div><div class='col-md-3'>Nombre de morts</div><div class='col-md-9'>"+result_metadata["nb_morts"]+"</div><div class='col-md-3'>Nombre de blessés</div><div class='col-md-9'>"+result_metadata["nb_blesses"]+"</div><div class='col-md-3'>Nombre de sans-abris</div><div class='col-md-9'>"+result_metadata["nb_sans_abris"]+"</div></div>");
				 }
				 else if(language=="nl")
				 {
					$("#desc_search").html("<div class='row'><div class='col-md-3'>Aantal gebeurtenissen</div><div class='col-md-9'>"+result_metadata["count_result"]+"</div><div class='col-md-3'>Aantal doden</div><div class='col-md-9'>"+result_metadata["nb_morts"]+"</div><div class='col-md-3'>Aantal gewonden</div><div class='col-md-9'>"+result_metadata["nb_blesses"]+"</div><div class='col-md-3'>Aantal daklozen</div><div class='col-md-9'>"+result_metadata["nb_sans_abris"]+"</div></div>");
				 }
				 else if(language=="en")
				 {
					$("#desc_search").html("<div class='row'><div class='col-md-3'>Amount events</div><div class='col-md-9'>"+result_metadata["count_result"]+"</div><div class='col-md-3'>Amount deaths</div><div class='col-md-9'>"+result_metadata["nb_morts"]+"</div><div class='col-md-3'>Amount wounded persons</div><div class='col-md-9'>"+result_metadata["nb_blesses"]+"</div><div class='col-md-3'>Amount homelesses</div><div class='col-md-9'>"+result_metadata["nb_sans_abris"]+"</div></div>");
				 }
				console.log(result_metadata);
				var vectorSource = new ol.source.Vector({
					features: new ol.format.GeoJSON().readFeatures(data)
				});

				var clusterSource = new ol.source.Cluster({
				  distance: 40,
				  source: vectorSource,
				});
				 var styleCache = {};
				 var styleCache_coords = {};
				 
		  displayed_layer = new ol.layer.Vector({		  
		   source: clusterSource,		   
		   format: new ol.format.GeoJSON({dataProjection: 'EPSG:4326'}),		 
     	  style: function (feature_tmp) {		  
		    var data_zoom_level=feature_tmp.get('features');	
	
			var size = feature_tmp.get('features').length;	
				    var col_def='#3399CC';					
					var style=null;				  
					for(var i=0; i<size;i++)
					{
						var type_geo_ref=data_zoom_level[i].get("type_georef");
						if(type_geo_ref!='no_coords')
						{
						 col_def='#339900';
						}
					}
					if(col_def=='#3399CC')
					{
						style=styleCache[size];
					}
					else if(col_def=='#339900')
					{
						style=styleCache_coords[size] ;
					}
					if (!style) 
					{	 
					  
					  style = new ol.style.Style({
						image: new ol.style.Circle({
						  radius: 15,
						  stroke: new ol.style.Stroke({
							color: '#fff',
						  }),
						  fill: new ol.style.Fill({
							color: col_def,
						  }),
						}),
						text: new ol.style.Text({
						  text: size.toString(),
						  fill: new ol.style.Fill({
							color: '#fff',
						  }),
						}),
					  });
					  if(col_def=='#3399CC')
					  {
						styleCache[size] = style;
					  }
					  else if(col_def=='#339900')
					  {
						styleCache_coords[size] = style;
					  }
					}
					return style;
				  }
				  
				});
						
				map.addLayer(displayed_layer);
				displayed_layers.push("display_aleas");
				disaster_loaded=true;
				var extent = vectorSource.getExtent();
				
				
				if(isFinite(extent[0]))
				{
					 map.getView().fit(extent, map.getSize());
					   if(map.getView().getZoom()>10)
					   {
						 map.getView().setZoom(10);
					   }
					   if(map.getView().getZoom()>1)
					   {
						   map.getView().setZoom(map.getView().getZoom()-1);
					   }
				}
							
				
		  });
}

//pop up helper
function isCluster(feature) {
      if (!feature || !feature.get('features')) { 
            return false; 
      }
      return feature.get('features').length >= 1;
    }
  

function init()
{
	osm_background=new ol.layer.Tile(
			{
			source: new ol.source.OSM(),
			visible: false,
			
			}
		);
	esri_background=new ol.layer.Tile(
			{
			visible: true,
			source: new ol.source.XYZ(
				{
				attributions:
				'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
					'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
					url:'https://server.arcgisonline.com/ArcGIS/rest/services/' +
					'World_Imagery/MapServer/tile/{z}/{y}/{x}'
				}
			)
			}
		);
	//position mouse
	 mousePositionControl = new ol.control.MousePosition({
	  
	  projection: 'EPSG:4326',
	  // comment the following two lines to have the mouse position
	  // be placed within the map.
	  className: 'custom-mouse-position',
	  target: document.getElementById('mouse-position'),
	  undefinedHTML: '&nbsp;',
	});
	
	//barre échelle
	 scaleline =new ol.control.ScaleLine({
      //units: unitsSelect.value,
    });
	
	//WMS
	var init_src_wms=function(url, name_layer)
	{
		var tmp_layer;
		tmp_layer=new ol.source.TileWMS(
		{
			url: url ,
			serverType: 'geoserver',
			params: {'LAYERS':name_layer , 'TILED': true},
			transition: 0,
		}
		);

		return tmp_layer;
	}
   
    wms_layers_territoires = new ol.layer.Tile(
		{
			source: init_src_wms(wms_url, name_layer_territoires)
		}
	);
	
	wms_layers_provinces = new ol.layer.Tile(
		{
			source: init_src_wms(wms_url, name_layer_provinces)
		}
	);
	
	wms_layers_secteurs = new ol.layer.Tile(
		{
			source: init_src_wms(wms_url, name_layer_secteurs)
		}
	);
	



	map=new ol.Map(
	{
		  controls: ol.control.defaults().extend([mousePositionControl, scaleline]),		  
		  target:"map", 
          layers: [esri_background, osm_background],
		   view: new ol.View(
		   { 
				//projection: 'EPSG:4326',
				center: [29.5,-2],
				zoom: 7
			})			
	});
	//attach popup
	init_overlay();
	removed_layers.push("display_provinces");
	removed_layers.push("display_territories");
	removed_layers.push("display_secteurs");
	
	//display data popup
	map.on('click', function(evt) {
				var coordinate = evt.coordinate;
				var hdms = ol.coordinate.toStringHDMS(coordinate);
				//console.log("click");
				var feature = map.forEachFeatureAtPixel(evt.pixel, 
							  function(feature) { return feature; });
				if (isCluster(feature)) {
				//var popup = new ol.Overlay.Popup();
				//map.addOverlay(popup);
			 
			   var html="";
				// is a cluster, so loop through all the underlying features
				var features_tmp = feature.get('features');
				var key_sort=[]
				var feature_bag={};
				for(var i = 0; i < features_tmp.length; i++) {
					key_sort[key_sort.length] = features_tmp[i].get('id');
					feature_bag[features_tmp[i].get('id')]=features_tmp[i];
				}
				key_sort.sort();
				for(var i = 0; i < key_sort.length; i++) {
				  // here you'll have access to your normal attributes:
				  ////console.log(features[i].get('name'));
			     var tmp_feat=feature_bag[key_sort[i]];
				 if(language=="fr")
				 {
					var tmp_url="./description_fr.html";
				 }
				 else if(language=="nl")
				 {
					var tmp_url="./description_nl.html";
				 }
				 else if(language=="en")
				 {
					var tmp_url="./description_en.html";
				 }
				  html+="<a target='_blank' href='"+ tmp_url +"?id="+ tmp_feat.get('id') +"' ><u>"+ (tmp_feat.get('id')||'') +" "+ (tmp_feat.get('type')||'') + " "+ (tmp_feat.get('date')||'') + "</u></a>"+"<br/>";
				  
				}
			   
				 content.innerHTML = '<p>' + html +'</p>';
					overlay.setPosition(coordinate);
			  } 
			});	


}

var array_criteria=function(field, param)
{
		var crit_tmp=Array();
		for(var i=0; i<param.length; i++)
		{
			crit_tmp.push(field+"='"+param[i].replace("'","''")+"'");
		}
		return "("+crit_tmp.join(" OR ")+")";
}

var intersect_criteria=function( layer_shape, field, param)
{
		var crit_tmp=Array();
		for(var i=0; i<param.length; i++)
		{
			crit_tmp.push("INTERSECTS(geom, querySingle('"+layer_shape+"','geom','"+field+"= ''"+  param[i]+"'''))");
		}
		return "("+crit_tmp.join(" OR ")+")";
}

var build_query=function(date_from, date_to, categ, provinces, territoires, secteurs, morts, blesses, homelesses, logement, cultures, cattle)
{
	$("#warning").html("");
	var criteria=Array();
	var criteria_impact=Array();
	var text_query="";
	if(date_from.length>0)
	{
		//console.log("a date from");
		criteria.push("date >='"+date_from+"'");
		
	}
	if(date_to.length>0)
	{
		//console.log("a date to");
		criteria.push("date <='"+date_to+"'");
		if(date_to<date_from)
		{
			$("#warning").html("Problème dans l'intervale de date : date de fin antérieure à date de début");
		}
	}
	if(categ.length>0)
	{
		
		criteria.push(array_criteria("type", categ ));
	}
	if(provinces.length>0)
	{
		
		criteria.push(intersect_criteria(name_layer_provinces, "nom" , provinces));
	}
	
	if(territoires.length>0)
	{
		
		criteria.push(intersect_criteria(name_layer_territoires, "nom" , territoires));
		
	}
	
	if(secteurs.length>0)
	{
		
		criteria.push(intersect_criteria(name_layer_secteurs, "nom" , secteurs));
		criteria.push("(NOT(lat IS NULL) AND NOT(lon Is NULL))");
	}
	if(morts)
	{
		criteria_impact.push("nmort > 0");
	}
	if(blesses)
	{
		criteria_impact.push("nblesse > 0");
	}
	if(homelesses)
	{
		criteria_impact.push("nsansabris > 0");
	}
	if(logement)
	{
		criteria_impact.push("logement ='oui'");
	}
	if(cultures)
	{
		criteria_impact.push("culture ='oui'");
	}
	if(cattle)
	{
		criteria_impact.push("betail ='oui'");
	}
	if(criteria.length>0 && criteria_impact.length>0)
	{
		//console.log(" A ");
		text_query=criteria.join(" AND ") + " AND "+ criteria_impact.join(" OR ");
	}
	else if(criteria.length==0 && criteria_impact.length>0)
	{
	    //console.log(" B ");
		text_query= criteria_impact.join(" OR ");
	}
	else if(criteria.length>0 && criteria_impact.length==0)
	{
	    //console.log(" C ");
		text_query=criteria.join(" AND ");
	}

	
		console.log(text_query);
		init_wfs(text_query);
}

var do_search=function()
{
    var date_from=$("#date_from").val();
	var date_to=$("#date_to").val();
	var categ=$("#categ").val();
	var provinces=$("#provinces").val();
	var territoires=$("#territoires").val();
	var secteurs=$("#secteurs").val();
	var morts=$("#morts").prop("checked");
	var blesses=$("#blesses").prop("checked");
	var homelesses=$("#homelesses").prop("checked");
	var logement=$("#logement").prop("checked");
	var cultures=$("#cultures").prop("checked");
	var cattle=$("#cattle").prop("checked");
	//console.log(provinces);
	//console.log(territoires);
	//console.log(secteurs);
	//console.log(categ);
	//console.log(date_to);
	//console.log(date_from);
	//console.log(morts);
	build_query(date_from, date_to, categ, provinces, territoires, secteurs, morts, blesses, homelesses, logement, cultures, cattle);
}

var hide_show_display=function(name_ctrl, layer)
{
	if(displayed_layers.includes(name_ctrl))
	{
	    //console.log(displayed_layers);
		var i=displayed_layers.indexOf(name_ctrl);
		displayed_layers.splice(i,1);
		 //console.log(displayed_layers);
		removed_layers.push(name_ctrl);
		map.removeLayer(layer);
	}
	else if(removed_layers.includes(name_ctrl))
	{
	    //console.log(removed_layers);
		var i=removed_layers.indexOf(name_ctrl);
		removed_layers.splice(i,1);
		 //console.log(removed_layers);
		displayed_layers.push(name_ctrl);
		map.addLayer(layer);
	}
}

//code run when page loaded
//$(document).ready(

	var init_general=function()
	{
	    
		//click
		$("#search_map").click(
			function()
			{
				do_search();
			}
		);
		
		$("#display_provinces").click(
			function()
			{
				hide_show_display("display_provinces", wms_layers_provinces);
			}
		);
		$("#display_territories").click(
			function()
			{
				hide_show_display("display_territories", wms_layers_territoires);
			}
		);
		
		$("#display_secteurs").click(
			function()
			{
				hide_show_display("display_secteurs", wms_layers_secteurs);
			}
		);
		$("#display_aleas").click(
			function()
			{				
				hide_show_display("display_aleas", displayed_layer);
			}
		);
		
		//end clicc
		//console.log("test");
		//create map
		init();
		//add cluster seism
		init_wfs("");
		
		$("#select_background").change(
			function()
			{
				console.log($("#select_background").val());
				var tmp_val=$("#select_background").val();
				if(tmp_val=="ESRI_SAT")
				{
					esri_background.setVisible(true);
					osm_background.setVisible(false);
				}
				else if(tmp_val=="OpenStreetMap")
				{
					esri_background.setVisible(false);
					osm_background.setVisible(true);
				}
			}
		);
		
		
	}

//);

//resyn

$("#provinces").change(
	function()
	{		
		var provs=$(this).select2("val");
		var extra_cql="";
		var extra_cql_array=Array();
		for(var i=0; i<provs.length;i++)
		{			
			extra_cql_array.push("province='"+provs[i]+"'");
		}
		if(extra_cql_array.length>0)
		{			
			extra_cql="&CQL_FILTER=("+extra_cql_array.join(" OR ")+")";
		}
		
		parse_wfs_list(url_list_territoires,"territoire", "#territoires",extra_cql, true);
		parse_wfs_list(url_list_secteurs,name_field_secteurs, "#secteurs",extra_cql, true);	    
		
	}
);

$("#territoires").change(
	function()
	{		
		var terrs=$(this).select2("val");
		var extra_cql="";
		var extra_cql_array=Array();
		for(var i=0; i<terrs.length;i++)
		{			
			extra_cql_array.push("territoire='"+terrs[i]+"'");
		}
		if(extra_cql_array.length>0)
		{			
			extra_cql="&CQL_FILTER=("+extra_cql_array.join(" OR ")+")";
		}
		parse_wfs_list(url_list_secteurs,name_field_secteurs, "#secteurs",extra_cql, true);		
	}
);

