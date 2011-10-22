var Range = function() {};
Range.prototype = $.fn.range;

function DomToSelector() {
  this.prediction_helper = new DomPredictionHelper();
  this.restricted_elements = jQuery.map(['html', 'body', 'head', 'base'], function(selector) { return jQuery(selector).get(0); });
};
DomToSelector.prototype = new Object();
DomToSelector.prototype.nodeListIndexOf = function(nodeList, el) {
  var array = [].slice.call(nodeList, 0);
  return array.indexOf(el);
}
DomToSelector.prototype.pathGet = function (sel) {
  // Like $() but handles a path that ends with :text:nth-child(x)

  sel = sel.split(" :text")
  var nodes = $(sel[0]);
  if (sel.length == 1) return nodes;

  sel = sel[1].split(' ');
  var index = parseInt(sel[0].match(/^:nth-child\((.*)\)/)[1]);

  var nodes2 = $();
  nodes.each(function () {
    if (this.childNodes.length > index) {
      nodes2 = nodes2.add(this.childNodes[index]);
    }
  });
  nodes = nodes2;
  if (sel.length == 1) return nodes;

  console.err("Unsupported subquery " + sel[1]);
};
DomToSelector.prototype.getPath = function (node) {
  var self = this;
  var sel;
  var sub;

  if (node.nodeType == node.TEXT_NODE) {
    sub = node;
    node = $(node).parent()[0];
  }

  var anti = [].concat(self.restricted_elements);
  var nodes = [node, node];

  while (nodes.length > 1) {
    $.each(nodes, function () {
      if (this != node)
	anti.push(this);
    }); 
    sel = self.prediction_helper.predictCss([node], anti);
    nodes = $(sel);
  }

  if (sub !== undefined) {
    var index = self.nodeListIndexOf($(sel)[0].childNodes, sub)
    sel += " :text:nth-child(" + index + ")";
  }

  return sel;
};
DomToSelector.prototype.generalize = function (node, offset) {
/*
  var self = this;
  var parent = $(node).parent();
  if (parent[0].nodeName.toLowerCase() != 'body') {
    if (offset == 0 && parent.children().index(node) == 0) {
      return self.generalize(parent[0], 0);
    } else if (offset == $(node).html().length || offset == $(node).children().length) {
      return self.generalize(parent[0], parent.children().index(node) + 1);
    }
  }
*/
  return {node: node, offset: offset};
}
DomToSelector.prototype.serializeOffset = function (node, offset) {
  var res = this.generalize(node, offset);
  res.node = this.getPath(res.node);
  return res;
}
DomToSelector.prototype.serializeRange = function (range) {
  return {start: this.serializeOffset(range.startContainer, range.startOffset),
	  end: this.serializeOffset(range.endContainer, range.endOffset)};
}

DomToSelector.prototype.unserializeRange = function (srange) {
  var range = new Range();
  range.ClearVariables();

  range.startContainer = this.pathGet(srange.start.node)[0];
  range.startOffset = srange.start.offset;
  range.endContainer = this.pathGet(srange.end.node)[0];
  range.endOffset = srange.end.offset;
  range.collapsed = false;
  return range;
}
