
(function ($) {
    var selection = {}, downEvent, textarea, dot;
	
	var sortNumber = function(a, b) { return a - b; }
	var dotDown = function () { selection.isCopy = true; $(this).css({ 'cursor': 'crosshair' }); };

    var selPrimary = function (table) { return $(table).find('.j-selected.j-primary'); };
    var selCurrent = function (table) { return $(table).find('.j-selected.j-current'); };

    var selClean = function (table) {
        dot.css({ display: 'none' });
        $(table).find('.j-selected,.j-current,.j-primary').removeClass('j-selected j-current j-primary');
    };

    var selSelect = function (sender, event) {
        event.target = sender.get(0);
        var table = sender.parents('table');
        if (event.shiftKey) selection.isDown = true;
        else selMouseDown.apply(table, [event]);
        selMouseMove.apply(table, [event]);
        selMouseUp.apply(table, [event]);
    };


    var selMouseDown = function (event) {
		if ($(event.target).parents('tbody').length < 1)
			return;
	
        var $td = $(event.target).parents('td').andSelf().filter('td');
			
        if (event.ctrlKey) {
            $td.toggleClass('j-selected');
            return false;
        }

        selection.isDown = true;

        if (!event.shiftKey) {
            $(this).find('td.j-selected,td.j-primary,td.j-current').removeClass('j-selected j-primary j-current');

            $td.addClass('j-selected j-primary j-current');

            $td.append(dot.css({ display: 'block' }).mousedown(dotDown));
            var pos = $td.position();
            dot.css({ top: pos.top + $td.outerHeight() - 3, left: pos.left + $td.outerWidth() - 3 });

            selection.values = [];

            selection.tdIdxStart = $td.index();
            selection.trIdxStart = $td.parents('tr').index();
            selection.tbodyIdx = $td.parents('tbody').index();

        }
        else
            selMouseMove.apply(this, [event]);

        return false;
    };

    var selMouseMove = function (event) {

		if (typeof event.target === 'undefined' || $(event.target).parents('tbody').length < 1) return;
		
        if (selection.isDown) {
            var $td = $(event.target).parents('td').andSelf().filter('td');

            $(this).find('td.j-selected').removeClass('j-selected j-current');
            selection.tdIdxStop = $td.index();
            selection.trIdxStop = $td.parents('tr').index();
            $td.filter('td').addClass('j-current');

            tds = [selection.tdIdxStart, selection.tdIdxStop].sort(sortNumber);
            trs = [selection.trIdxStart, selection.trIdxStop].sort(sortNumber);

            selection.tds = $td.parents('tbody').find('tr').slice(trs[0], trs[1] + 1).map(function (i, o) { return $(this).find('td').slice(tds[0], tds[1] + 1).get() });

            if (event.altKey) selection.tds.removeClass('j-selected');
            else selection.tds.addClass('j-selected');

        }
    };

    var selMouseUp = function (event) {
		if(!selection.isDown) return;
        selection.isDown = false;
        var options = $(this).data('options') || {};

        if (selection.isCopy) {
            $(this).find('td.j-selected').text(selPrimary($(this)).text());
            $(this).css({ 'cursor': 'default' });
            selection.isCopy = false;
        }

        selection.values = $.makeArray($(this).find('tr:has(td.j-selected)').map(function () { return [$(this).find('.j-selected').map(function (i, o) { return $(o).text(); }).get()] }));

        textarea.val(selection.values.map(function (i, o) { return i.join('\t') }).join('\r\n')).focus().select();
        textarea.data({ table: this, options: options });

        if (selection.values.length == 0)
            return;

        event.stopPropagation();

        if (options.onSelect)
            options.onSelect.apply(this, [selection.values]);

        return false;
    };

    var selTextAreaBlur = function () { if (!selection.isDown) selClean($(this).data('table')); };
    var selTextAreaKeyDown = function (event) { downEvent = event; };
    var selTextAreaKeyUp = function (event) {
        if (downEvent && downEvent.ctrlKey && event.keyCode == 86) {
            //control v
            var a1 = $(this).val().trim().split('\n').map(function (i, o) { return i.split('\t'); });
            var tdX = tdY = selPrimary($(this).data('table'));
            $.each(a1, function (i1, a2) {
                $.each(a2, function (i2, s) {
                    tdX.text(s);
                    tdX = tdX.next('.j-selected');
                });
                tdX = tdY = tdY.below('.j-selected');
            });
        }
        else if (downEvent && downEvent.ctrlKey && (event.keyCode == 67 || event.keyCode == 17)) { return; } //control c
        else if (event.keyCode == 33) { $(document).scrollTop($(document).scrollTop() - $(window).height()); } //page down
        else if (event.keyCode == 34) { $(document).scrollTop($(document).scrollTop() + $(window).height()); } //page up
        else if (event.keyCode == 39) { selSelect(selCurrent($(this).data('table')).next(), event); } //right
        else if (event.keyCode == 37) { selSelect(selCurrent($(this).data('table')).prev(), event); } //left
        else if (event.keyCode == 38) { selSelect(selCurrent($(this).data('table')).above(), event); } //up
        else if (event.keyCode == 40) { selSelect(selCurrent($(this).data('table')).below(), event); } //down
        else if (downEvent && (event.keyCode == 16 || downEvent.ctrlKey || downEvent.altKey)) { return false; }
        else {
            var options = $(this).data('options'),
                table = $(this).data('table'),
                tds = $(table).find('.j-selected'),
                text = $(this).val();

            if (!options.readonly)
                tds.empty().html(text);

            if (options.onKeyPress)
                options.onKeyPress.apply(this, [text, tds]);
        }
    };



    $.fn.setCurrent = function (sel) {
        var elm = sel ? this.filter(sel) : this;
        if (elm.length > 0) {
            $(this).parents('table').find('.j-current').removeClass('j-current');
            elm.addClass('j-current');
        }
        return elm;
    };
    $.fn.above = function (sel) { return $(this).parent().prev().children(':nth-child(' + ($(this).index() + 1) + ')').setCurrent(sel); };
    $.fn.below = function (sel) { return $(this).parent().next().children(':nth-child(' + ($(this).index() + 1) + ')').setCurrent(sel); };

    $.fn.sheet = function (opt) {

        var options = $.extend({ readonly: false }, opt);
        $(this).data({ options: options });

        if (!textarea) {
            dot = $('#divDot').length === 0 ? $('<div style="background-color:#000;width:5px;height:5px;cursor:crosshair;position:absolute;outline:solid 1px #fff;display:none;" />') : $('#divDot');
            textarea = $('#taSelectable').length === 0 ? $('<textarea style="position:fixed;top:-10px;right:1px;height:1px;width:1px" />').appendTo($('body')) : $('#taSelectable');
            textarea.blur(selTextAreaBlur);
            textarea.keydown(selTextAreaKeyDown);
            textarea.keyup(selTextAreaKeyUp);
        }

        $(this)
            .mousedown(selMouseDown)
            .mouseup(selMouseUp)
            .mousemove(selMouseMove);
			
		if($('style.j-select').length < 1)
			$('body').append('<style class="j-select">.j-selected{background-color:#0000ff;color:#fff;border-left:1px solid #0000ff;} .j-selected.j-primary{outline:2px solid #fff;}</style>');
			
		return this;
    };

})(jQuery);