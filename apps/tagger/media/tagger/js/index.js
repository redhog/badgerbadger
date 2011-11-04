$(document).ready(function () {
  function parseQueryString() {
    var res = {};
    $.each(location.search && location.search.substr(1).replace(/\+/gi," ").split("&"), function (i, s) {
      s = s.split("=");
      if (res[s[0]] === undefined) {
	res[s[0]] = [];
      }
      res[s[0]].push(s[1]);
    });
    return res;
  } 


  function updateSearch() {
    var tags = [];
    $(".search .tags .tag").each(function () { tags.push(this.tag); });

    $.ajax({
      url: "/badgerbadger/tagger/search",
      data: {
        tags: tags
      },
      success: function (data) {
        $('.results').html(data);
      },
      dataType: "html"
    });
  }

  function removeTag(tag) {
    $(".search .tags .tag_" + $.slug(tag)).remove();
    updateSearch();
  }

  function addTag(tag) {
    if (tag != '') {
      $(".search .tags").append("<span class='tag tag_" + $.slug(tag) + "'>" + tag + "<a href='javascript: 0;' class='remove'>X</a></span> ");
      $(".search .tags .tag:last-child")[0].tag = tag;
      console.log([$(".search .tags .tag:last-child")[0], $(".search .tags .tag:last-child")[0].tag]);
      $(".search .tags :last-child .remove").bind("click", function () {
	removeTag(tag);
      });
    }
    updateSearch();
  }

  $(".search .new_tag").autocomplete({source: "/badgerbadger/tagger/tags/json"});
  $(".search .new_tag").keypress(function (event) {
    if (event.keyCode == 13) { // Enter...
      addTag($(".search .new_tag")[0].value);
      $(".search .new_tag")[0].value = '';
    }
  });

  $(".url").keypress(function (event) {
    if (event.keyCode == 13) { // Enter...
      document.location = "/badgerbadger/tagger/view?url=" + encodeURIComponent($(".url")[0].value);
    }
  });

  var tags = parseQueryString().tag;
  if (tags !== undefined) {
    $.each(tags, function (i, tag) { addTag(unescape(tag)); });
  }

  updateSearch();
});
