var $ = require('jquery');
var translate = require('./interface.translations.js');
var __ = require('./form.parts.core.js');
require('blueimp-file-upload');
require('blueimp-file-upload/js/jquery.fileupload-process.js');
require('blueimp-file-upload/js/jquery.fileupload-validate.js');
require('blueimp-file-upload/js/jquery.iframe-transport.js');
require('jquery-ui');

var self = __.upload = {

    enableUpload: function(parts) {

        self.constructUploadField(parts);

        var dropZone = self.enableDropZone(parts);

        var uploadOptions = self.constructUploadOptions(parts, dropZone);

        // clear errors
        parts.$uploadField.on('click',function(e){
            __.util.clearAlerts(parts.$uploadAlerts);
        });

        // init file uploads
        parts.$uploadField.fileupload(uploadOptions)
            .prop('disabled', !$.support.fileInput)
            .parent().addClass($.support.fileInput ? undefined : 'disabled');
    },

    constructUploadField: function(parts) {

        //make new input field
        parts.$uploadField = $('<input type="file" name="file" multiple>');
        parts.$uploadMask = $('<span class="button -blue fileinput-button">' + parts.options.upload.label + ' </span>').append(parts.$uploadField);
        parts.$uploadProgress = $('<div class="progress"><div class="progress_bar"></div></div>').hide();
        parts.$uploadAlerts = $('<div class="parts_alerts"></div>');
        parts.$uploadPart = $('<div class="parts_new"></div>').append(parts.$uploadMask,parts.$uploadProgress, parts.$uploadAlerts).appendTo(parts.$formGroup);

        parts.options.upload.errors = [];
    },

    enableDropZone: function(parts) {
        //prevent drag on body, only on formgroup
        $(document).bind('drop dragover', function (e) {
            e.preventDefault();
        });
        var dropZone = parts.$formGroup,
            html = $('html'),
            showDrag = false,
            timeout = -1;
        dropZone.bind('dragenter', function () {
            dropZone.addClass('-dropzone');
            showDrag = true;
        }).bind('dragover', function(){
            showDrag = true;
        }).bind('dragleave drop', function (e) {
            showDrag = false;
            clearAlerts(parts.$uploadAlerts);
            clearTimeout( timeout );
            timeout = setTimeout( function(){
                if( !showDrag ){ dropZone.removeClass('-dropzone'); }
            }, 200 );
        });

        return dropZone;
    },

    constructUploadOptions: function(parts, dropZone) {

        var uploadOptions =  {url: parts.options.upload.url,
            type: 'POST',
            dataType: 'json',
            dropZone : dropZone,
            formData: {'collection': parts.options.upload.collection,
                'modelName': parts.options.upload.modelName},
            singleFileUploads: true,
            messages: {
                maxNumberOfFiles: translate('parts.upload.maxNumberOfFiles'),
                acceptFileTypes: translate('parts.upload.acceptFileTypes'),
                maxFileSize: translate('parts.upload.maxFileSize'),
                minFileSize:  translate('parts.upload.minFileSize')
            }
        };

        if (parts.options.upload.validation.acceptFileTypes == 'images') {
            uploadOptions.acceptFileTypes = parts.imagesRegExp;
        }

        if (parts.options.upload.validation.maxFileSize > 0) {
            uploadOptions.maxFileSize = parts.options.upload.validation.maxFileSize;
        }

        //begin of all uploads
        uploadOptions.start = function(e,data){
            parts.$uploadProgress.show();
            parts.$uploadMask.hide();
        }

        //after all uploads finished
        uploadOptions.stop = function(e, data) {
            parts.$uploadProgress.hide();
            parts.$uploadMask.show();
            parts.$uploadProgress.removeClass('-working');
        }

        //progress for all files
        uploadOptions.progressall = function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('.progress_bar',parts.$uploadProgress).css('width',progress + '%');

            if(progress > 96){
                parts.$uploadProgress.addClass('-working');
                $('.progress_bar',parts.$uploadProgress).css('width', '1%');
            }
        }

        //one file not suited
        uploadOptions.processfail = function (e, data) {
            var currentFile = data.files[data.index];
            if (data.files.error && currentFile.error) {
                // there was an error, do something about it
                var msg = currentFile.error + ': ' + currentFile.name ;
                writeAlert(msg,'error', parts.$uploadAlerts);
            }
        }

        //one file done
        uploadOptions.done = function (e, data) {
            if(data.result.media){
                var rowObj = data.result.media;
                //set ID for row
                rowObj.DT_RowId = data.result.media.id;

                var row = parts.$table.DataTable().row.add(rowObj).draw().node();
                $(row).addClass('-added');

                __.table.updateTextarea(parts);
            }
        }

        //one file error
        uploadOptions.fail = function (e,data) {
            writeAlert( translate('parts.upload.fail') + ' ('+data.errorThrown+')','error', parts.$uploadAlerts);
        }

        return uploadOptions;
    }
}
