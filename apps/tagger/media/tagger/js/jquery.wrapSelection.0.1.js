/**
 * wrapSelection jQuery plugin v0.1 beta-1
 * @copyright	Copyright (c) 2008, Crossway Books
 * @author		Stephen Smith
 * @author		Jeremy Peterson
 * @version		0.1.1
 */
(function() {

	// plugin definition
	jQuery.fn.wrapSelection = function(options) {
		// build main options before element iteration
		var opts = jQuery.extend({}, jQuery.fn.wrapSelection.defaults, options);
		
		if (jQuery.fn.wrapSelection.range.getSelection()) {
			if(jQuery.fn.wrapSelection.defaults.fitToWord) jQuery.fn.wrapSelection.range.FitToWord();
			jQuery.fn.wrapSelection.range.SplitText();
			var myCount = jQuery.fn.wrapSelection.Wrap.doWrap();
			
			if (myCount) jQuery.fn.wrapSelection.range.ClearAllRanges();
			else jQuery.fn.wrapSelection.range.ClearVariables();
		}
		
		// return tmpRange and remove tmpRange class
		return jQuery('.' + jQuery.fn.wrapSelection.defaults.tmpRange).removeClass(jQuery.fn.wrapSelection.defaults.tmpRange);
	};

	jQuery.fn.wrapSelection.Wrap = {
		Spans: [],
	
		doWrap: function() {
			this.Spans = [];
			var myRange = jQuery.fn.wrapSelection.range;
			if (!myRange.startContainer || !myRange.endContainer) return false;
			var myNodes = myRange.GetContainedNodes();
			//myNodes is arranged by level, so everything at the same level can be surrounded by a <span>
			var myNodesSurrounded = 0;
			for (var i = 0, iLength = myNodes.length; i < iLength; i++) {
				if (!myNodes[i][0]) continue;
				var myParent = myNodes[i][0].parentNode;
				var myParentName = myParent.nodeName;
				if (myParentName != 'DIV') {
					var mySpan = this.makeSpanElement();
					myParent.insertBefore(mySpan, myNodes[i][0]); //Firefox has bugs if we don't attach the span first; we can't just append it because we don't know where it goes in the parent
					this.Spans.push(mySpan);
				}
				for (var j = 0, jLength = myNodes[i].length; j < jLength; j++) {
					//this works assuming there aren't any block-level elements contained in the lower element; so it should work for P, but not for UL
					if (myParentName == 'DIV') {
						if (myNodes[i][j].nodeType != 1) continue;
						var myChildNodes = myNodes[i][j].childNodes;
						var mySpan = this.makeSpanElement();
						while (myChildNodes.length > 0) mySpan.appendChild(myChildNodes[0]);
						myNodes[i][j].appendChild(mySpan); //it's OK to do here because we're replacing the whole thing
						this.Spans.push(mySpan);
					}
					//appending automatically removes them
					else mySpan.appendChild(myNodes[i][j]);
					myNodesSurrounded++;
				}
			}
			return myNodesSurrounded;
		},
	
		makeSpanElement: function() {
			var mySpan = document.createElement('span');
			mySpan.className = jQuery.fn.wrapSelection.defaults.tmpRange;
			return mySpan;
		}
	};

	jQuery.fn.wrapSelection.range = {	
		containedNodes: null,
		endContainer: null,
		endOffset: null,
		onlySpacesMatch: new RegExp(/[^\t\r\n ]/),
		regexElementBlockers: new RegExp(/^BR$/),
		regexWordCharacterBasic: new RegExp(/^[A-Za-z0-9'\-]$/),
		regexWordCharacterFull: new RegExp(/^[A-Za-z0-9':,\-]$/),
		regexWordPunc: new RegExp(/^[:,]$/),
		regexWordNumbers: new RegExp(/^[0-9]$/),
		selection: null,
		startContainer: null,
		startOffset: null,
	
		ClearAllRanges: function() {
			if (!jQuery.fn.wrapSelection.range.selection) return;
			//Firefox has bugs if you don't do both
			jQuery.fn.wrapSelection.range.selection.removeAllRanges();
			jQuery.fn.wrapSelection.range.ClearVariables();	
		},
	
		ClearVariables: function() {
			this.selection = null;
			this.containedNodes = null;
			this.startContainer = null;
			this.startOffset = null;
			this.endContainer = null;
			this.endOffset = null;
		},
	
		getSelection: function() {
			this.ClearVariables();
			return this.doGetSelection();
		},
	
		FitToWord: function() {
			this.doFitToWord();
		},
	
		GetContainedNodes: function() {
			return this.doGetContainedNodes();
		},
	
		//makes sure that the range only includes complete nodes
		SplitText: function() {
			this.doSplitText();
		},
	
		doGetSelection: function() {
			this.selection = window.getSelection();
			if (this.selection.toString().length > 0) {
				var myRange = this.selection.getRangeAt(0);
				if (!myRange.toString().match(this.onlySpacesMatch)) return false;
				this.startContainer = myRange.startContainer;
				this.startOffset = myRange.startOffset;
				this.endContainer = myRange.endContainer;
				this.endOffset = myRange.endOffset;
				
				if (this.startContainer.nodeType != 3){
					var myContainer = jQuery.fn.wrapSelection.dom.GetPreviousTextNode(myRange.startContainer.childNodes[myRange.startOffset], myRange.startContainer);
					if (myContainer) {
						this.startContainer = myContainer;
						this.startOffset = myContainer.length;
					}
				}
				if (this.endContainer.nodeType != 3) {
					var myContainer = jQuery.fn.wrapSelection.dom.GetNextTextNode(myRange.endContainer.childNodes[myRange.endOffset], myRange.startContainer);
					if (myContainer) {
						this.endContainer = myContainer;
						this.endOffset = myContainer.length;
					}
				}
				return true;
			}
			return false;
		},

		doFitToWord: function() {
			var myStart = this.fitToStartWord(this.startContainer, this.startOffset, 'normal');
			var myEnd = this.fitToEndWord(this.endContainer, this.endOffset, 'normal');
			this.startContainer = myStart.container;
			this.startOffset = myStart.offset;
			this.endContainer = myEnd.container;
			this.endOffset = myEnd.offset;
		},
	
		doGetContainedNodes: function() {
			if (this.containedNodes) return this.containedNodes;
			if (!this.startContainer || !this.endContainer) return [];
			var myStart = this.startContainer;
			var myEnd = this.endContainer;
			var myNodes = new Array([]);
			var myNode = myStart;
			var myPosition = jQuery.fn.wrapSelection.dom.CompareDocumentPosition(myStart, myEnd);
			var myParent = myNode.parentNode;
			var i = 0;
			while ((myPosition & 4) || myPosition == 0) {//while the current node is before
				if (myPosition & 16) myNode = myNode.firstChild; //the current node contains the end node
				else {
					if (myParent != myNode.parentNode) {// we're at a new level (either up or down), so we need a new span
						i++;
						myNodes[i] = new Array;
						myParent = myNode.parentNode;
					}
					myNodes[i].push(myNode);
					myNode = jQuery.fn.wrapSelection.dom.GetNextSiblingOrParent(myNode);
					if (myPosition == 0) break;
				}
				myPosition = jQuery.fn.wrapSelection.dom.CompareDocumentPosition(myNode, myEnd);
			}
			this.containedNodes = myNodes;
			return myNodes;
		},
	
		doSplitText: function() {
			var myIsSameNode = (this.startContainer == this.endContainer);
			if (this.startContainer.nodeType == 3 && this.startOffset > 0) {
				var myNew = this.startContainer.splitText(this.startOffset);
				if (myIsSameNode) {//if they're the same node, we want to make sure to assign the end to the same as the start
					this.endContainer = myNew;
					this.endOffset = this.endOffset - this.startContainer.length;
				}
				this.startContainer = myNew;
				this.startOffset = 0;
			}
			if (this.endContainer.nodeType == 3 && this.endOffset < this.endContainer.length) {
				this.endContainer.splitText(this.endOffset);
				this.endOffset = this.endContainer.length;
			}
		},
	
		fitToEndWord: function(myContainer, myOffset, myType) {
			var myChar = '';
			if (myOffset > 0) myChar = myContainer.nodeValue.substr(myOffset - 1, 1);
			else {
				var myReverse = this.getPrevChar(myContainer, myOffset);
				//if the prev character is also a word, then assume it's part of same word and it's ok to go forward
				if (this.regexWordCharacterFull.test(myReverse.character)) {
					myChar = myContainer.nodeValue.substr(myOffset, 0, 1);
					myOffset = 1;
				}
			}
			if (this.regexWordCharacterBasic.test(myChar)) {//go forward
				if (myType == 'normal') {
					var myNormal = this.getNextChar(myContainer, myOffset - 1);
					if (this.regexWordCharacterFull.test(myNormal.character)) {
						return this.fitToEndWord(myNormal.container, myNormal.offset + 1, 'normal');
					}
				}
				return {container: myContainer, offset: myOffset};
			}
			else if (myType == 'normal' && this.regexWordPunc.test(myChar)) {//possibly go back or forward, depending on context
				var myNormal = this.getNextChar(myContainer, myOffset);
				if (this.regexWordNumbers.test(myNormal.character)) return this.fitToEndWord(myNormal.container, myNormal.offset, 'normal');
				else return {container: myContainer, offset: myOffset - 1};
			}
			//otherwise go back
			var myReverse = this.getPrevChar(myContainer, myOffset - 1);
			if (myReverse.character.length == 1) return this.fitToEndWord(myReverse.container, myReverse.offset + 1, 'reverse');
			else return {container: myContainer, offset: myOffset};
		},
	
		fitToStartWord: function(myContainer, myOffset, myType) {
			var myChar = myContainer.nodeValue.substr(myOffset, 1);
			if (this.regexWordCharacterBasic.test(myChar)) {//go back
				if (myType == 'normal') {
					var myPrev = this.getPrevChar(myContainer, myOffset);
					if (this.regexWordCharacterFull.test(myPrev.character)) {
						return this.fitToStartWord(myPrev.container, myPrev.offset, 'normal');
					}
				}
				return {container: myContainer, offset: myOffset};
			}
			else if (myType == 'normal' && this.regexWordPunc.test(myChar)) {//possibly go back or forward, depending on context
				var myPrev = this.getPrevChar(myContainer, myOffset);
				if (this.regexWordNumbers.test(myPrev.character)) return this.fitToStartWord(myPrev.container, myPrev.offset, 'normal');
			}
			var myNext = this.getNextChar(myContainer, myOffset);
			if (myNext.character.length == 1) return this.fitToStartWord(myNext.container, myNext.offset, 'reverse');
			else return {container: myContainer, offset: myOffset};
		},
	
		getNextChar: function(myContainer, myOffset) {
			if (myOffset < 0) {
				var myPrevContainer = jQuery.fn.wrapSelection.dom.GetPreviousTextNode(myContainer);
				if (myPrevContainer) {
					myContainer = myPrevContainer;
					myOffset = myContainer.length;
				}
			}
			if (myOffset < myContainer.length - 1) {
				return {container: myContainer, offset: myOffset + 1, character: myContainer.nodeValue.substr(myOffset + 1, 1)};
			}
			else {
				var myNext = jQuery.fn.wrapSelection.dom.GetNextTextNode(myContainer, myContainer.parentNode);
				if (!myNext) return {container: myContainer, offset: myOffset, character: ''};
				var myNextElement = jQuery.fn.wrapSelection.dom.GetNextSiblingElement(myContainer);
				while (myNextElement && jQuery.fn.wrapSelection.dom.CompareDocumentPosition(myNext, myNextElement) & 2) {
					if (myNextElement.nodeName.match(this.regexElementBlockers)) return {container: myContainer, offset: myOffset, character: ''};
					myNextElement = jQuery.fn.wrapSelection.dom.GetNextSiblingElement(myNextElement);
				}
				return {container: myNext, offset: 0, character: myNext.nodeValue.substr(0, 1)};
			}
		},
	
		getPrevChar: function(myContainer, myOffset) {
			if (myOffset > 0) {
				return {container: myContainer, offset: myOffset - 1, character: myContainer.nodeValue.substr(myOffset - 1, 1)};
			}
			else {
				var myPrev = jQuery.fn.wrapSelection.dom.GetPreviousTextNode(myContainer);
				if (!myPrev) return {container: myContainer, offset: myOffset, character: ''};
				var myPrevElement = jQuery.fn.wrapSelection.dom.GetPreviousSiblingElement(myContainer);
				while (myPrevElement && jQuery.fn.wrapSelection.dom.CompareDocumentPosition(myPrev, myPrevElement) & 4) {
					if (myPrevElement.nodeName.match(this.regexElementBlockers)) return {container: myContainer, offset: myOffset, character: ''};
					myPrevElement = jQuery.fn.wrapSelection.dom.GetPreviousSiblingElement(myPrevElement);
				}
				return {container: myPrev, offset: myPrev.length - 1, character: myPrev.nodeValue.substr(myPrev.length - 1, 1)};
			}
		}
	
	};

	// DOM Extend
	jQuery.fn.wrapSelection.dom = {
		CompareDocumentPosition: function(myNode, myTargetNode) {
			if (myNode.compareDocumentPosition) 
				return myNode.compareDocumentPosition(myTargetNode);
			return null;
		},
		
		GetNextSiblingElement: function(myNode) {
			return jQuery.fn.wrapSelection.dom.getElementOrder(myNode, 'next');
		},

		GetNextSiblingOrParent: function(myNode) {
			return jQuery.fn.wrapSelection.dom.getSiblingOrParentOrder(myNode, 'next');
		},

		GetNextTextNode: function(myNode, myParent) {
			while (myNode = jQuery.fn.wrapSelection.dom.getNodeOrder(myNode, myParent, 'next')) {
				if (myNode.nodeType == 3) return myNode;	
			}
			return myNode;
		},

		GetPreviousSiblingElement: function(myNode) {
			return this.getElementOrder(myNode, 'previous');
		},

		GetPreviousTextNode: function(myNode, myParent) {
			while (myNode = jQuery.fn.wrapSelection.dom.getNodeOrder(myNode, myParent, 'previous')) {
				if (myNode.nodeType == 3) return myNode;	
			}
			return myNode;
		},

		getElementOrder: function(myNode, myType) {
			myType += 'Sibling';
			while (myNode[myType] && myNode[myType].nodeType != 1) {
				myNode = myNode[myType];
			}
			return myNode[myType];
		},

		getSiblingOrParentOrder: function(myNode, myOrder) {
			var mySibling = myOrder + 'Sibling';
			if (myNode[mySibling]) return myNode[mySibling];
			else if (myNode.parentNode) return this.getSiblingOrParentOrder(myNode.parentNode, myOrder)
			else return null;
		},

		getNodeOrder: function(myNode, myParent, myOrder) {//checkCurrent should usually only be called recursively
			if (typeof myParent == 'undefined') myParent = document.body;
			if (myNode.hasChildNodes()) return (myOrder == 'next') ? myNode.firstChild : myNode.lastChild;
			if (myNode == myParent) return null;
			var mySibling = (myOrder == 'next') ? 'nextSibling' : 'previousSibling';
			if (myNode[mySibling]) return myNode[mySibling];
			while (myNode = myNode.parentNode) {
				if (myNode == myParent) return null;
				if (myNode[mySibling]) return myNode[mySibling];
			}
			return null;
		}
	};

	// Integrate Internet Explorer Code
	if (jQuery.browser.msie) {
		jQuery.fn.wrapSelection.range.msie = {
			ClearAllRanges: function(){
				if (this.selection) 
					this.selection.empty(); //clear the current selection; we don't want it hanging around
				this.ClearVariables();
			},

			doGetSelection: function() {
				this.selection = document.selection;
				var myRange = this.selection.createRange();
				var myText = myRange.text;
				if (!myText.length) return false;
				if (!myText.match(this.onlySpacesMatch)) return false; //if only whitespace, return
				var myStart = this.getInitialContainer(myRange.duplicate(), 'start');
				var myStartIndex = jQuery.fn.wrapSelection.dom.SourceIndex(myStart.container, 'string');
				var myEnd = this.getInitialContainer(myRange, 'end', myStart.container);
				if (myStartIndex == jQuery.fn.wrapSelection.dom.SourceIndex(myEnd.container, 'string')) myStart.container = myEnd.container;

				this.startContainer = myStart.container;
				this.startOffset = myStart.offset;
				this.endContainer = myEnd.container;
				this.endOffset = myEnd.offset;

				return true;
			},

			getInitialContainer: function(myRange, myType) {
				if (myType == 'start') myRange.collapse(true); //collapse to start
				else myRange.collapse(false); //collapse to end
				myRange.move('character', 1);
				myRange.move('character', -1); //need to do this to allow node removal later
				var myParent = myRange.parentElement();
				myRange.pasteHTML('<span id="range-temp"></span>');
				var myTemp = $('#range-temp')[0];
				var myOffset = 0;
				var myNode = jQuery.fn.wrapSelection.dom.GetNextTextNode(myTemp, myTemp.parentNode);
				if (!myNode) {
					myNode = jQuery.fn.wrapSelection.dom.GetPreviousTextNode(myTemp, myTemp.parentNode);
					myOffset = myNode.length;
				}
				myTemp.parentNode.removeChild(myTemp);
				if (myNode.previousSibling && myNode.previousSibling.nodeType == 3) {
					var myPrev = myParent.removeChild(myNode.previousSibling);
					myOffset += myPrev.length;
					myNode.insertData(0, myPrev.nodeValue);
				}
				return { container: myNode, offset: myOffset };
			}
		}

		jQuery.fn.wrapSelection.dom.msie =  {
			CompareDocumentPosition: function(myNode, myTargetNode) {
				if (!myNode || !myTargetNode) 
					return null;
				if (myNode == myTargetNode) 
					return 0;
				if (jQuery.fn.wrapSelection.dom.isAncestorOf(myNode, myTargetNode)) 
					return 10; //8 + 2
				if (jQuery.fn.wrapSelection.dom.isAncestorOf(myTargetNode, myNode)) 
					return 20; //16 + 4
				var isStartBefore;
				//textnodes don't have sourceindexes
				if (myNode.sourceIndex && myTargetNode.sourceIndex) {
					isStartBefore = (myNode.sourceIndex < myTargetNode.sourceIndex);
				}
				//because getSourceIndex doesn't give the same numbers as .sourceIndex, we need to use the same formulas for both
				else {
					var myStartIndex = this.SourceIndex(myNode);//jQuery.fn.wrapSelection.dom.SourceIndex(myNode);
					var myEndIndex = this.SourceIndex(myTargetNode);//jQuery.fn.wrapSelection.dom.SourceIndex(myTargetNode);
					isStartBefore = this.isIndexBefore(myStartIndex, myEndIndex);//jQuery.fn.wrapSelection.dom.isIndexBefore(myStartIndex, myEndIndex);
				}
				if (isStartBefore) 
					return 4; //target is after
				else 
					return 2; //target is before
			},
	
			isAncestorOf: function(myNode, myTargetNode) {
				if (myTargetNode.nodeType != 1) 
					return false;
				if (myNode.nodeType != 1) 
					myNode = myNode.parentNode;
				if (myNode == myTargetNode) 
					return true;
				return myTargetNode.contains(myNode);
			},
	
			isIndexBefore: function(myArray1, myArray2) {
				while (myArray1) {
					var my1 = myArray1.shift();
					if (!myArray2) 
						return true; //I think this means it would be a parent, so it shouldn't happen
					var my2 = myArray2.shift();
					if (my1 == my2) 
						continue;
					return (my1 < my2);
				}
				return null;
			},
	
			SourceIndex: function(myNode, myType) {
				var myOut = [];
				do {
					var myOffset = 0;
					while (myNode.previousSibling) {
						myNode = myNode.previousSibling;
						myOffset++;
					}
					myOut.unshift(myOffset);
				}
				while (myNode = myNode.parentNode);
				if (myType && myType == 'string') 
					return myOut.join('.');
				return myOut;
			}
		}

		jQuery.extend(jQuery.fn.wrapSelection.range, jQuery.fn.wrapSelection.range.msie);	
		jQuery.extend(jQuery.fn.wrapSelection.dom, jQuery.fn.wrapSelection.dom.msie);	
	};
/** END Internet Explorer Code **/

	// plugin defaults
	jQuery.fn.wrapSelection.defaults = {
		tmpRange: 'tmpRange',
		fitToWord: true
	};
	// end of closure
})();