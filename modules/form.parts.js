var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');

require('./form.parts.imageeditor.js');
require('./form.parts.table.js');
require('./form.parts.upload.js');
require('./form.parts.util.js');

$.fn.parts = function(options) {
    this.each(function() {

        // Part construction and options
        var parts = __.constructObjectWithOptions($(this));

        // Populate initial data
        var partData = __.util.parseFormJson(parts);

        // Read column settings and convert them for datatables
        var partColumns = __.constructColumns(parts);

        // Initialize the datatable
        __.initDataTable(parts, partData, partColumns);


        // Initialize uploads for adding new rows
        if (parts.options.upload != undefined && !parts.options.readOnly) {
            __.upload.enableUpload(parts);
        }

        // Initialize adding new rows
        if (parts.options.autocomplete != undefined && !parts.options.readOnly) {
            __.table.enableInsert(parts);
        }

        // Return `this` for chaining
        return this;
    });
}

// Register parts component
$('textarea[data-parts]').parts();
