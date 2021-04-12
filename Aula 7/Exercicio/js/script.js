$(document).ready(function(){
    var coursePath = "course/course.html";
    var examplePath = "course/examples/";
    $("#topmenu").width($("#leftpanel").width())
    var pages = 15;
    for(var i = 1; i <= pages; i++){
        var s = "0" + i;
        $("#topmenu").append("<a id = \"page" + i + "\" class=\"page\" href=\"#" + i + "\" data-page = \"" + i + "\">" + i + "</a>");
    }
    $(".panel-left").resizable({
        handleSelector: ".splitter",
        resizeHeight: false,
        onDrag: function(e, $el, opt){
            $("#topmenu").width($("#leftpanel").width())
        },
        onDragEnd: function(e, $el, opt){
            $("#topmenu").width($("#leftpanel").width())
            $("#example").attr("src", function( i, val){
                return val;
            });
        }
    });
    $(".page").click(function(){
        var page = String($(this).data("page")).padStart(2, 0);
        $(".coursepage").hide();
        $("#coursepage" + page).show();
        $(".page").removeClass("currentpage");
        $(this).addClass("currentpage");
        $("#example").attr("src", examplePath + page + "/");
        $("#leftpanel").scrollTop(0);
    })
    var startPage = parseInt(location.hash.substr(1));
    if(isNaN(startPage)){
        startPage = 1;
    }
    $("#tutorial").load(coursePath, function(){
        Prism.highlightAll();
        $("#page" + startPage).click();
    });
});
