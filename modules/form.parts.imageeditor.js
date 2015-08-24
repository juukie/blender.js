var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');
require('cropper');
require('jquery-modal');

__.initializeImageEditor = function(parts, image) {

    var $imageEditor = $('#image-editor');

    if (image.custom_properties.hasOwnProperty('metadata')) {
        $imageEditor.addClass('-has-metadata');
    }

    // Get the image's path
    var src = '/media/'+image.id+'/'+image.file_name;

    // Set the editor title
    $('#image-editor-title')
        .text(translate('parts.editImage') + ': ' + image.name);

    // Determine the image's original dimensions.
    var originalDimensions;
    $('<img/>')
        .attr('src', src)
        .on('load', function() {
            originalDimensions = {
                width: this.width,
                height: this.height
            }
        });

    // Display the editor
    $imageEditor
        .modal({
            showClose: false,
            opacity: 0.85,
            zIndex: 99999
        })
        .on($.modal.BEFORE_CLOSE, function() {
            __.closeImageEditor();
        });

    // Initialize the cropper, this happens on an img element.
    var $cropper = __.initializeCropper(src);

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

            $.modal.close();
        });

    // Editor cancel event.
    $('#media-options-cancel')
        .on('click', function(e) {
            e.preventDefault();
            $.modal.close();
        });
}

__.initializeCropper = function(src) {
    var $cropper = $('#image-editor-img');

    $cropper
        .attr('src', src)
        .cropper({
            aspectRatio: 4/3,
            autoCropArea: 1,
            strict: true,
            guides: false,
            highlight: false,
            dragCrop: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            zoomable: false
        });

    return $cropper;
}

__.closeImageEditor = function() {
    $('#image-editor-img').cropper('destroy').attr('src', '');
}

__.setImageManipulationsFromCrop = function(parts, data, cropData, canvasData, originalDimensions) {
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

    __.updateTextarea(parts);
}
