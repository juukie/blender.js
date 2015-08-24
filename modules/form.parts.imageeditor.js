var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');
require('cropper');

__.initializeImageEditor = function() {
    var $imageEditor = $('#image-editor');

    $imageEditor.show();

    return $imageEditor;
}

__.closeImageEditor = function($cropper, $imageEditor) {
    $cropper.cropper('destroy').attr('src', '');
    $imageEditor.hide();
}

__.initializeCropper = function(image) {
    var $cropper = $('#image-editor-img');

    $cropper
        .attr('src', '/media/'+image.id+'/'+image.file_name)
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
