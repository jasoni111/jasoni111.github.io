function extractLast(term) {
    return term.split(/,\s*/).pop();
}
function extractNotLast(term) {
    let to_return = term.split(/,\s*/);
    to_return.pop();
    return to_return.join();
}


$.widget("custom.catcomplete", $.ui.autocomplete, {

    _create: function () {
        this._super();
        this.widget().menu("option", "items", "> :not(.ui-autocomplete-category)");
        // remove the original event handler
        this._off(this.menu.element, "menuselect");
        this._off(this.menu.element, "menufocus");
        // add my own event handler
        this._on(this.menu.element, {
            menuselect: function (event, ui) {
                var item = ui.item.data("ui-autocomplete-item"),
                    previous = this.previous;

                // only trigger when focus was lost (click on menu)
                if (this.element[0] !== this.document[0].activeElement) {
                    this.element.focus();
                    this.previous = previous;
                    // #6109 - IE triggers two focus events and the second
                    // is asynchronous, so we need to reset the previous
                    // term synchronously and asynchronously :-(
                    this._delay(function () {
                        this.previous = previous;
                        this.selectedItem = item;
                    });
                }

                // The only line I changed
                if (false !== this._trigger("select", event, { item: item })) {
                    this._value(extractNotLast(this.term) ? extractNotLast(this.term) + ',' + item.value : item.value);
                }
                // reset the term after the select event
                // this allows custom select handling to work properly
                this.term = this._value();

                this.close(event);
                this.selectedItem = item;
            },
            menufocus: function (event, ui) {
                var label, item;
                // support: Firefox
                // Prevent accidental activation of menu items in Firefox (#7024 #9118)
                if (this.isNewMenu) {
                    this.isNewMenu = false;
                    if (event.originalEvent && /^mouse/.test(event.originalEvent.type)) {
                        this.menu.blur();

                        this.document.one("mousemove", function () {
                            $(event.target).trigger(event.originalEvent);
                        });

                        return;
                    }
                }

                item = ui.item.data("ui-autocomplete-item");
                if (false !== this._trigger("focus", event, { item: item })) {
                    // use value to match what will end up in the input, if it was a key event
                    if (event.originalEvent && /^key/.test(event.originalEvent.type)) {
                        this._value(extractNotLast(this.term) ? extractNotLast(this.term) + ',' + item.value : item.value);
                    }
                }

                // Announce the value in the liveRegion
                label = ui.item.attr("aria-label") || item.value;
                if (label && $.trim(label).length) {
                    this.liveRegion.children().hide();
                    $("<div>").text(label).appendTo(this.liveRegion);
                }
            }
        });



    },

    _renderMenu: function (ul, items) {

        var that = this;
        var currentCategory = "";
        var li;
        $.each(items, function (index, item) {
            if (item.category && item.category != currentCategory) {
                ul.append("<li class='ui-autocomplete-category'>" + item.category + "</li>");
                currentCategory = item.category;
            }

            let regex = new RegExp(extractLast(that.term), "gi");
            let termTemplate = "<span class='ui-autocomplete-term'>%s</span>";
            let HTMLtext = item.label.replace(regex, function (matched) {
                return termTemplate.replace('%s', matched);
            });
            if (item.category) {
                let li = $("<li>").append($.parseHTML(HTMLtext)).appendTo(ul)
                    .data("ui-autocomplete-item", item);
                li.attr("aria-label", item.category + ":" + item.label);
            }
            else {
                $("<li>").append($.parseHTML(HTMLtext)).prependTo(ul)
                .data("ui-autocomplete-item", item);
            }


        });
    },


    // overide base original function
    search: function (value, event) {
        value = value != null ? value : this._value();
        // always save the actual value, not the one passed as an argument
        this.term = this._value();

        // this.term = extractLast(this._value());
        if (value.length < this.options.minLength) {
            return this.close(event);
        }
        if (this._trigger("search", event) === false) {
            return;
        }
        // search with last term
        return this._search(extractLast(this._value()));
    },


    // onSelect: function (e, term, item){
    //   alert("GG!")
    // }

});