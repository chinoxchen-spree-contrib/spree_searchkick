// Placeholder manifest file.
// the installer will append this file to the app vendored assets here: vendor/assets/javascripts/spree/frontend/all.js'
//= require_tree .

Spree.typeaheadSearch = function() {
  var products = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: Spree.pathFor('autocomplete/products.json'),
    remote: {
      url: Spree.pathFor('autocomplete/products.json?keywords=%25QUERY'),
      wildcard: '%QUERY'
    }
  });

  products.initialize();

  // passing in `null` for the `options` arguments will result in the default
  // options being used
  $('#keywords').typeahead({
    hint: true,
    minLength: 1,
    highlight: true
  }, {
    name: 'products',
    source: products,
    limit: 10
  });
}