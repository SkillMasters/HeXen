/**
 * SkillMasters | Abel
 */

var contentPath = 'content/';

$( document ).ready(function() {
    loadContent(getLocalPath($(".current")));

    $("#menu li a").click(navigationClick);

    $(".video_preview img").click(loadVideo);

    $("body").append (
        $("<div>")
        .attr("id", "overlay")
        .on("overlay:toggle", toggleOverlay)
        .click( function () {
            $(this).trigger("overlay:toggle");
        })
    );
});

function loadContent(content) {
    $content = $("#content");
    $content.children().fadeOut(400, function () {
        $content.load(content, function () {
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

function loadVideo() {
    $this = $(this);
    if ($this.attr("href") == undefined) return;

    $("#overlay")
    .trigger("overlay:toggle")
    .append (
        $("<div>").append (
            $("<iframe>").attr({
                width: "100%",
                height: "100%",
                src: $this.attr("href"),
                frameborder: 0,
                gesture: "media",
                allow: "encrypted-media",
                allowfullscreen: "allowfullscreen"
            })
        )
    );
}

function getLocalPath($current) {
    return contentPath + $current.parent().attr("class") + '.html';
}

function toggleOverlay() {
    $(this).text("").fadeToggle(200);
}

function navigationClick() {
    $this = $(this);
    if ($this.attr("href") != undefined) {
        $this.off("click");
        return;
    }
    refreshContent($this);
}