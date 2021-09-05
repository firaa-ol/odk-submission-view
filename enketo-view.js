import {Form} from 'enketo-core';
import * as $ from 'jquery';

export function buildEnketoForm(xform, model, instance){
    $('#form-container').replaceWith($('<textarea/>').html(xform).text());
    var form = new Form($('form.or')[0], {
        modelStr : $('<textarea/>').html(model).text(),
        instanceStr: $('<textarea/>').html(instance).text(),
        submitted: true
    });
    console.log(form.init());
    $('form :input:not(:button)').each(function(x) {
        $(this).prop('disabled', true);
    });
}