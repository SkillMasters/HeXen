"use strict";

//======================================================================
// REDDIT PARSER AND VIEWER
//======================================================================

$(document).ready(function() {
    $("#reddit-getter").click(function() {
        var url = "https://www.reddit.com/r/" + $("#reddit-sub").val() + "/.json";
        var that = this;

        $(this).attr("value", "Обновить записи");
        $("#loader").show();
        $("#content").fadeOut("fast", function() {
            $(this).html( "<h1>Subreddit not found</h1>" );
        });

        $.getJSON(url)
            .done(function(obj) {
                $("#content").html( convertToHTML(obj) );
                $(".spoiler-link").click(function() {
                    $(this).parent().children(".spoiler-body").slideToggle("slow");
                    return false;
                });

                $("img").each(function() {
                    this.onerror = function() {$(this).css("display", "none");};
                });
            })
            .fail(function(request, textStatus) {
                $(that).attr("value", "Загрузить записи");
            })
            .always(function() {
                $("#loader").hide();
                $("#content").fadeIn("slow");
            })
    });

    $("#reddit-sub").keypress(function(event) {
        if (event.keyCode == 13 || event.which == 13) {
            $('#reddit-getter').click();
            event.preventDefault();
        }
    });
});


//--------------------------------------------------
// Functions
//--------------------------------------------------

function convertToHTML(tree) {
    var html = "";
    var stack = [];
    var current = 0;
    console.log(JSON.parse(JSON.stringify(tree)));

    stack.push(tree);
    while (stack.length > 0) {
        current = stack[stack.length - 1];
        if (!current.visited) {
            html += "<div class=" + current.kind.toLowerCase() + ">\n";

            switch ( current.kind.toLowerCase() ) {
                case "listing":
                    break;

                case "t3":
                    html += generateRowHTML(current.data);
                    break;

                default:
                    html += generateSpoilerHTML(
                        "JSON-" + current.kind,
                        JSON.stringify(current.data)
                    );
            }
        }
        current.visited = true;

        if (current.data.children && current.data.children.length > 0) {
            stack.push( current.data.children.shift() );
            continue;
        }
        
        current = stack.pop();
        delete current.visited;

        html += "</div>\n";
    }
    return html;
}

function generateRowHTML(data) {
    var html = "";
    var preview = "";

    html += "<div class='row " + data.post_hint + "' style='min-height: " + data.thumbnail_height + "px'>";
    html += "<img class='field row-thumbnail' align='left' src='" + data.thumbnail + 
            "' height='" + data.thumbnail_height + "px'\\>";
    html += "<div class='field row-body'>";
    html += "<div>"
    html += "<div class='title'><a href='" + data.url + "'>" + data.title + "</a></div>";
    html += "<div class='domain'>(" + data.domain + ")</div>";
    html += "<div class='author'>" + data.author + "</div>";
    html += "<div class='score'>" + data.score + "</div>";
    
    if (data.preview !== undefined) { // && data.preview.enabled === true)
        var image = data.preview.images[0];
        var variants = image.variants;
        var keys = Object.keys(variants);
        var index = 0;

        switch ( data.post_hint ) {
            case "rich:video":
                if (data.preview.enabled === false) break;

            default:
                if (image === undefined) break;

                preview += "<div class='content_unwrap'>"
                        +  "<div class='not_clicked'>";

                preview += "<img src='";
                if (keys.length !== 0) {
                    preview += variants[keys[0]].source.url;
                } else if (image.source !== undefined) {
                    preview += image.source.url;
                } else {
                    index = Math.floor(image.resolutions.length / 2);
                    preview += image.resolutions[index].url;
                }
                preview += "'\\>"

                preview += "</div>"
                        +  "</div>";
        }
    } else if (data.media !== null && data.media.reddit_video !== undefined) {
        preview += "<div class='content_unwrap'>"
                +  "<div class='not_clicked'>"
                +  "<video width='" + data.media.width +
                   "' height='" + data.media.height + "' autoplay controls>"
                +  "<source src='" + data.media.reddit_video.fallback_url + "'>"
                +  "</video>"
                +  "</div>"
                +  "</div>";
    } else if (data.selftext !== undefined && data.selftext !== "") {
        preview += "<div class='content_unwrap'>"
                +  "<div class='not_clicked'>"
                +  "<p>" + data.selftext + "</p>"
                +  "</div>"
                +  "</div>";
    }

    if (preview !== "") {
        html += generateSpoilerHTML("Preview", preview);
    }

    html += generateSpoilerHTML("JSON", JSON.stringify(data));
    html += "</div>"
         +  "</div>"
         +  "</div>";

    return html;
}

function generateSpoilerHTML(title, body) {
    var html = "";
    html += "<div class='spoiler'>\n";
    html += "<a href='' class='spoiler-link'>" + title + "</a>\n";
    html += "<div class='spoiler-body'>" + body + "</div>\n";
    html += "</div>\n";

    return html;
}