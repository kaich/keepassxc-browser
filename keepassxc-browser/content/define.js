'use strict';

var kpxcDefine = {};

kpxcDefine.selection = {
    username: null,
    password: null,
    fields: []
};
kpxcDefine.eventFieldClick = null;
kpxcDefine.dialog = null;
kpxcDefine.startPosX = 0;
kpxcDefine.startPosY = 0;
kpxcDefine.diffX = 0;
kpxcDefine.diffY = 0;

kpxcDefine.init = function() {
    const backdrop = kpxcUI.createElement('div', 'kpxcDefine-modal-backdrop', { 'id': 'kpxcDefine-backdrop' });
    const chooser = kpxcUI.createElement('div', '', { 'id': 'kpxcDefine-fields' });
    const description = kpxcUI.createElement('div', '', { 'id': 'kpxcDefine-description' });

    backdrop.append(description);
    document.body.append(backdrop);
    document.body.append(chooser);

    kpxcFields.getAllFields();
    kpxcFields.prepareVisibleFieldsWithID('select');

    kpxcDefine.initDescription();
    kpxcDefine.resetSelection();
    kpxcDefine.prepareStep1();
    kpxcDefine.markAllUsernameFields('#kpxcDefine-fields');

    kpxcDefine.dialog = $('#kpxcDefine-description');;
    kpxcDefine.dialog.onmousedown = function(e) {
        kpxcDefine.mouseDown(e);
    };
};

kpxcDefine.close = function() {
    $('#kpxcDefine-backdrop').remove();
    $('#kpxcDefine-fields').remove();
};

kpxcDefine.mouseDown = function(e) {
    kpxcDefine.selected = kpxcDefine.dialog;
    kpxcDefine.startPosX = e.clientX;
    kpxcDefine.startPosY = e.clientY;
    kpxcDefine.diffX = kpxcDefine.startPosX - kpxcDefine.dialog.offsetLeft;
    kpxcDefine.diffY = kpxcDefine.startPosY - kpxcDefine.dialog.offsetTop;
    return false;
};

