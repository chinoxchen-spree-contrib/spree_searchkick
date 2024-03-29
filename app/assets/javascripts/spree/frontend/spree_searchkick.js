// Placeholder manifest file.
// the installer will append this file to the app vendored assets here: vendor/assets/javascripts/spree/frontend/all.js'
//= require_tree .
function Levenshtein(a, b) {
    var n = a.length;
    var m = b.length;

    // matriz de cambios mínimos
    var d = [];

    // si una de las dos está vacía, la distancia
    // es insertar todas las otras
    if(n == 0)
        return m;
    if(m == 0)
        return n;

    // inicializamos el peor caso (insertar todas)
    for(var i = 0; i <= n; i++)
        (d[i] = [])[0] = i;
    for(var j = 0; j <= m; j++)
        d[0][j] = j;

    // cada elemento de la matriz será la transición con menor coste
    for(var i = 1, I = 0; i <= n; i++, I++)
      for(var j = 1, J = 0; j <= m; j++, J++)
          if(b[J] == a[I])
              d[i][j] = d[I][J];
          else
              d[i][j] = Math.min(d[I][j], d[i][J], d[I][J]) + 1;

    // el menor número de operaciones
    return d[n][m];
}

var normalize2 = function (input) {
  if(!input) return ''
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

var queryTokenizer = function (q) {
  var normalized = normalize2(q);
  return Bloodhound.tokenizers.whitespace(normalized);
};

var transformObj = function (obj) {
  return obj['n'] + ' # ' + obj['p'] + ' # ' + obj['t'] + ' # ' + obj['k'];
};

var formatSearchResponse = function (response) {
  return $.map(response, function (obj) {
    var normalized = normalize2(transformObj(obj));
    return {
      value: normalized,
      displayValue: obj['n'],
      displayObj: obj
    };
  });
};

var calculateDistance = function(value, word){
  value_arr = value.split(' ');
  has_exact_word = false
  no_word = 0
  modified_search_word = word.replace(/s$/, '');
  min = Levenshtein(value_arr[0].replace(/s$/, ''), modified_search_word);

  for (var ix = 0; ix < value_arr.length; ix++) {
    if(value_arr[ix].length <= 2){
      no_word = no_word + 1;
      continue;
    }
    evaluated_word = value_arr[ix].replace(/s$/, '');

    distance = Levenshtein(evaluated_word, modified_search_word);
    if(evaluated_word.toLowerCase() == modified_search_word.toLowerCase()){
      has_exact_word = true
    }
    if(distance < min){
      min = distance
    }
  }

  multiplier = 10000000/(value_arr.length - no_word) * -1

  if(has_exact_word){
    multiplier += -10000000
  }

  return min + multiplier
}

var sorterResults = function(a, b) {
  var value = $('#keywords').val();
  distance_a = calculateDistance(a.value.split("#")[0], value)
  distance_b = calculateDistance(b.value.split("#")[0], value)
  return distance_a - distance_b;
}

var configImgCdn = function (img_url, width, height, quality) {
  if ($('body').attr('data-rails-env') === 'development') return img_url;
  var splitUrl = img_url.split('/')
  return splitUrl[0] + '//' + splitUrl[2] + '/' + 'cdn-cgi/image/width=' + width + ',height=' + height + ',quality=' + quality + ',f=auto,fit=pad/' + splitUrl[3];
};

Spree.typeaheadSearch = function () {
  const stockLocationParam =  '?stock_locations=' + Spree.stockLocations();
  var products = new Bloodhound({
    // datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    // queryTokenizer: queryTokenizer,
    datumTokenizer: function(d) {
      return Bloodhound.tokenizers.whitespace(d.value);
    },
    queryTokenizer: queryTokenizer,
    sufficient: 20,
    sorter: sorterResults,
    remote: {
       url: Spree.pathFor('autocomplete/products.json') + '?keywords=%QUERY' + stockLocationParam.replace('?', '&'),
       wildcard: '%QUERY',
       transform: function (response) {
         return formatSearchResponse(response);
       }
     }
  });

  products.initialize().done(function () {
    setTimeout(function () {
      $('#search_loader').addClass('d-none').removeClass('load');
    }, 0);
  });

  // passing in `null` for the `options` arguments will result in the default
  // options being used
  $('#keywords').typeahead({
    minLength: 1,
    hint: false,
    highlight: true,
  },{
    displayKey: 'displayValue',
    limit: 20,
    name: 'products',
    source: products.ttAdapter(),
    templates: {
      empty: 'No se encontraron los productos que estás buscando',
      suggestion: function (el) {
        var obj = el.displayObj
        return '<div><img class="lazyload"  alt="  ' + obj.n + ' " data-src="' + configImgCdn(obj.i, 50, 50, 75) + '"  width="50" height="50" style="border-radius: 10px; margin-right: 10px; height: auto"/>' + obj.n + '<br>' +  obj.p + '</div>'
      }
    }
  });
};

document.addEventListener("turbolinks:load", function () {
  if ($("#search-button-kick")){
    $(document).on("click", "#search-button-kick", function () {
      if($('#search_loader').hasClass('load')){
        Spree.typeaheadSearch();
      }
    });
  }
});
