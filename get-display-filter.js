/*

Tenable Nessus UI Challenge
Solution: John Celentano | john.celentano@gmail.com

     current functionality:
     - onclick of 'get' button, a GET request is sent to the server defined in get_url
     - the data retrieved can be filtered via the search bar (using jQuery autocomplete)
     - search bar results can be further refined by clicking the column headers
     - alternatively, the results range can be defined with the sliders

     to add:
     - proportional column widths
     - revisit options rather than fixed positions
     - responsive layout
     - sorting options: drag and drop / in-place.

*/

window.onload = function(){
     var get_show_filter = (function(){
          var data = {};
          var filtered = {};
          var look_in = ['name', 'hostname', 'port', 'username'];
          var displayJSON = function(){
               var container = document.getElementById('data_container');
               var pre = document.createElement('PRE');
               var data_string = document.createTextNode(JSON.stringify(data, null, 4));
               pre.appendChild(data_string);
               container.appendChild(pre);
          }
          var buildTable = function(source, lbound, ubound){
               var lbound = lbound || 0;
               var ubound = ubound || source.configurations.length - 1;
               var container = document.getElementById('data_container');
               var data_table = document.getElementById('fetched_data');
               data_table.innerHTML = '';
               var title_row = document.createElement('TR');
               var title_th = document.createElement('TH');
               for(d in source){
                    var elements_counter = 0;
                    for(var e = lbound; e < (ubound + 1); e++){
                         if(elements_counter === 0){
                              var table_title_text = document.createTextNode(d);
                              title_th.appendChild(table_title_text);
                              title_th.classList.add('table_title');
                              title_row.appendChild(title_th);
                              data_table.appendChild(title_row);
                              var header_row = document.createElement('TR');
                         }
                         var data_row = document.createElement('TR');
                         data_row.classList.add('row-'+ elements_counter);
                         var properties_counter = 0;
                         for(p in source[d][e]){
                              if(elements_counter === 0){
                                   var header_field = document.createElement('TH');
                                   var fieldname = document.createTextNode(p);
                                   header_field.classList.add('col-' + properties_counter);
                                   header_field.classList.add('fieldname');
                                   if(look_in.indexOf(p) !== -1){
                                        header_field.classList.add('active_filter');
                                   }
                                   header_field.setAttribute('title', 'This column (' + p + ') will be searched when the search field is engaged. Active when text is white (click to toggle)');
                                   header_field.classList.add(p);
                                   header_field.appendChild(fieldname);
                                   header_row.appendChild(header_field);
                                   data_table.appendChild(header_row);
                              }
                              var data_field = document.createElement('TD');
                              var fieldval = document.createTextNode(source[d][e][p]);
                              data_field.classList.add('col-' + properties_counter);
                              data_field.appendChild(fieldval);
                              data_row.appendChild(data_field);
                              properties_counter++
                         }
                         data_table.appendChild(data_row);
                         container.appendChild(data_table);
                         elements_counter++
                    }
               }
               title_th.setAttribute('colspan', properties_counter);
               var count_container = document.getElementById('results_count');
               var elements_count = document.createTextNode('displaying ' + (lbound + 1) + '-' + (ubound + 1) + ' of ' + (source.configurations.length) + ' result' + (elements_count === 1 ? '' : 's'));
               var last_updated = document.getElementById('last_updated');
               var now_datetime = new Date();
               var date_display = document.createTextNode(now_datetime.toLocaleString());

               count_container.innerHTML = '';
               count_container.appendChild(elements_count);
               last_updated.innerHTML = 'last updated ';
               last_updated.appendChild(date_display);

               // insert headers into fixed header table
               var title = $('#fetched_data .table_title');
               var tw = title.width();
               $('#fixed_title').empty();
               $('#fixed_title').prepend(title);
               $('#fixed_title .table_title').width(tw);

               $('#fixed_field_header').empty();
               var header = $('#fetched_data .fieldname');
               header.each(function(){
                    var field = $(this);
                    fw = field.width()
                    $('#fixed_field_header').append($(this));
                    $('#fixed_field_header .fieldname').width(fw);
               });
               $('#fixed_field_header .fieldname').click(function(){
                    var this_fieldname = $(this).text();
                    var in_look_in = look_in.indexOf(this_fieldname);
                    if(in_look_in === -1){
                         look_in.push(this_fieldname);
                    }
                    else{
                         look_in.splice(in_look_in, 1);
                    }
                    $(this).toggleClass('active_filter');
                    console.log(look_in);
               });
               //$('#fixed_field_header').width();
               //$('th.col-0').width('10%');
               //$('th.col-1').width('40%');
               //$('th.col-2').width('25%');
               //$('th.col-3').width('25%');
          }

          // autocomplete search filter
          $('#search_bar').autocomplete({
               source: custom_source,
               minLength: 0,
               response: function(event, ui){
                    event.preventDefault();
                    filtered = {configurations: ui.content};
                    setRangeFilter(1, filtered.configurations.length, 1, 100);
                    buildTable(filtered, $('#lbound').text() - 1, $('#ubound').text() - 1);
               },
               focus: function(event, ui){
                    event.preventDefault();
               },
               open: function(event){
                    $(".ui-autocomplete").hide();
               }
          });

          // autocomplete search filter custom source
          // Source: http://jsfiddle.net/h5E6C/
          function custom_source(request, response){
               var configs = data['configurations'];
               for(var i = 0; i < data.length; i++){
                    configs[i]['label'] = configs[i]['name'];
                    configs[i]['value'] = i;
               }
               var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term.trim()), "i");
               response($.grep(configs, function(this_element){
                    found = false;
                    for(var l = 0; l < look_in.length; l++){
                         var str_to_search = this_element[look_in[l]].toString();
                         if(matcher.test(str_to_search)){
                              found = true;
                              searchstring_found = request.term;
                         }
                    }
                    return found;
               }));
          }

          // range filter - sliders define the lower and upper bounds of the results
          // Sources: https://jqueryui.com/slider/#range-vertical, http://jsfiddle.net/dzorz/X3DVv/
          var setRangeFilter = function(d_min, d_max, lo, hi){
               var lbound = $('<div></div>').prop('id', 'lbound').prop('class', 'range');
               var ubound = $('<div></div>').prop('id', 'ubound').prop('class', 'range');
               $('#slider-range').slider({
                    range: true,
                    min: d_min,
                    max: d_max,
                    values: [ lo, hi ],
                    slide: function(event, ui){
                         lbound.text(ui.values[0]);
                         ubound.text(ui.values[1]);
                         buildTable(Object.keys(filtered).length > 0 ? filtered : data, ui.values[0] - 1, ui.values[1] - 1);
                    }
               });
               lbound.text($( "#slider-range" ).slider("values", 0));
               ubound.text($( "#slider-range" ).slider("values", 1));
               $('.ui-slider-handle:first').html(lbound);
               $('.ui-slider-handle:last').html(ubound);
          }

          return {
               get: function(){
                    var query_param = document.getElementById('query_param').value;
                    var xmlhttp;
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function(){
                         if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
                              data = JSON.parse(xmlhttp.responseText);
                              buildTable(data, 0, 99);
                              setRangeFilter(1, data.configurations.length, 1, 100);
                              $('#search_bar').prop('disabled', false);
                         }
                    };
                    var get_url = 'http://[server]/tenable/download/request' + (query_param > 0 ? '?host=' + query_param : '');
                    xmlhttp.open("GET", "/get-show-filter/data/configurations.json"); // get_url
                    xmlhttp.send();
               }
          }
     })();

     $('#get').click(function(){
          get_show_filter.get();
     });

}
