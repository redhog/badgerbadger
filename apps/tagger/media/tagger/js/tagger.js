  function wrapSelection(selector) {
    console.log(JSON.stringify(selector));
    body.wrapSelection({wrapRange:domToSelector.unserializeRange(selector)}).addClass('selection');
  }

$(document).ready(function () {
  domToSelector = new DomToSelector();
  body = $('body');

  $.each(tagger_selections, function (index, selection) {
    wrapSelection(selection.selector);
  });

  body.bind("mouseup", function(){
    var range = body.getRangeAt();
    var srange = domToSelector.serializeRange(range);

    console.log(JSON.stringify(srange));

    wrapSelection(srange);
  });
});