kpxcDefine.initDescription = function() {
    const description = $('#kpxcDefine-description');
    const h1 = kpxcUI.createElement('div', '', { 'id': 'kpxcDefine-chooser-headline' });
    const help = kpxcUI.createElement('div', 'kpxcDefine-chooser-help', { 'id': 'kpxcDefine-help' });
    description.append(h1);
    description.append(help);
    
    const buttonDismiss = kpxcUI.createElement('button', 'kpxc-button kpxc-red-button', { 'id': 'kpxcDefine-btn-dismiss' }, tr('defineDismiss'));
    buttonDismiss.onclick = function(e) {
        kpxcDefine.close();
    };

    const buttonSkip = kpxcUI.createElement('button', 'kpxc-button kpxc-orange-button', { 'id': 'kpxcDefine-btn-skip' }, tr('defineSkip'));
    buttonSkip.style.marginRight = '5px';
    buttonSkip.onclick = function() {
        if (kpxcDefine.dataStep === 1) {
            kpxcDefine.selection.username = null;
            kpxcDefine.prepareStep2();
            kpxcDefine.markAllPasswordFields('#kpxcDefine-fields');
        } else if (kpxcDefine.dataStep === 2) {
            kpxcDefine.selection.password = null;
            kpxcDefine.prepareStep3();
            kpxcDefine.markAllStringFields('#kpxcDefine-fields');
        }
    };

    const buttonAgain = kpxcUI.createElement('button', 'kpxc-button kpxc-blue-button', { 'id': 'kpxcDefine-btn-again' }, tr('defineAgain'));
    buttonAgain.style.marginRight = '5px';
    buttonAgain.onclick = function() {
        kpxcDefine.resetSelection();
        kpxcDefine.prepareStep1();
        kpxcDefine.markAllUsernameFields('#kpxcDefine-fields');
    };

    const buttonConfirm = kpxcUI.createElement('button', 'kpxc-button kpxc-green-button', { 'id': 'kpxcDefine-btn-confirm' }, tr('defineConfirm'));
    buttonConfirm.style.marginRight = '15px';
    buttonConfirm.style.display = 'none';
    buttonConfirm.onclick = function() {
        if (!kpxc.settings['defined-custom-fields']) {
            kpxc.settings['defined-custom-fields'] = {};
        }

        if (kpxcDefine.selection.username) {
            kpxcDefine.selection.username = kpxcFields.prepareId(kpxcDefine.selection.username);
        }

        if (kpxcDefine.selection.password) {
            kpxcDefine.selection.password = kpxcFields.prepareId(kpxcDefine.selection.password);
        }

        const fieldIds = [];
        const fieldKeys = Object.keys(kpxcDefine.selection.fields);
        for (const i of fieldKeys) {
            fieldIds.push(kpxcFields.prepareId(i));
        }

        const location = kpxc.getDocumentLocation();
        kpxc.settings['defined-custom-fields'][location] = {
            username: kpxcDefine.selection.username,
            password: kpxcDefine.selection.password,
            fields: fieldIds
        };

        browser.runtime.sendMessage({
            action: 'save_settings',
            args: [ kpxc.settings ]
        });

        kpxcDefine.close();
    };

    description.append(buttonConfirm);
    description.append(buttonSkip);
    description.append(buttonAgain);
    description.append(buttonDismiss);

    const location = kpxc.getDocumentLocation();
    if (kpxc.settings['defined-custom-fields'] && kpxc.settings['defined-custom-fields'][location]) {
        const div = kpxcUI.createElement('div', '', {});
        const defineDiscard = kpxcUI.createElement('p', '', {}, tr('defineAlreadySelected'));
        const buttonDiscard = kpxcUI.createElement('button', 'kpxc-button kpxc-red-button', { 'id': 'kpxcDefine-btn-discard' }, tr('defineDiscard'));
        buttonDiscard.style.marginTop = '5px';
        buttonDiscard.onclick = function() {
            delete kpxc.settings['defined-custom-fields'][location];

            browser.runtime.sendMessage({
                action: 'save_settings',
                args: [ kpxc.settings ]
            });

            browser.runtime.sendMessage({
                action: 'load_settings'
            });

            div.remove();

            kpxcDefine.resetSelection();
            kpxcDefine.prepareStep1();
            kpxcDefine.markAllUsernameFields('#kpxcDefine-fields');
        };

        div.append(defineDiscard);
        div.append(buttonDiscard);
        description.append(div);
    }
};

kpxcDefine.resetSelection = function() {
    kpxcDefine.selection = {
        username: null,
        password: null,
        fields: []
    };

    const fields = $('#kpxcDefine-fields');
    if (fields) {
        fields.textContent = '';
    }
};

kpxcDefine.isFieldSelected = function(kpxcId) {
    if (kpxcId) {
        return (
            kpxcId === kpxcDefine.selection.username ||
            kpxcId === kpxcDefine.selection.password ||
            kpxcId in kpxcDefine.selection.fields
        );
    }
    return false;
};

kpxcDefine.markAllUsernameFields = function(chooser) {
    kpxcDefine.eventFieldClick = function(e) {
        const field = e.currentTarget;
        kpxcDefine.selection.username = field.getAttribute('data-kpxc-id');
        field.classList.add('kpxcDefine-fixed-username-field');
        field.textContent = tr('username');
        field.onclick = null;
        kpxcDefine.prepareStep2();
        kpxcDefine.markAllPasswordFields('#kpxcDefine-fields');
    };
    kpxcDefine.markFields(chooser, kpxcFields.inputQueryPattern);
};

