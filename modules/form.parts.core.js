var $ = require('jquery');
var translate = require('./interface.translations.js');
require('datatables');

var __ = {

    constructObjectWithOptions: function($textarea) {

        var parts = {};

        // General settings
        parts.imagesRegExp = /(\.|\/)(gif|jpe?g|png)$/i;

        parts.$textArea = $textarea;
        parts.options = parts.$textArea.data('parts')!= undefined ? parts.$textArea.data('parts') : {};
        parts.options.readOnly = (parts.$textArea.attr('readonly') != undefined ) ;

        if(!parts.options.debug) parts.$textArea.hide();
        if( parts.options.dataTableOptions == undefined) parts.options.dataTableOptions = {};

        parts.options.dataTableOptions.language = {
            emptyTable: translate('dataTables.infoEmpty')
        }

        // Init table in DOM
        parts.$formGroup = $textarea.parents('.parts');
        parts.$table = $('<table class="-parts"></table>')
            .appendTo(parts.$formGroup)
            .addClass(parts.options.readOnly ? '-readonly' : '');

        return parts;
    },

    constructColumns: function(parts) {

        var dataColumns = [];

        //options for columns
        for (var key in parts.options.columns) {
            var column = parts.options.columns[key];
            var dataColumn = {};
            dataColumn.data = column.data;
            dataColumn.title = column.title;
            if (column.default) dataColumn.defaultContent = column.default;
            if (column.editable) {
                //editable column style
                switch(column.editable)
                {
                    case 'text':
                        dataColumn.class = "-edit -text";
                        break;
                    case 'integer':
                        dataColumn.class = "-edit -integer";
                        break;
                }

            }
            if (column.hasLink) {
                dataColumn.render = function ( data, type, full ) {
                    //open destination from options in new tab
                    var link = eval('full.'+ parts.options.detailLink);
                    return '<a target="_parts" href="'+link+'">'+data+'</a>';
                }
            }
            //show thumb + link
            if(column.media=='image'){
                dataColumn.class = 'part_thumb -'+column.media;
                dataColumn.render = function(data, type, full) {
                    return __.renderImage(data, full);
                }
            }
            //downloads
            if(column.media=='download'){
                dataColumn.class = 'part_thumb -'+column.media;
                dataColumn.render = function ( data, type, full ) {
                    //if image download: render as image
                    var thumbExtensions = ['pdf', 'jpg', 'png'];
                    if(thumbExtensions.indexOf(full.file_name.split('.').pop()) != -1){
                        return __.renderImage(data, full);
                    }
                    else{
                        var mediaRoot = '/media/' + full.id ;
                        var link = mediaRoot +'/'+ full.file_name;
                        return '<a href="'+link+'" target="media"><div>' + full.file_name.split('.').pop() + '</div></a>';
                    }
                }
            }
            //styling
            if(column.width){
                dataColumn.width = column.width;
            }
            dataColumns.push(dataColumn);
        }

        dataColumns.push({
            data: null,
            class: "-right",
            sortable: false,
            defaultContent: "<a href='#' data-options class='button -small'><span class='fa fa-pencil'></span></a>"
        });

        // Add delete column as last
        if(!parts.options.readOnly){
            dataColumns.push({
                data: null,
                class: "-right",
                sortable: false,
                defaultContent: "<a href='#' data-delete class='button -small -danger'><span class='fa fa-remove'></span></a>"
            });
        }

        return dataColumns;
    },

    initDataTable: function(parts, data, columns) {
        // Gather dataTable options
        parts.options.dataTableOptions.data = data;
        parts.options.dataTableOptions.columns = columns;
        parts.options.dataTableOptions.drawCallback = function() { __.initEditableCells(parts); };
        parts.options.dataTableOptions.paginate = false;
        parts.options.dataTableOptions.sort = false;


        // Init dataTable
        parts.$table.DataTable(parts.options.dataTableOptions);

        // Sort rows?
        __.makeRowsSortable(parts);

        // edit and delete
        __.makeRowsInteraction(parts);
    }
}

module.exports = __;
