var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');
require('cropper');
require('jquery-modal');

var self = __.imageeditor = {

    initializeImageEditor: function(parts, image) {

        if (image.custom_properties.hasOwnProperty('metadata')) {
            imageEditor.editor.addClass('-has-metadata');
        }

        // Get the image's path
        var src = '/media/'+image.id+'/'+image.file_name;

        // Set the editor title
        $('#image-editor-title')
            .text(translate('parts.editImage') + ': ' + image.name);

        var $progressCursor = $('<style />')
            .html('* { cursor: progress !important; }')
            .appendTo('body:first');

        var originalDimensions = $.Deferred()
            .done(function(dimensions) {
                self.renderImageEditor(src, dimensions);
            })
            .always(function(dimensions) {
                $progressCursor.remove();
                self.renderImageEditor(src, dimensions);
            });

        $('<img/>')
            .attr('src', src)
            .on('load', function() {
                originalDimensions.resolve({
                    width: this.width,
                    height: this.height
                });
            })
            .on('error', function() {
                originalDimensions.reject();
            });
    },

    renderImageEditor: function(src, originalDimensions) {

        var $editor = $('#image-editor');

        // Display the editor
        $editor
            .on($.modal.BEFORE_CLOSE, function() {
                self.closeImageEditor();
            })
            .modal({
                showClose: false,
                opacity: 0.85,
                zIndex: 99999
            });

        // Initialize the cropper, this happens on an img element.
        var $cropper = self.initializeCropper(src);

        // Editor confirm event.
        $('#media-options-confirm')
            .on('click', function(e) {
                e.preventDefault();

                // Unlikely to happen, this would mean you'd have hit confirm before the original dimensions
                // were retrieved.
                if (typeof originalDimensions === 'undefined') {
                    return;
                }

                self.setImageManipulationsFromCrop(
                    parts,
                    image,
                    $cropper.cropper('getCropBoxData'),
                    $cropper.cropper('getCanvasData'),
                    originalDimensions
                );

                $.modal.close();
            });

        // Editor cancel event.
        $('#media-options-cancel')
            .on('click', function(e) {
                e.preventDefault();
                $.modal.close();
            });
    },

    initializeCropper: function(src) {
        var $cropper = $('#image-editor-img');

        $cropper
            .attr('src', src)
            .cropper({
                aspectRatio: 3/2,
                autoCropArea: .75,
                strict: true,
                guides: false,
                highlight: false,
                dragCrop: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                zoomable: false
            });

        return $cropper;
    },

    closeImageEditor: function() {
        $('#image-editor-img').cropper('destroy').attr('src', '');
    },

    setImageManipulationsFromCrop: function(parts, data, cropData, canvasData, originalDimensions) {
        var scale = canvasData.width / originalDimensions.width;

        var manipulations = {
            rect: [
                Math.round(cropData.width * scale), // Width, Todo: Should be a fixed value
                Math.round(cropData.height * scale), // Height, Todo: Should be a fixed value
                Math.round(cropData.left * scale), // X
                Math.round(cropData.top * scale) // Y
            ]
        };

        data.manipulations.push(manipulations);

        __.table.updateTextarea(parts);
    }
}
