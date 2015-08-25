var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');
require('cropper');
require('jquery-modal');

var self = __.imageeditor = {

    initializeImageEditor: function(parts, image) {

        // if (image.custom_properties.hasOwnProperty('metadata')) {
        //     imageEditor.editor.addClass('-has-metadata');
        // }

        // Get the image's path
        var src = '/media/'+image.id+'/'+image.file_name;

        // Set the editor title
        $('#image-editor-title')
            .text(translate('parts.editImage') + ': ' + image.name)
        ;

        var $progressCursor = $('<style />')
            .html('* { cursor: progress !important; }')
            .appendTo('body')
        ;

        var img = $.Deferred()
            .done(function(originalWidth) {
                self.renderImageEditor(parts, image, src, image.crop, originalWidth);
            })
            .always(function() {
                $progressCursor.remove();
            })
        ;

        $('<img/>')
            .attr('src', src)
            .on('load', function() {
                img.resolve();
            })
            .on('error', function() {
                img.reject();
            })
        ;
    },

    renderImageEditor: function(parts, image, src, currentCrop, originalWidth) {

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
        var $cropper = self.initializeCropper(src, currentCrop);

        // Editor confirm event.
        $('#media-options-confirm')
            .on('click', function(e) {
                e.preventDefault();

                image.crop = self.calculateImageCrop(
                    $cropper.cropper('getData'),
                    $cropper.cropper('getCanvasData')
                );

                __.table.updateTextarea(parts);
                $.modal.close();
            });

        // Editor cancel event.
        $('#media-options-cancel')
            .on('click', function(e) {
                e.preventDefault();
                $.modal.close();
            });
    },

    initializeCropper: function(src, currentCrop) {
        var $cropper = $('#image-editor-img');

        var options = {
            aspectRatio: 3/2,
            autoCropArea: .8,
            strict: true,
            guides: false,
            highlight: false,
            dragCrop: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            zoomable: false,
            rotatable: false
        };

        $cropper
            .attr('src', src)
            .on('build.cropper', function() {
                $cropper.parent().css('opacity', 0);
            })
            .on('built.cropper', function() {
                var canvasData = $cropper.cropper('getCanvasData');

                if (currentCrop !== null) {
                    $cropper.cropper('setData', {
                       x: currentCrop.x * canvasData.width,
                       y: currentCrop.y * canvasData.height,
                       width: currentCrop.width * canvasData.width,
                    });
                }

                $cropper.parent().css('opacity', 1);
            })
            .cropper(options)
        ;

        return $cropper;
    },

    closeImageEditor: function() {
        // Unbind events from persistent elements
        $('#media-options-confirm').off('click');
        $('#media-options-cancel').off('click');

        // Destroy the cropper
        $('#image-editor-img').cropper('destroy').attr('src', '');
    },

    calculateImageCrop: function(cropData, canvasData) {

        return {
            width: cropData.width / canvasData.width,
            height: cropData.height / canvasData.height,
            x: cropData.x / canvasData.width,
            y: cropData.y / canvasData.height
        }
    }
}
