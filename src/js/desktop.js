(function(PLUGIN_ID) {
  'use strict';

  // Get plug-in configuration settings
  var CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) {
    return false;
  }

  // Get each setting
  var CONFIG_SPACE = CONFIG.space;
  var CONFIG_PDF_SETTING = CONFIG.pdf_setting;
  var CONFIG_FIELDS_SETTING = CONFIG.fields_setting;

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], async function(event) {
    const record = event.record;
    const { PDFDocument } = PDFLib;

    // Create PDF Uploader Input
    const uploadButtonWrap = document.createElement('div');
    uploadButtonWrap.className = "upload-btn";
    const uploadButtonLabel = document.createElement('span');
    uploadButtonLabel.innerText = "PDF File Uploader";
    const uploadButton = document.createElement('input');
    uploadButton.setAttribute('class', 'file-selector');
    uploadButton.setAttribute('type', 'file');
    uploadButton.setAttribute('accept', '.pdf');
    uploadButtonWrap.append(uploadButtonLabel, uploadButton);

    // 读取pdf档
    function readFileAsync(file) {
      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    /**
     * 比较两个阵列，回传重复的值
     * @param {string[]} arr1 
     * @param {string[]} arr2 
     * @returns string[]
     */
    const compareSame = (arr1, arr2) => {
      return arr1.filter(item => arr2.includes(item))
    }

    /**
     * 更新栏位
     * @param {string} fileName 
     * @param {File} form 
     */
    const setRecord = (fileName, form) => {
      const recordSetting = JSON.parse(CONFIG_FIELDS_SETTING);
      const pdfSetting = JSON.parse(CONFIG_PDF_SETTING);
      const pdfVariableValues = {};
      pdfSetting.forEach(({ pdf_id, pdf_code }) => {
        if (form.getTextField(pdf_id)) {
          pdfVariableValues[pdf_code] = form.getTextField(pdf_id).getText();
        } else {
          pdfVariableValues[pdf_code] = '';
        }
      })
      const formatValue = (format) => {
        return format.replace(/\${(.*?)}/g, (match, variable) => {
          return pdfVariableValues[variable] || match;
        })
      }
      recordSetting.forEach(({ field_id, format }) => {
        record[field_id]['value'] = formatValue(format);
      })
      record['pdf_name']['value'] = fileName;
      kintone.app.record.set({record: record});
    }

    /** 上传档案变更时触发 */
    const onFileSelected = async (e) => {
      const fileList = e.target.files;
      if (fileList?.length > 0) {
        const targetFile = fileList[0];
        const pdfArrayBuffer = await readFileAsync(targetFile);
        const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
        const form = pdfDoc.getForm()
        setRecord(targetFile.name, form)
      }
    };

    // Get the element of the Blank space field
    var se = kintone.app.record.getSpaceElement(CONFIG_SPACE);
    se.prepend(uploadButtonWrap);
    uploadButton.addEventListener('change', onFileSelected);
  })

})(kintone.$PLUGIN_ID);