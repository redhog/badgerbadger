$(document).ready(function () {
  var domToSelector = new DomToSelector();
  var body = $('body');

  function removeTag(tag) {
    $(".tag_dialog .tags .tag_" + escape(tag.tag)).remove();
  }

  function addTag(tag) {
    $(".tag_dialog .tags").append("<span class='tag tag_" + escape(tag.tag) + "'>" + tag.tag + "<a href='javascript: 0;' class='remove'>X</a></span> ");
    $(".tag_dialog .tags .tag:last-child")[0].tag = tag;
    $(".tag_dialog .tags .tag:last-child .remove").bind("click", function () {
      $.ajax({
	url: "/tagger/tag/remove",
	data: {
	  id: $(".tag_dialog")[0].selection.id,
	  tag: tag.tag
	},
	success: function (data) {
          $(".tag_dialog")[0].selection.tags = jQuery.grep($(".tag_dialog")[0].selection.tags, function(value) {
            return value != tag;
          });
	  removeTag(tag);
	},
	dataType: "json"
      });
    });
  }

  function openDialog(selection) {
    var sel = $('.selection_' + selection.order);
    $(".tag_dialog")[0].selection = selection;
    $(".tag_dialog").css({display: "block", top: sel.offset().top + sel.height(), left: sel.offset().left});
    $(".tag_dialog .tags" ).html("");
    $.each(selection.tags, function (index, tag) { addTag(tag); });
    $(".tag_dialog .new_tag" ).focus();
  }

  function wrapSelection(selection) {
    var sel = body.wrapSelection({wrapRange:domToSelector.unserializeRange(selection.selector)});
    sel.addClass('selection').addClass('selection_' + selection.order);
    sel.bind("click", function () { openDialog(selection); });
  }

  $(".tag_dialog .new_tag").autocomplete({source: "/tagger/tags/json"});
  $(".tag_dialog .new_tag").keypress(function (event) {
    if (event.keyCode == 13) { // Enter...
      var tag = {'tag': $(".tag_dialog .new_tag")[0].value, 'type': null, 'dst': null};
      $.ajax({
        url: "/tagger/tag/add",
	data: {
  	  id: $(".tag_dialog")[0].selection.id,
	  tag: tag.tag
	},
	success: function (data) {
	  $(".tag_dialog")[0].selection.tags.push(tag);
	  addTag(tag);
	  $(".tag_dialog .new_tag")[0].value = '';
	},
	dataType: "json"
      });
    }
  });

  $.each(tagger.selections, function (index, selection) {
    wrapSelection(selection);
  });

  body.bind("mouseup", function(){
    var range = body.getRangeAt();

    if (range.startContainer == range.endContainer && range.startOffset == range.endOffset) return;

    var selector = domToSelector.serializeRange(range);

    $.ajax({
      url: "/tagger/select/" + tagger.url,
      data: {
        order: tagger.selections.length,
        selector: JSON.stringify(selector)
      },
      success: function (data) {
        var selection = {selector:selector, tags:[], id:data, order:tagger.selections.length};
        tagger.selections.push(selection);
        wrapSelection(selection);
	openDialog(selection);
      },
      dataType: "json"
    });

  });
});