kpxcDefine.markAllPasswordFields = function(chooser) {
    kpxcDefine.eventFieldClick = function(e) {
        const field = e.currentTarget;
        kpxcDefine.selection.password = field.getAttribute('data-kpxc-id');
        field.classList.add('kpxcDefine-fixed-password-field');
        field.textContent = tr('password');
        field.onclick = null;
        kpxcDefine.prepareStep3();
        kpxcDefine.markAllStringFields('kpxcDefine-fields');
    };
    kpxcDefine.markFields(chooser, 'input[type=\'password\']');
};

kpxcDefine.markAllStringFields = function(chooser) {
    kpxcDefine.eventFieldClick = function(e) {
        const field = e.currentTarget;
        const value = field.getAttribute('data-kpxc-id');
        kpxcDefine.selection.fields[value] = true;

        const count = Object.keys(kpxcDefine.selection.fields).length;
        field.classList.add('kpxcDefine-fixed-string-field');
        field.textContent = tr('defineStringField') + String(count);
        field.onclick = null;
    };
    kpxcDefine.markFields(chooser, kpxcFields.inputQueryPattern + ', select');
};

kpxcDefine.markFields = function(chooser, pattern) {
    const inputs = document.querySelectorAll(pattern);
    for (const i of inputs) {
        if (kpxcDefine.isFieldSelected(i.getAttribute('data-kpxc-id'))) {
            return true;
        }

        if (kpxcFields.isVisible(i)) {
            const field = kpxcUI.createElement('div', 'kpxcDefine-fixed-field', { 'data-kpxc-id': i.getAttribute('data-kpxc-id') });
            const rect = i.getBoundingClientRect();
            field.style.top = rect.top + 'px';
            field.style.left = rect.left + 'px';
            field.style.width = rect.width + 'px';
            field.style.height = rect.height + 'px';
            field.onclick = function(e) {
                kpxcDefine.eventFieldClick(e);
            };
            field.onmouseenter = function() {
                field.classList.add('kpxcDefine-fixed-hover-field');
            };
            field.onmouseleave = function() {
                field.classList.remove('kpxcDefine-fixed-hover-field');
            };
            const elem = $(chooser);
            if (elem) {
                elem.append(field);
            }
        }
    }
};

kpxcDefine.prepareStep1 = function() {
    const help = $('#kpxcDefine-help');
    help.style.marginBottom = '0px';
    help.textContent = '';

    removeContent('div#kpxcDefine-fixed-field');
    $('#kpxcDefine-chooser-headline').textContent = tr('defineChooseUsername');
    kpxcDefine.dataStep = 1;
    $('#kpxcDefine-btn-skip').style.display = 'inline-block';
    $('#kpxcDefine-btn-confirm').style.display = 'none';
    $('#kpxcDefine-btn-again').style.display = 'none';
};

kpxcDefine.prepareStep2 = function() {
    const help = $('#kpxcDefine-help');
    help.style.marginBottom = '0px';
    help.textContent = '';

    removeContent('div.kpxcDefine-fixed-field:not(.kpxcDefine-fixed-username-field)');
    $('#kpxcDefine-chooser-headline').textContent = tr('defineChoosePassword');
    kpxcDefine.dataStep = 2;
    $('#kpxcDefine-btn-again').style.display = 'inline-block';
};

kpxcDefine.prepareStep3 = function() {
    $('#kpxcDefine-help').style.marginBottom = '10px';
    $('#kpxcDefine-help').textContent = tr('defineHelpText');

    removeContent('div.kpxcDefine-fixed-field:not(.kpxcDefine-fixed-username-field):not(.kpxcDefine-fixed-password-field)');
    $('#kpxcDefine-chooser-headline').textContent = tr('defineConfirmSelection');
    kpxcDefine.dataStep = 3;
    $('#kpxcDefine-btn-skip').style.display = 'none';
    $('#kpxcDefine-btn-again').style.display = 'inline-block';
    $('#kpxcDefine-btn-confirm').style.display = 'inline-block';
};

const removeContent = function(pattern) {
    const elems = document.querySelectorAll(pattern);
    for (const e of elems) {
        e.remove();
    }
};
