(function ($) {

$(document).ready(function () {
  var domToSelector = new DomToSelector();
  var body = $('body');

  function updateTweetButton() {
    var tags = $(".tag_dialog")[0].selection.tags.map(function (tag) { return "#" + tag.tag; });

    var twitter = document.createElement('a');
    twitter.setAttribute('href', 'http://twitter.com/share');
    twitter.setAttribute('class', 'twitter-share-button twitter-tweet');
    twitter.setAttribute('data-url', document.location.origin + "/g/" + $(".tag_dialog")[0].selection.id);  //document.location.toString().split("#")[0] + "#selection_" + $(".tag_dialog")[0].selection.order);
    twitter.setAttribute('data-text', tags.join(" "));
    twitter.setAttribute('data-count', 'horizontal');
    twitter.innerHTML = "Tweet";

    $(".tag_dialog .twitter-share-button").replaceWith(twitter);
    $.getScript("http://platform.twitter.com/widgets.js");
  }

  function removeTag(tag) {
    $(".tag_dialog .tags .tag_" + $.slug(tag.tag)).remove();
  }

  function addTag(tag) {
   $(".tag_dialog .tags").append("<span class='tag tag_" + $.slug(tag.tag) + "'><a href='/?tag=" + escape(tag.tag) + "'>" + tag.tag + "</a><a href='javascript: void(0);' class='remove'>X</a></span> ");
    $(".tag_dialog .tags .tag:last-child")[0].tag = tag;
    $(".tag_dialog .tags .tag:last-child .remove").bind("click", function () {
      $.ajax({
	url: "/badgerbadger/tagger/tag/remove",
	data: {
	  id: $(".tag_dialog")[0].selection.id,
	  tag: tag.tag
	},
	success: function (data) {
          $(".tag_dialog")[0].selection.tags = $.grep($(".tag_dialog")[0].selection.tags, function(value) {
            return value != tag;
          });
	  removeTag(tag);
	  updateTweetButton();
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
    updateTweetButton();
  }

  function wrapSelection(selection, sel) {
    if (sel == undefined) {
      sel = body.wrapSelection({wrapRange:domToSelector.unserializeRange(selection.selector)});
    }
    sel.addClass('selection').addClass('selection_' + selection.order);
    sel.bind("click", function () { openDialog(selection); });
  }

  function createTag () {
    var tag = {'tag': $(".tag_dialog .new_tag")[0].value, 'type': null, 'dst': null};
    $.ajax({
      url: "/badgerbadger/tagger/tag/add",
      data: {
	id: $(".tag_dialog")[0].selection.id,
	tag: tag.tag
      },
      success: function (data) {
	$(".tag_dialog")[0].selection.tags.push(tag);
	addTag(tag);
	updateTweetButton();
	$(".tag_dialog .new_tag")[0].value = '';
      },
      dataType: "json"
    });
  }


  $(".tagger").append("<a class='original' title='Original website' href='" + tagger.url + "'>XXXXXXXXXXXXX</a>");

  $(".tag_dialog .new_tag").datetimepicker({
    showOn: "button",
    changeMonth: true,
    changeYear: true,
    buttonImage: "/badgerbadger/static/tagger/img/calendar.gif",
    buttonImageOnly: true,
    dateFormat: "'date'=yy-mm-dd",
    timeFormat: 'hh:mm:ss',
    constrainInput: false,
  });

  $(".tag_dialog .new_tag").autocomplete({source: "/badgerbadger/tagger/tags/json"});
  $(".tag_dialog .new_tag").keypress(function (event) {
    if (event.keyCode == 13) { // Enter...
      createTag();
    }
  });

  $.each(tagger.selections, function (index, selection) {
    wrapSelection(selection);
  });

  $('.tag_dialog .exit').bind("click", function () { $('.tag_dialog').hide(); });

  body.bind("mouseup", function(){
    var range;
    try {
      range = body.getRangeAt();
    } catch(err) {
      return;
    }
    if (range.startContainer == range.endContainer && range.startOffset == range.endOffset) return;

    var selector = domToSelector.serializeRange(range);
    var sel = body.wrapSelection({wrapRange:domToSelector.unserializeRange(selector)});

    $.ajax({
      url: "/badgerbadger/tagger/select?url=" + tagger.url,
      data: {
        order: tagger.selections.length,
        selector: JSON.stringify(selector),
	excerpt: sel.map(function () { return $(this).html(); }).get().join(" ").substr(0, 4048),
      },
      success: function (data) {
        var selection = {selector:selector, tags:[], id:data, order:tagger.selections.length};
        tagger.selections.push(selection);
        wrapSelection(selection, sel);
	openDialog(selection);
      },
      dataType: "json"
    });
  });

  if (document.location.hash.indexOf("selection_") != -1) {
    var order = parseInt(document.location.hash.split("selection_")[1]);
    $.scrollTo(".selection_" + order, 1000);
    openDialog(tagger.selections[order]);
  } else {
    $('.tagger .intro_help').css({opacity: 0.0, display: 'block'});
    $('.tagger .intro_help').animate({opacity: 1.0}, 1000, function() {
      setTimeout(function () {
	$('.tagger .intro_help').animate({opacity: 0.0}, 2000, function() {
	  $('.tagger .intro_help').css({display: 'none'});
	});
      }, 1000);
    });
  }

});

})($);
