/**
 * SkillMasters | Abel
 */

var contentPath = 'content/';

$( document ).ready(function() {
    loadContent(getLocalPath($(".current")));

    $("#menu li a").click(navigationClick);
});

function loadContent(content) {
    $("#content").fadeOut(200, function () {
        $(this).fadeIn(400).load(content, function () {
            $("img").on("error", function() {
                $(this).attr("src", "images/no-img.png");
            });

            $("a.navigation").click(navigationClick);
        });
    });
}

function refreshContent($current) {
    if ($current.hasClass("current")) return;

    $(".current").removeClass("current");
    $current.addClass("current");
    loadContent(getLocalPath($current));
}

function getLocalPath($current) {
    return contentPath + $current.parent().attr("class") + '.html';
}

function navigationClick() {
    $this = $(this);
    if ($this.attr("href") != undefined) {
        $this.off("click");
        return;
    }
    refreshContent($this);
}