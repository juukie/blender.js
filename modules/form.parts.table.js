var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');
require('datatables');
require('jquery-confirm');

__.makeRowsSortable = function(parts) {

    if(parts.options.orderRows && !parts.options.readOnly){
        parts.$table.addClass('-sortable');
        $('tbody', parts.$table).sortable({
            helper : __.preserveWidthOnDrag,
            axis: 'y',
            cancel:  '.dataTables_empty',
            containment: "parent",
            stop: function () {
                __.updateTextarea(parts);
            },
            handle: "td:not('.-edit')" //no drag behaviour on these cells
        })
    }
},

__.makeRowsInteraction = function(parts) {

    if(!parts.options.readOnly){

        parts.$table
            // init delete btn for entire table
            .on('click', 'a[data-delete]', function (e) {
                e.preventDefault();
                __.deleteRow(parts, $(this).closest('tr')[0]);
                return false;
            })
            // init options btn for entire table
            .on('click', 'a[data-options]', function (e) {
                e.preventDefault();
                __.showOptionsForRow(parts, $(this).closest('tr')[0]);
                return false;
            })
            // no returns on edit field
            .on('keypress', 'td.-edit', function (e) {
                if(e.which == 13) $(this).blur();
            });
    }
}

__.updateTextarea = function(parts)  {

    var sortedData = __.calculateRowOrder(parts);

    //read column settings, convert for datatables
    parts.$textArea.val(JSON.stringify(sortedData));

    parts.$textArea.trigger('change'); //autosave update

}

__.calculateRowOrder = function(parts) {
    var sortedParts = new Array();
    $('tbody tr', parts.$table).each(function(){
        var rowData = parts.$table.DataTable().row( this ).data();
        if(rowData != null) sortedParts.push(rowData);
    });
    return sortedParts;
}

__.addRow = function(parts, rowObj, label)  {

    if(parts.options.readOnly) return false;

    //clear field
    parts.$addPartField.val('');

    //check if row exist
    var rowId = rowObj.DT_RowId;
    var allRows = parts.$table.DataTable().rows().data();
    for (var i = 0; i < allRows.length; i++) {
        if(allRows[i].id == rowId){
            __.writeAlert(parts.options.autocomplete.duplicateLabel, 'error', parts.$addPartAlerts);
            return false;
        }
    }

    //add row
    var row = parts.$table.DataTable().row.add(rowObj).draw().node();
    $(row).addClass('-added');

    __.writeAlert(label + ' ' + translate('parts.added'), 'info', parts.$addPartAlerts);
    __.updateTextarea(parts);
}

__.deleteRow = function(parts, row)  {

    if(parts.options.readOnly) return false;

    $.confirm({
        title: translate('confirm.text'),
        content: ' ',
        confirmButton: translate('confirm.yes'),
        cancelButton: translate('confirm.no'),
        confirmButtonClass: 'button',
        cancelButtonClass: 'button -gray',
        confirm: function(){
            parts.$table.DataTable().rows(row).remove().draw();
            __.updateTextarea(parts);
        }
    });

    return false;

}

__.showOptionsForRow = function(parts, row)  {
    // Bootstrap and display the image editor element.
    var $imageEditor = __.initializeImageEditor();

    // Retrieve the image object from the parts data.
    var imageId = parseInt($(row).attr('id'));

    // Pluck the image data from the DataTable data.
    var image = $.grep(parts.options.dataTableOptions.data, function(image) {
        return image.id === imageId;
    })[0];

    // Initialize the cropper, this happens on an img element.
    var $cropper = __.initializeCropper(image);

    // Determine the image's original dimensions.
    var originalDimensions;
    $('<img/>')
        .attr('src', $cropper.attr('src'))
        .on('load', function() {
            originalDimensions = {
                width: this.width,
                height: this.height
            }
        });

    // Editor confirm event.
    $('#media-options-confirm')
        .on('click', function(e) {
            e.preventDefault();

            // Unlikely to happen, this would mean you'd have hit confirm before the original dimensions
            // were retrieved.
            if (typeof originalDimensions === 'undefined') {
                return;
            }

            __.setImageManipulationsFromCrop(
                parts,
                image,
                $cropper.cropper('getCropBoxData'),
                $cropper.cropper('getCanvasData'),
                originalDimensions
            );

            __.closeImageEditor($cropper, $imageEditor);
        });

    // Editor cancel event.
    $('#media-options-cancel')
        .on('click', function(e) {
            e.preventDefault();
            __.closeImageEditor($cropper, $imageEditor);
        });
}

__.initEditableCells = function(parts)  {

    if(parts.options.readOnly) return false;

    //make cell editable
    $('td.-edit', parts.$table)
        .attr('contenteditable', true)
        .on('focus', function () {
            var $this = $(this);
            $this.data('before', $this.text());
            return $this;
        })
        .on('blur', function () {
            var $this = $(this);
            var string = $this.text();
            var before = $this.data('before');
            if (before !== string) {

                if ($this.hasClass('-integer') && !__.isNormalPositiveInteger(number)) {
                    //reset value
                    $this.text(before);
                    return $this ;
                }

                __.updateCell(this, parts)
            }
            return $this;
        });
}

__.updateCell = function(cell, parts)  {

    if(parts.options.readOnly) return false;

    //update cell data
    parts.$table.DataTable().cell(cell).data( $(cell).text() );

    //push changes to textarea
    __.updateTextarea(parts);
}

__.enableInsert = function(parts) {

    __.constructAddPartField(parts);

    //jquery ui autocomplete on new field
    parts.$addPartField.autocomplete({
        source: parts.options.autocomplete.source,
        appendTo: $(".parts_new", parts.$formGroup),
        minLength: parts.options.autocomplete.minLength,
        html: true,
        select: function (event, ui) {
            //map the autocomplete value to a new row, add neccessary properties

            var rowObj = new Object();
            if (parts.options.foreignTableName!=undefined) {
                rowObj[parts.options.foreignTableName] = ui.item.value;
            }
            else {
                rowObj = ui.item.value;
            }

            //set ID for row
            rowObj.DT_RowId = ui.item.value.id;

            __.addRow(parts, rowObj, ui.item.label);

            event.preventDefault();
            return false;
        },
        focus: function(event, ui) {
            event.preventDefault();
            __.syncAutocompleteField(parts, ui.item.label);
            return false;
        }

    }).keydown(function(e) {

        //don't submit whole form on enter
        if (e.keyCode == 13) {
            return false;
        }

        __.clearAlerts(parts.$addPartAlerts);
    })
}

__.constructAddPartField = function(parts) {
    //make new input field
    parts.$addPartField = $('<input placeholder="' + parts.options.autocomplete.placeholder + '" type="text" data-behaviour="autocomplete" class="form-control">');
    parts.$addPartLabel = $('<label>' + parts.options.autocomplete.label + '</label>');
    parts.$addPartAlerts = $('<div class="parts_alerts"></div>');
    parts.$addPart = $('<div class="parts_new"></div>').append(parts.$addPartLabel, parts.$addPartField, parts.$addPartAlerts).appendTo(parts.$formGroup);

}

__.syncAutocompleteField = function(parts, label)  {
    parts.$addPartField.val(label);
    parts.$addPartLabel.html(parts.options.autocomplete.label);
}
