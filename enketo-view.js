import {Form} from 'enketo-core';

export function buildEnketoForm(formData){
    $('#form-container').replaceWith(formData.form);
    var form = new Form($('form.or')[0], {
        modelStr : formData.model,
        instanceStr: formData.instance,
        submitted: true
    });
    var errors = form.init();
    $('form :input:not(:button)').each(function(x) {
        $(this).prop('disabled', true);
    });
}