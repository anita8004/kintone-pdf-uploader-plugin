jQuery.noConflict();
(function($, PLUGIN_ID) {
  'use strict';
  // Get configuration settings
  var CONF = kintone.plugin.app.getConfig(PLUGIN_ID);
  var $form = $('.js-submit-settings');
  var $saveButton = $('.js-save-button');
  var $cancelButton = $('.js-cancel-button');
  var $space = $('select[name="js-select-space-field"]');
  var $pdfTable = $('.pdf-uploader-setting-table--pdf');
  var $recordTable = $('.pdf-uploader-setting-table--record');
  const config = {};
  const textOptions = [];

  function setDropDown(type) {
    // Retrieve field information, then set drop-down
    return KintoneConfigHelper.getFields(['SPACER', 'SINGLE_LINE_TEXT', 'LINK']).then(function(resp) {
      var $spaceDropDown = $space;
      resp.forEach(function(respField) {
        var $option = $('<option></option>');
        switch (respField.type) {
          case 'SPACER':
            if (!respField.elementId) {
              break;
            }
            $option.attr('value', respField.elementId);
            $option.text(respField.elementId);
            $spaceDropDown.append($option.clone());
            break;
          case 'LINK':
          case 'SINGLE_LINE_TEXT':
            textOptions.push({
              label: respField.label,
              value: respField.code
            })
            break;
          default:
            break;
        }
      });

      if (CONF.space) {
        $spaceDropDown.val(CONF.space);
      }
    }, function(resp) {
      return alert('Failed to retrieve fields information');
    });
  }

  function createPDFTable() {
    const renderCell = cellData => {
      const text = new Kuc.Text({ value: cellData});
      return text;
    }
    const columns = [
      {
        title: 'PDF欄位ID',
        field: 'pdf_id',
        render: renderCell
      },
      {
        title: '客製化變數',
        field: 'pdf_code',
        render: renderCell
      },
    ]
    const defaultRowData = {
      pdf_id: '',
      pdf_code: ''
    }

    const initialData = CONF.pdf_setting ? JSON.parse(CONF.pdf_setting) : [defaultRowData];

    const table = new Kuc.Table({
      data: initialData,
      columns
    })
    $pdfTable.append(table);
    return table;
  }

  function createRecordTable() {
    const columns = [
      {
        title: '欄位名稱',
        field: 'field_id',
        render: cellData => {
          const dropdown = new Kuc.Dropdown({
            items: textOptions,
            value: cellData
          })
          return dropdown
        }
      },
      {
        title: '值',
        field: 'format',
        render: cellData => {
          const text = new Kuc.Text({ value: cellData});
          return text;
        }
      }
    ]
    
    const defaultRowData = {
      field_id: '',
      format: ''
    }

    const initialData = CONF.fields_setting ? JSON.parse(CONF.fields_setting) : [defaultRowData];

    const table = new Kuc.Table({
      data: initialData,
      columns
    })

    $recordTable.append(table);

    return table;
  }

  $(document).ready(async function() {
    // Set drop-down list
    await setDropDown();
    const pdfTable = await createPDFTable();
    const recordTable = await createRecordTable();
    pdfTable.addEventListener('change', event => {
      config.pdf_setting = JSON.stringify(event.detail.data);
    });

    recordTable.addEventListener('change', event => {
      config.fields_setting = JSON.stringify(event.detail.data);
    });

    $form.on('submit', function(e) {
      e.preventDefault();
      return;
    })

    // Set input values when 'Save' button is clicked
    $saveButton.on('click', function(e) {
      e.preventDefault();
      config.space = $space.val();

      kintone.plugin.app.setConfig(config, function() {
        alert('The plug-in settings have been saved. Please update the app!');
        window.location.href = '/k/admin/app/flow?app=' + kintone.app.getId();
      });
    });
    // Process when 'Cancel' is clicked
    $cancelButton.on('click', function() {
      window.location.href = '/k/admin/app/' + kintone.app.getId() + '/plugin/';
    });
  });
})(jQuery, kintone.$PLUGIN_ID);