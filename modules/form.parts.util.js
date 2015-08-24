var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');

__.util = {
    
    parseFormJson: function(parts) {

        // Get textarea source. Result is an array of part objects
        var partArrayTemp = $.parseJSON(parts.$textArea.val());

        // Be sure get array without irregular index (media/download json input)
        var partArray = [];
        for (var key in partArrayTemp) {
            partArray.push(partArrayTemp[key]);
        }

        // Extend each part object with id for dataTables row id
        return partArray.map(function (part) {

            part.DT_RowId = part[parts.options.primaryKeyName];
            return part;
        });
    },

    renderImage: function(data, full) {
        var mediaRoot = '/media/' + full.id ;
        var link = mediaRoot +'/'+ full.file_name;
        return '<a href="'+link+'" target="_blank"><div style="background-image:url(\'' + mediaRoot + '/conversions/admin.jpg\');"></div></a>';
    },

    preserveWidthOnDrag: function(e, ui) {
        ui.children().each(function() {
            $(this).width($(this).width());
        });
        return ui;
    },

    clearAlerts: function(where) {
        where.empty();
    },

    writeAlert: function(msg, type, where) {

        var css;

        switch(type)
        {
            case 'info':
                css = "-info";
                break;
            case 'success':
                css = "-success";
                break;
            case 'warning':
                css = "-warning";
                break;
            case 'error':
                css = "-danger";
                break;

        }

        where.append($('<div class="alert '+ css + '">'+ msg + '</div>'));
    },

    isNormalPositiveInteger: function(str) {
        var n = ~~Number(str);
        return String(n) === str && n > 0;
    }
}
