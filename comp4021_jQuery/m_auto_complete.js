$(function () {
    //data came from https://github.com/voltraco/genres
    let m_data = [{ label: "aaaaaa", category: "" }];

    let music_data_set = $.getJSON("https://raw.githubusercontent.com/voltraco/genres/master/categorized-subset.json", function (data) {

        $.each(data, function (key, val) {
            $.each(val, function (k, v) {
                m_data.push({ label: v, category: key })
            })
        });
    })
    m_data.push({ label: "aaaaab", category: "" })


    $("#search").catcomplete({
        delay: 0,
        source: m_data,
        // select: function (value, event) {
        //     console.log("gg");
        // }
    }

    );
}
);