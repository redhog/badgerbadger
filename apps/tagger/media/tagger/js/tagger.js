(function ($) {

$.jsonviewajax = function (opts) {
  var success = opts.success;
  opts.success = function (data) {
    if (data.error != undefined) {
      console.error(data.error.type + ": " + data.error.description + "\n\n" + data.error.traceback);
    } else {
      return success(data);
    }
  }
  return $.ajax(opts);
}


$.datepicker._hideDatepicker_tagger_old = $.datepicker._hideDatepicker;
$.datepicker._hideDatepicker = function (input) {
  var inst = this._curInst;
  if (!inst || (input && inst != $.data(input, "datepicker"))) {
    inst = $.datepicker._getInst($(event.target).parents(".hasDatepicker")[0]);
    $.datepicker._triggerOnClose(inst);
  } else {
    return $.datepicker._hideDatepicker_tagger_old(input);
  }
};

TagDialog = function (widget) {
  var dialog = this;
  if (widget === undefined)
    widget = ".tag_dialog";
  dialog.widget = $(widget)[0];
  $(widget).find(".new_tag").autocomplete({
    source: "/badgerbadger/tagger/tags/json",
    select: function (event, ui) { return dialog.newTagSelect(event, ui); }
  });
  $(widget).find(".new_tag").keypress(function (event) { return dialog.newTagKeypress(event); });
  $(widget).find(".TimeStamp .date").datetimepicker({
    // showButtonPanel: false,
    changeMonth: true,
    changeYear: true,
    dateFormat: "yy-mm-dd",
    timeFormat: 'hh:mm:ss',
    onSelect: function(dateText, inst) { console.log(["select", dateText, inst]); },
    onClose: function(dateText, inst) { console.log(["close", dateText, inst]); }
  });

  $(widget).find('.exit').bind("click", function () { $('.tag_dialog').hide(); });

  $(widget).find(".types .type").each(function () {
    var type = $(this).attr("class").split(" ")[1];
    $(this).bind("click", function () { dialog.toggleType(type); });
  });
};
TagDialog.prototype = new Object();
TagDialog.prototype.newTagKeypress = function (event) {
  if (event.keyCode == 13) { // Enter...
    this.createTagging();
  }
};
TagDialog.prototype.newTagSelect = function (event, ui) {
};
TagDialog.prototype.selectType = function (type) {
  var dialog = this;
  if (dialog.type)
    $(dialog.widget).find(".values .value." + dialog.type).hide();
  dialog.type = type;
  $(dialog.widget).find(".values .value." + dialog.type).show();
};
TagDialog.prototype.toggleType = function (type) {
  var dialog = this;

  if (dialog.type == type) {
    dialog.selectType();
  } else {
    dialog.selectType(type);
  }
};
TagDialog.prototype.getLink = function() {
  // document.location.toString().split("#")[0] + "#selection_" + this.widget.selection.order;
  return document.location.origin + "/g/" + this.widget.selection.id;
};
TagDialog.prototype.updateTweetButton = function() {
  var widget = this.widget;
  var tags = widget.selection.tags.map(function (tag) { return "#" + tag.tag; });

  var twitter = document.createElement('a');
  twitter.setAttribute('href', 'http://twitter.com/share');
  twitter.setAttribute('class', 'twitter-share-button twitter-tweet');
  twitter.setAttribute('data-url', this.getLink());
  twitter.setAttribute('data-text', tags.join(" "));
  twitter.setAttribute('data-count', 'horizontal');
  twitter.innerHTML = "Tweet";

  $(widget).find(".twitter-share-button").replaceWith(twitter);
  $.getScript("http://platform.twitter.com/widgets.js");
};

TagDialog.prototype.removeTagging = function(tagging) {
  $(this.widget).find(".tags .tag_" + tagging.id).remove();
};
TagDialog.prototype.addTagging = function(tagging) {
  var dialog = this;
  var widget = dialog.widget;
  var tags = $(widget).find(".tags");
  
  tags.append("<span class='tag tag_" + tagging.id + "'><a href='/?tag=" + escape(tagging.tag.name) + "'>" + tagging.tag.name + "</a><a href='javascript: void(0);' class='remove'>X</a></span> ");
  tags.find(".tag:last-child")[0].tagging = tagging;
  tags.find(".tag:last-child .remove").bind("click", function () { dialog.deleteTagging(tagging); });
};
TagDialog.prototype.deleteTagging = function(tagging) {
  var dialog = this;
  var widget = dialog.widget;

  $.jsonviewajax({
    url: "/badgerbadger/tagger/delete",
    data: {obj: JSON.stringify(tagging)},
    success: function (data) {
      widget.selection.tags = $.grep(widget.selection.tags, function(value) {
	return value.id != tagging.id;
      });
      dialog.removeTagging(tagging);
      dialog.updateTweetButton();
    },
    dataType: "json"
  });
};
TagDialog.prototype.createTagging = function () {
  var dialog = this;
  var tagging = {
    '__tagger_models_Tagging__': true,
    'src': {'__tagger_models_Range__': true, 'id':dialog.widget.selection.id},
    'tag': {'__tagger_models_Tag__': true, name: $(dialog.widget).find(".new_tag")[0].value, 'type': null},
    'dst': dialog.dst
  };
  $.jsonviewajax({
    url: "/badgerbadger/tagger/create",
    data: {obj: JSON.stringify(tagging)},
    success: function (tagging) {
      dialog.widget.selection.tags.push(tagging);
      dialog.addTagging(tagging);
      dialog.updateTweetButton();
      $(dialog.widget).find(".new_tag")[0].value = '';
      $(dialog.widget).find(".values .value").hide();
    },
    dataType: "json"
  });
};
TagDialog.prototype.open = function(selection) {
  var dialog = this;
  var widget = this.widget;
  var sel = $('.selection_' + selection.order);

  dialog.dst = null;
  widget.selection = selection;
  $(widget).css({display: "block", top: sel.offset().top + sel.height(), left: sel.offset().left});
  $(widget).find(".selection_link").html(this.getLink());
  $(widget).find(".selection_link").attr("href", this.getLink());
  $(widget).find(".tags" ).html("");
  $.each(selection.tags, function (index, tag) { dialog.addTagging(tag); });
  $(widget).find(".new_tag" ).attr("value", "");
  $(widget).find(".new_tag" ).focus();
  dialog.selectType();
  dialog.updateTweetButton();
};


SelectableDocument = function (widget) {
  var doc = this;
  if (widget === undefined)
    widget = "body";
  doc.widget = $(widget)[0];
  doc.domToSelector = new DomToSelector();
  doc.dialog = new TagDialog();

  $.each(tagger.selections, function (index, selection) {
    doc.wrapSelection(selection);
  });

  $(doc.widget).bind("mouseup", function (event) { doc.mouseUp(event); });

  $(".tagger").append("<a class='original' title='Original website' href='" + tagger.url + "'>XXXXXXXXXXXXX</a>");
  if (document.location.hash.indexOf("selection_") != -1) {
    var order = parseInt(document.location.hash.split("selection_")[1]);
    $.scrollTo(".selection_" + order, 1000);
    doc.dialog.open(tagger.selections[order]);
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
};
SelectableDocument.prototype = new Object();
SelectableDocument.prototype.wrapSelection = function(selection, sel) {
  var doc = this;
  if (sel == undefined) {
    sel = $(doc.widget).wrapSelection({wrapRange:doc.domToSelector.unserializeRange(selection.selector)});
  }
  sel.addClass('selection').addClass('selection_' + selection.order);
  sel.bind("click", function () { doc.dialog.open(selection); });
};
SelectableDocument.prototype.mouseUp = function(event){
  var doc = this;
  var range;
  try {
    range = $(doc.widget).getRangeAt();
  } catch(err) {
    return;
  }
  if (range.startContainer == range.endContainer && range.startOffset == range.endOffset) return;

  var selector = doc.domToSelector.serializeRange(range);
  var sel = $(doc.widget).wrapSelection({wrapRange:doc.domToSelector.unserializeRange(selector)});

  var selection = {
    __tagger_models_Range__: true,
    document: {__tagger_models_Document__: true, url: tagger.url},
    order: tagger.selections.length,
    selector: selector,
    excerpt: sel.map(function () { return $(this).html(); }).get().join(" ").substr(0, 4048)
  };
  $.jsonviewajax({
    url: "/badgerbadger/tagger/create",
    data: {obj: JSON.stringify(selection)},
    success: function (selection) {
      tagger.selections.push(selection);
      doc.wrapSelection(selection, sel);
      doc.dialog.open(selection);
    },
    dataType: "json"
  });
};


$(document).ready(function () { var doc = new SelectableDocument(); });

})($);
