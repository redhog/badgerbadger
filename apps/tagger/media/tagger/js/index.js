$(document).ready(function () {

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
    $(".search .tags .tag_" + escape(tag)).remove();
    updateSearch();
  }

  function addTag(tag) {
    if (tag != '') {
      $(".search .tags").append("<span class='tag tag_" + escape(tag) + "'>" + tag + "<a href='javascript: 0;' class='remove'>X</a></span> ");
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
      document.location = "/badgerbadger/tagger/view/" + escape($(".url")[0].value);
    }
  });

  updateSearch();
});
